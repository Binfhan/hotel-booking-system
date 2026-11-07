package com.hotel.booking.patterns.structural.facade;

import com.hotel.booking.dto.BookingDtos.*;
import com.hotel.booking.entity.*;
import com.hotel.booking.enums.BookingAction;
import com.hotel.booking.enums.BookingStatus;
import com.hotel.booking.enums.PaymentStatus;
import com.hotel.booking.enums.RoleType;
import com.hotel.booking.exception.BusinessRuleException;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.patterns.behavioral.observer.BookingEvent;
import com.hotel.booking.patterns.behavioral.observer.BookingEventPublisher;
import com.hotel.booking.patterns.behavioral.state.BookingStateResolver;
import com.hotel.booking.patterns.behavioral.strategy.discount.DiscountContextService;
import com.hotel.booking.patterns.behavioral.strategy.discount.DiscountContextService.DiscountEvaluation;
import com.hotel.booking.patterns.behavioral.strategy.payment.PaymentContextService;
import com.hotel.booking.patterns.creational.builder.BookingOrder;
import com.hotel.booking.patterns.structural.decorator.BookingCostBuilderService;
import com.hotel.booking.patterns.structural.decorator.BookingCostBuilderService.DecoratedCostResult;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.RoomRepository;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * STRUCTURAL PATTERN 4: Facade Pattern
 * Provides a unified high-level interface to orchestrate the complex hotel booking workflow:
 * Availability Check -> Decorator Cost Calculation -> Strategy Discount -> Booking Creation
 * -> Strategy Payment -> State Transition -> Observer Notification.
 */
@Service
@RequiredArgsConstructor
public class BookingFacade {

    private static final DateTimeFormatter VN_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final RoomService roomService;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BookingCostBuilderService costBuilderService;
    private final DiscountContextService discountContextService;
    private final PaymentContextService paymentContextService;
    private final BookingStateResolver stateResolver;
    private final BookingEventPublisher eventPublisher;

    public PriceBreakdownResponse previewBookingPrice(BookingOrder order) {
        Room room = roomService.validateRoomForBooking(
                order.getRoomId(),
                order.getCheckInDate(),
                order.getCheckOutDate(),
                order.getGuestCount()
        );

        DecoratedCostResult decorated = costBuilderService.calculateDecoratedCost(room, order);
        DiscountEvaluation discountEval = discountContextService.evaluateVoucher(
                order.getVoucherCode(),
                decorated.getSubTotal(),
                order.getStayNights(),
                room.getRoomType()
        );

        BigDecimal totalAmount = decorated.getSubTotal()
                .subtract(discountEval.getDiscountAmount())
                .max(BigDecimal.ZERO);

        List<BookingServiceItemDto> addonDtos = decorated.getServiceItems().stream()
                .map(item -> BookingServiceItemDto.builder()
                        .serviceType(item.getServiceType())
                        .serviceName(item.getServiceName())
                        .price(item.getPrice())
                        .build())
                .collect(Collectors.toList());

        return PriceBreakdownResponse.builder()
                .roomId(room.getId())
                .roomName(room.getName())
                .nights(order.getStayNights())
                .guestCount(order.getGuestCount())
                .baseRoomCost(decorated.getBaseRoomCost())
                .addonServicesCost(decorated.getAddonServicesCost())
                .subTotal(decorated.getSubTotal())
                .appliedVoucherCode(discountEval.getVoucher() != null ? discountEval.getVoucher().getCode() : null)
                .discountAmount(discountEval.getDiscountAmount())
                .totalAmount(totalAmount)
                .decoratorDescription(decorated.getDescription())
                .addonItems(addonDtos)
                .build();
    }

    @Transactional
    public BookingResponse placeBooking(BookingOrder order) {
        User user = userRepository.findById(order.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + order.getUserId()));

        Room room = roomService.validateRoomForBooking(
                order.getRoomId(),
                order.getCheckInDate(),
                order.getCheckOutDate(),
                order.getGuestCount()
        );

        // 1. Decorator Pattern: Calculate base room cost + add-on services
        DecoratedCostResult decorated = costBuilderService.calculateDecoratedCost(room, order);

        // 2. Strategy Pattern: Evaluate voucher discount
        DiscountEvaluation discountEval = discountContextService.evaluateVoucher(
                order.getVoucherCode(),
                decorated.getSubTotal(),
                order.getStayNights(),
                room.getRoomType()
        );

        BigDecimal totalAmount = decorated.getSubTotal()
                .subtract(discountEval.getDiscountAmount())
                .max(BigDecimal.ZERO);

        String bookingCode = "BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Booking booking = Booking.builder()
                .bookingCode(bookingCode)
                .user(user)
                .room(room)
                .voucher(discountEval.getVoucher())
                .checkInDate(order.getCheckInDate())
                .checkOutDate(order.getCheckOutDate())
                .guestCount(order.getGuestCount())
                .baseRoomCost(decorated.getBaseRoomCost())
                .addonServicesCost(decorated.getAddonServicesCost())
                .discountAmount(discountEval.getDiscountAmount())
                .totalAmount(totalAmount)
                .costBreakdownDescription(decorated.getDescription())
                .status(BookingStatus.PENDING)
                .specialRequests(order.getSpecialRequests())
                .build();

        for (BookingServiceItem serviceItem : decorated.getServiceItems()) {
            serviceItem.setBooking(booking);
            booking.getAddonServices().add(serviceItem);
        }

        // 3. Strategy Pattern: Execute payment
        Payment payment = paymentContextService.executePayment(booking, order.getPaymentMethod());
        booking.setPayment(payment);

        // 4. State Pattern: If online payment is PAID, transition PENDING -> CONFIRMED automatically
        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            stateResolver.applyAction(booking, BookingAction.CONFIRM);
        }

        roomRepository.save(room);
        Booking savedBooking = bookingRepository.save(booking);

        // 5. Observer Pattern: Notify all observers with full invoice breakdown
        String addonSummary = savedBooking.getAddonServices().isEmpty()
                ? "Không có"
                : savedBooking.getAddonServices().stream()
                        .map(s -> String.format("%s (%,.0f VNĐ)", s.getServiceName(), s.getPrice()))
                        .collect(Collectors.joining(", "));
        String voucherSummary = savedBooking.getVoucher() != null
                ? String.format("%s (-%,.0f VNĐ)", savedBooking.getVoucher().getCode(), savedBooking.getDiscountAmount())
                : "Không áp dụng (0 VNĐ)";

        String msg = String.format(
                "Đặt phòng %s (Phòng %s - %s) thành công | Nhận phòng: %s -> Trả phòng: %s (%d đêm, %d khách) | "
                        + "Tiền phòng gốc: %,.0f VNĐ | Dịch vụ cộng thêm: %s | Giảm giá Voucher: %s | "
                        + "TỔNG THANH TOÁN: %,.0f VNĐ | Trạng thái đơn: %s | Trạng thái phòng: %s.",
                room.getName(),
                room.getRoomNumber(),
                room.getLocation(),
                savedBooking.getCheckInDate().format(VN_DATE_FMT),
                savedBooking.getCheckOutDate().format(VN_DATE_FMT),
                order.getStayNights(),
                savedBooking.getGuestCount(),
                savedBooking.getBaseRoomCost(),
                addonSummary,
                voucherSummary,
                savedBooking.getTotalAmount(),
                savedBooking.getStatus(),
                room.getStatus()
        );
        eventPublisher.notifyObservers(new BookingEvent("BOOKING_CREATED", savedBooking, msg));

        return toBookingResponse(savedBooking);
    }

    @Transactional
    public BookingResponse transitionBookingState(Long bookingId, BookingAction action, User actor) {
        Booking booking = getBookingEntityById(bookingId);

        if (actor.getRole() != RoleType.ROLE_ADMIN) {
            if (!booking.getUser().getId().equals(actor.getId())) {
                throw new BusinessRuleException("Bạn không có quyền thao tác trên đơn đặt phòng của người khác.");
            }
            if (action != BookingAction.CANCEL) {
                throw new BusinessRuleException("Khách hàng chỉ có quyền yêu cầu hủy (CANCEL) đơn đặt phòng.");
            }
        }

        BookingStatus previousStatus = booking.getStatus();
        stateResolver.applyAction(booking, action);
        if (booking.getRoom() != null) {
            roomRepository.save(booking.getRoom());
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            BookingResponse cancelledResponse = toBookingResponse(booking);
            String cancelMessage = String.format(
                    "Đơn đặt phòng #%s (Phòng %s) đã được hủy. Trạng thái phòng %s đã tự động chuyển về %s.",
                    booking.getBookingCode(),
                    booking.getRoom().getRoomNumber(),
                    booking.getRoom().getRoomNumber(),
                    booking.getRoom().getStatus()
            );
            eventPublisher.notifyObservers(new BookingEvent("BOOKING_CANCELLED", booking, cancelMessage));
            bookingRepository.delete(booking);
            return cancelledResponse;
        }

        Booking saved = bookingRepository.save(booking);

        String message = String.format(
                "Đơn đặt phòng #%s (Phòng %s) đã chuyển trạng thái từ %s sang %s (Trạng thái phòng hiện tại: %s).",
                saved.getBookingCode(),
                saved.getRoom().getRoomNumber(),
                previousStatus,
                saved.getStatus(),
                saved.getRoom().getStatus()
        );
        eventPublisher.notifyObservers(new BookingEvent("BOOKING_STATE_CHANGED", saved, message));

        return toBookingResponse(saved);
    }

    @Transactional
    public BookingResponse updatePaymentStatus(Long bookingId, PaymentStatus newStatus) {
        Booking booking = getBookingEntityById(bookingId);
        Payment payment = booking.getPayment();
        if (payment == null) {
            throw new ResourceNotFoundException("Không tìm thấy thông tin thanh toán của đơn đặt phòng.");
        }
        payment.setPaymentStatus(newStatus);
        if (newStatus == PaymentStatus.PAID && payment.getPaidAt() == null) {
            payment.setPaidAt(LocalDateTime.now());
        }
        // Tự động chuyển trạng thái đơn từ PENDING -> CONFIRMED khi thanh toán chuyển sang PAID
        if (newStatus == PaymentStatus.PAID && booking.getStatus() == BookingStatus.PENDING) {
            stateResolver.applyAction(booking, BookingAction.CONFIRM);
            if (booking.getRoom() != null) {
                roomRepository.save(booking.getRoom());
            }
        }
        Booking saved = bookingRepository.save(booking);

        String message = String.format(
                "Trạng thái thanh toán của đơn #%s đã được cập nhật thành %s (Trạng thái đơn: %s, Trạng thái phòng: %s).",
                saved.getBookingCode(),
                newStatus,
                saved.getStatus(),
                saved.getRoom().getStatus()
        );
        eventPublisher.notifyObservers(new BookingEvent("PAYMENT_STATUS_UPDATED", saved, message));

        return toBookingResponse(saved);
    }

    public List<BookingResponse> getUserBookings(Long userId) {
        return bookingRepository.findByUserIdAndStatusNotOrderByCreatedAtDesc(userId, BookingStatus.CANCELLED).stream()
                .map(this::toBookingResponse)
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findByStatusNotOrderByCreatedAtDesc(BookingStatus.CANCELLED).stream()
                .map(this::toBookingResponse)
                .collect(Collectors.toList());
    }

    public BookingResponse getBookingById(Long id, User actor) {
        Booking booking = getBookingEntityById(id);
        if (actor.getRole() != RoleType.ROLE_ADMIN && !booking.getUser().getId().equals(actor.getId())) {
            throw new BusinessRuleException("Bạn không có quyền xem đơn đặt phòng này.");
        }
        return toBookingResponse(booking);
    }

    public Booking getBookingEntityById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng với ID: " + id));
    }

    public BookingResponse toBookingResponse(Booking booking) {
        long nights = ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate());
        String primaryImage = booking.getRoom().getImages().isEmpty()
                ? null
                : booking.getRoom().getImages().get(0).getImageUrl();

        List<BookingServiceItemDto> addonDtos = booking.getAddonServices().stream()
                .map(item -> BookingServiceItemDto.builder()
                        .serviceType(item.getServiceType())
                        .serviceName(item.getServiceName())
                        .price(item.getPrice())
                        .build())
                .collect(Collectors.toList());

        PaymentDto paymentDto = null;
        if (booking.getPayment() != null) {
            Payment p = booking.getPayment();
            paymentDto = PaymentDto.builder()
                    .id(p.getId())
                    .paymentMethod(p.getPaymentMethod())
                    .paymentStatus(p.getPaymentStatus())
                    .transactionRef(p.getTransactionRef())
                    .amount(p.getAmount())
                    .paidAt(p.getPaidAt())
                    .build();
        }

        return BookingResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .userId(booking.getUser().getId())
                .customerName(booking.getUser().getFullName())
                .customerEmail(booking.getUser().getEmail())
                .customerPhone(booking.getUser().getPhone())
                .roomId(booking.getRoom().getId())
                .roomNumber(booking.getRoom().getRoomNumber())
                .roomName(booking.getRoom().getName())
                .roomType(booking.getRoom().getRoomType())
                .roomLocation(booking.getRoom().getLocation())
                .roomPrimaryImage(primaryImage)
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .nights(nights)
                .guestCount(booking.getGuestCount())
                .baseRoomCost(booking.getBaseRoomCost())
                .addonServicesCost(booking.getAddonServicesCost())
                .voucherCode(booking.getVoucher() != null ? booking.getVoucher().getCode() : null)
                .discountAmount(booking.getDiscountAmount())
                .totalAmount(booking.getTotalAmount())
                .costBreakdownDescription(booking.getCostBreakdownDescription())
                .status(booking.getStatus())
                .specialRequests(booking.getSpecialRequests())
                .addonServices(addonDtos)
                .payment(paymentDto)
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
