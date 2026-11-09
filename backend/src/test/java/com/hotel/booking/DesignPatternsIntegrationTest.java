package com.hotel.booking;

import com.hotel.booking.dto.BookingDtos.BookingResponse;
import com.hotel.booking.dto.DashboardDtos.CreateOrUpdateVoucherRequest;
import com.hotel.booking.dto.RoomDtos.CreateOrUpdateRoomRequest;
import com.hotel.booking.dto.RoomDtos.RoomDto;
import com.hotel.booking.entity.Booking;
import com.hotel.booking.entity.Payment;
import com.hotel.booking.entity.Room;
import com.hotel.booking.entity.User;
import com.hotel.booking.entity.Voucher;
import com.hotel.booking.enums.*;
import com.hotel.booking.exception.BusinessRuleException;
import com.hotel.booking.patterns.behavioral.state.BookingStateResolver;
import com.hotel.booking.patterns.behavioral.strategy.discount.FixedAmountDiscountStrategy;
import com.hotel.booking.patterns.behavioral.strategy.discount.PercentageDiscountStrategy;
import com.hotel.booking.patterns.behavioral.strategy.discount.SeasonalDiscountStrategy;
import com.hotel.booking.patterns.behavioral.strategy.payment.PaymentContextService;
import com.hotel.booking.patterns.creational.builder.BookingOrder;
import com.hotel.booking.patterns.creational.builder.RoomSearchCriteria;
import com.hotel.booking.patterns.structural.decorator.AirportPickupDecorator;
import com.hotel.booking.patterns.structural.decorator.BaseRoomBookingCost;
import com.hotel.booking.patterns.structural.decorator.BookingCostBuilderService;
import com.hotel.booking.patterns.structural.decorator.BookingCostBuilderService.DecoratedCostResult;
import com.hotel.booking.patterns.structural.decorator.BookingCostComponent;
import com.hotel.booking.patterns.structural.decorator.BreakfastDecorator;
import com.hotel.booking.patterns.structural.facade.BookingFacade;
import com.hotel.booking.repository.NotificationRepository;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.service.DashboardService;
import com.hotel.booking.service.RoomService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("h2")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DesignPatternsIntegrationTest {

    @Autowired
    private RoomService roomService;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private BookingFacade bookingFacade;

    @Autowired
    private BookingCostBuilderService costBuilderService;

    @Autowired
    private PercentageDiscountStrategy percentageDiscountStrategy;

    @Autowired
    private FixedAmountDiscountStrategy fixedAmountDiscountStrategy;

    @Autowired
    private SeasonalDiscountStrategy seasonalDiscountStrategy;

    @Autowired
    private PaymentContextService paymentContextService;

    @Autowired
    private BookingStateResolver stateResolver;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    @Order(1)
    @DisplayName("TC-01: Kiểm thử Builder Pattern - Hợp lệ (BookingOrder & RoomSearchCriteria)")
    void testTc01_BuilderPattern_Valid() {
        BookingOrder order = BookingOrder.builder()
                .userId(1L)
                .roomId(1L)
                .dates(LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 4))
                .guestCount(2)
                .addService(AddonServiceType.BREAKFAST)
                .voucherCode("welcome10")
                .paymentMethod(PaymentMethodType.CREDIT_CARD)
                .specialRequests("Phòng tầng cao")
                .build();

        assertEquals(3, order.getStayNights());
        assertEquals("WELCOME10", order.getVoucherCode());
        assertEquals(1, order.getAddonServices().size());
        assertEquals(PaymentMethodType.CREDIT_CARD, order.getPaymentMethod());

        RoomSearchCriteria criteria = RoomSearchCriteria.builder()
                .location("Đà Nẵng")
                .minGuests(2)
                .priceRange(new BigDecimal("500000"), new BigDecimal("2000000"))
                .build();

        List<RoomDto> results = roomService.searchRooms(criteria);
        assertFalse(results.isEmpty());
    }

    @Test
    @Order(2)
    @DisplayName("TC-02: Kiểm thử Builder Pattern - Ngày nhận/trả phòng không hợp lệ")
    void testTc02_BuilderPattern_InvalidDateThrowsException() {
        assertThrows(BusinessRuleException.class, () -> BookingOrder.builder()
                .roomId(1L)
                .dates(LocalDate.of(2026, 12, 5), LocalDate.of(2026, 12, 2))
                .guestCount(2)
                .build());

        assertThrows(BusinessRuleException.class, () -> BookingOrder.builder()
                .roomId(1L)
                .dates(LocalDate.of(2026, 12, 2), LocalDate.of(2026, 12, 4))
                .guestCount(0)
                .build());
    }

    @Test
    @Order(3)
    @DisplayName("TC-03: Kiểm thử Factory Method Pattern - Khởi tạo 3 hạng phòng STANDARD, DELUXE, SUITE")
    void testTc03_FactoryMethodPattern_AllRoomCategories() {
        RoomDto standardRoom = roomService.createRoom(new CreateOrUpdateRoomRequest(
                "P901", "Test Standard Factory", RoomType.STANDARD, "Đà Nẵng",
                null, null, null, RoomStatus.AVAILABLE, null, null, null
        ));
        assertEquals("STANDARD", standardRoom.getRoomType());
        assertEquals(2, standardRoom.getCapacity());
        assertEquals(0, new BigDecimal("850000").compareTo(standardRoom.getPricePerNight()));
        assertFalse(standardRoom.getAmenities().isEmpty());

        RoomDto deluxeRoom = roomService.createRoom(new CreateOrUpdateRoomRequest(
                "P902", "Test Deluxe Factory", RoomType.DELUXE, "Nha Trang",
                null, null, null, RoomStatus.AVAILABLE, null, null, null
        ));
        assertEquals("DELUXE", deluxeRoom.getRoomType());
        assertEquals(3, deluxeRoom.getCapacity());
        assertEquals(0, new BigDecimal("1550000").compareTo(deluxeRoom.getPricePerNight()));

        RoomDto suiteRoom = roomService.createRoom(new CreateOrUpdateRoomRequest(
                "P903", "Test Suite Factory", RoomType.SUITE, "Hà Nội",
                null, null, null, RoomStatus.AVAILABLE, null, null, null
        ));
        assertEquals("SUITE", suiteRoom.getRoomType());
        assertEquals(4, suiteRoom.getCapacity());
        assertEquals(0, new BigDecimal("2950000").compareTo(suiteRoom.getPricePerNight()));
        assertFalse(suiteRoom.getAmenities().isEmpty());
    }

    @Test
    @Order(4)
    @DisplayName("TC-04: Kiểm thử Decorator Pattern - Chi phí phòng gốc (BaseRoomBookingCost)")
    void testTc04_DecoratorPattern_BaseRoomCost() {
        BookingCostComponent baseCost = new BaseRoomBookingCost("Deluxe Ocean", new BigDecimal("1200000"), 2);

        assertEquals(0, new BigDecimal("2400000").compareTo(baseCost.calculateCost()));
        assertTrue(baseCost.getDescription().contains("Tiền phòng Deluxe Ocean (2 đêm"));
    }

    @Test
    @Order(5)
    @DisplayName("TC-05: Kiểm thử Decorator Pattern - Bọc nhiều dịch vụ gia tăng lũy kế")
    void testTc05_DecoratorPattern_WrapMultipleAddons() {
        BookingCostComponent cost = new BaseRoomBookingCost("Deluxe Ocean", new BigDecimal("1200000"), 2);
        cost = new BreakfastDecorator(cost, 2, 2); // +600,000 (150,000 * 2 khách * 2 đêm)
        cost = new AirportPickupDecorator(cost);   // +350,000

        assertEquals(0, new BigDecimal("3350000").compareTo(cost.calculateCost()));
        assertTrue(cost.getDescription().contains("Buffet sáng"));
        assertTrue(cost.getDescription().contains("Xe riêng đưa đón sân bay 2 chiều"));

        // Kiểm tra qua BookingCostBuilderService với cả 4 dịch vụ (BREAKFAST, AIRPORT_PICKUP, EXTRA_BED, SPA)
        Room mockRoom = Room.builder()
                .name("Suite Royal")
                .pricePerNight(new BigDecimal("1000000"))
                .build();
        BookingOrder order = BookingOrder.builder()
                .roomId(1L)
                .dates(LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 3))
                .guestCount(2)
                .addonServices(List.of(
                        AddonServiceType.BREAKFAST,
                        AddonServiceType.AIRPORT_PICKUP,
                        AddonServiceType.EXTRA_BED,
                        AddonServiceType.SPA
                ))
                .build();
        DecoratedCostResult result = costBuilderService.calculateDecoratedCost(mockRoom, order);
        // Base: 2,000,000 + Breakfast: 600,000 + Airport: 350,000 + ExtraBed: 600,000 + Spa: 800,000 = 4,350,000
        assertEquals(0, new BigDecimal("4350000").compareTo(result.getSubTotal()));
        assertEquals(4, result.getServiceItems().size());
    }

    @Test
    @Order(6)
    @DisplayName("TC-06: Kiểm thử Strategy Pattern - Giảm giá theo Phần trăm (PercentageDiscountStrategy)")
    void testTc06_StrategyPattern_PercentageDiscount() {
        Voucher percentVoucher = Voucher.builder()
                .code("WELCOME10")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("10"))
                .build();

        BigDecimal discount = percentageDiscountStrategy.calculateDiscount(
                new BigDecimal("3000000"), percentVoucher, 2
        );
        assertEquals(0, new BigDecimal("300000").compareTo(discount));
    }

    @Test
    @Order(7)
    @DisplayName("TC-07: Kiểm thử Strategy Pattern - Giảm giá Cố định & Mùa vụ dài ngày (Fixed & Seasonal)")
    void testTc07_StrategyPattern_FixedAmountAndSeasonalDiscount() {
        Voucher fixedVoucher = Voucher.builder()
                .code("SAVE200K")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("200000"))
                .build();

        BigDecimal fixedDiscount = fixedAmountDiscountStrategy.calculateDiscount(
                new BigDecimal("3000000"), fixedVoucher, 2
        );
        assertEquals(0, new BigDecimal("200000").compareTo(fixedDiscount));

        Voucher seasonalVoucher = Voucher.builder()
                .code("SUMMER15")
                .discountType(DiscountType.SEASONAL)
                .discountValue(new BigDecimal("15"))
                .build();

        // Lưu trú 3 đêm (>= 3 đêm được cộng thêm 5% bonus -> tổng giảm 20% của 3,000,000 = 600,000)
        BigDecimal seasonalDiscount = seasonalDiscountStrategy.calculateDiscount(
                new BigDecimal("3000000"), seasonalVoucher, 3
        );
        assertEquals(0, new BigDecimal("600000").compareTo(seasonalDiscount));
    }

    @Test
    @Order(8)
    @DisplayName("TC-08: Kiểm thử Strategy Pattern - Thanh toán Thẻ tín dụng, Ví điện tử và Tiền mặt")
    void testTc08_StrategyPattern_PaymentStrategies() {
        Booking sampleBooking = Booking.builder()
                .bookingCode("BK-TEST08")
                .totalAmount(new BigDecimal("2500000"))
                .build();

        Payment ccPayment = paymentContextService.executePayment(sampleBooking, PaymentMethodType.CREDIT_CARD);
        assertEquals(PaymentStatus.PAID, ccPayment.getPaymentStatus());
        assertTrue(ccPayment.getTransactionRef().startsWith("CC-"));
        assertNotNull(ccPayment.getPaidAt());

        Payment walletPayment = paymentContextService.executePayment(sampleBooking, PaymentMethodType.E_WALLET);
        assertEquals(PaymentStatus.PAID, walletPayment.getPaymentStatus());
        assertTrue(walletPayment.getTransactionRef().startsWith("VNPAY-"));

        Payment cashPayment = paymentContextService.executePayment(sampleBooking, PaymentMethodType.PAY_AT_HOTEL);
        assertEquals(PaymentStatus.PENDING, cashPayment.getPaymentStatus());
        assertTrue(cashPayment.getTransactionRef().startsWith("COUNTER-"));
        assertNull(cashPayment.getPaidAt());
    }

    @Test
    @Order(9)
    @DisplayName("TC-09: Kiểm thử State Pattern - Vòng đời chuyển trạng thái đơn hợp lệ")
    void testTc09_StatePattern_ValidLifecycle() {
        Room room = Room.builder().roomNumber("P801").status(RoomStatus.AVAILABLE).build();
        Booking booking = Booking.builder()
                .bookingCode("BK-STATE09")
                .room(room)
                .checkInDate(LocalDate.now().plusDays(5))
                .checkOutDate(LocalDate.now().plusDays(7))
                .status(BookingStatus.PENDING)
                .build();

        stateResolver.applyAction(booking, BookingAction.CONFIRM);
        assertEquals(BookingStatus.CONFIRMED, booking.getStatus());

        stateResolver.applyAction(booking, BookingAction.CHECK_IN);
        assertEquals(BookingStatus.CHECKED_IN, booking.getStatus());

        stateResolver.applyAction(booking, BookingAction.CHECK_OUT);
        assertEquals(BookingStatus.CHECKED_OUT, booking.getStatus());
    }

    @Test
    @Order(10)
    @DisplayName("TC-10: Kiểm thử State Pattern - Chặn các thao tác chuyển trạng thái vi phạm quy tắc")
    void testTc10_StatePattern_InvalidTransitionsThrowException() {
        Room room = Room.builder().roomNumber("P802").status(RoomStatus.AVAILABLE).build();
        Booking booking = Booking.builder()
                .bookingCode("BK-STATE10")
                .room(room)
                .status(BookingStatus.PENDING)
                .build();

        // Không thể CHECK_IN khi đang PENDING
        assertThrows(BusinessRuleException.class, () ->
                stateResolver.applyAction(booking, BookingAction.CHECK_IN)
        );

        stateResolver.applyAction(booking, BookingAction.CONFIRM);
        stateResolver.applyAction(booking, BookingAction.CHECK_IN);

        // Không thể CANCEL khi khách đang CHECKED_IN
        assertThrows(BusinessRuleException.class, () ->
                stateResolver.applyAction(booking, BookingAction.CANCEL)
        );
    }

    @Test
    @Order(11)
    @DisplayName("TC-11: Kiểm thử State Pattern - Tự động đồng bộ trạng thái Phòng (OCCUPIED / AVAILABLE)")
    void testTc11_StatePattern_RoomSynchronization() {
        Room room = Room.builder().roomNumber("P803").status(RoomStatus.AVAILABLE).build();
        Payment payment = Payment.builder()
                .paymentMethod(PaymentMethodType.PAY_AT_HOTEL)
                .paymentStatus(PaymentStatus.PENDING)
                .amount(new BigDecimal("1700000"))
                .build();
        Booking booking = Booking.builder()
                .bookingCode("BK-STATE11")
                .room(room)
                .payment(payment)
                .checkInDate(LocalDate.now().plusDays(2))
                .checkOutDate(LocalDate.now().plusDays(4))
                .status(BookingStatus.CONFIRMED)
                .build();

        // Khi Check-In: Phòng chuyển sang OCCUPIED, thanh toán PENDING chuyển sang PAID
        stateResolver.applyAction(booking, BookingAction.CHECK_IN);
        assertEquals(BookingStatus.CHECKED_IN, booking.getStatus());
        assertEquals(RoomStatus.OCCUPIED, room.getStatus());
        assertEquals(PaymentStatus.PAID, payment.getPaymentStatus());

        // Khi Check-Out: Phòng tự động giải phóng về AVAILABLE
        stateResolver.applyAction(booking, BookingAction.CHECK_OUT);
        assertEquals(BookingStatus.CHECKED_OUT, booking.getStatus());
        assertEquals(RoomStatus.AVAILABLE, room.getStatus());
    }

    @Test
    @Order(12)
    @DisplayName("TC-12: Kiểm thử Facade & Observer Pattern - Giao dịch đặt phòng toàn trình")
    void testTc12_FacadeAndObserverPattern_FullWorkflow() {
        User customer = userRepository.findByEmail("user@hotel.com").orElseThrow();
        User admin = userRepository.findByEmail("admin@hotel.com").orElseThrow();
        List<RoomDto> rooms = roomService.searchRooms(RoomSearchCriteria.builder().status(RoomStatus.AVAILABLE).build());
        RoomDto targetRoom = rooms.get(0);

        dashboardService.createVoucher(new CreateOrUpdateVoucherRequest(
                "TEST10",
                DiscountType.PERCENTAGE,
                new BigDecimal("10"),
                new BigDecimal("500000"),
                "ALL",
                LocalDate.now().minusDays(1),
                LocalDate.now().plusMonths(6),
                true
        ));

        long initialNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(customer.getId()).size();

        BookingOrder order = BookingOrder.builder()
                .userId(customer.getId())
                .roomId(targetRoom.getId())
                .dates(LocalDate.now().plusDays(30), LocalDate.now().plusDays(32))
                .guestCount(2)
                .addService(AddonServiceType.BREAKFAST)
                .voucherCode("TEST10")
                .paymentMethod(PaymentMethodType.PAY_AT_HOTEL)
                .specialRequests("Test Facade & Observer")
                .build();

        BookingResponse booking = bookingFacade.placeBooking(order);
        assertNotNull(booking.getId());
        assertEquals(BookingStatus.PENDING, booking.getStatus());
        assertTrue(booking.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0);

        // Kiểm tra Observer Pattern đã tạo thông báo In-App mới
        long afterCreateNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(customer.getId()).size();
        assertTrue(afterCreateNotifications > initialNotifications);

        // Chuyển trạng thái qua Facade: PENDING -> CONFIRMED -> CHECKED_IN -> CHECKED_OUT
        BookingResponse confirmed = bookingFacade.transitionBookingState(booking.getId(), BookingAction.CONFIRM, admin);
        assertEquals(BookingStatus.CONFIRMED, confirmed.getStatus());

        BookingResponse checkedIn = bookingFacade.transitionBookingState(booking.getId(), BookingAction.CHECK_IN, admin);
        assertEquals(BookingStatus.CHECKED_IN, checkedIn.getStatus());
        assertEquals(RoomStatus.OCCUPIED, roomService.getRoomDtoById(targetRoom.getId()).getStatus());

        BookingResponse checkedOut = bookingFacade.transitionBookingState(booking.getId(), BookingAction.CHECK_OUT, admin);
        assertEquals(BookingStatus.CHECKED_OUT, checkedOut.getStatus());
        assertEquals(RoomStatus.AVAILABLE, roomService.getRoomDtoById(targetRoom.getId()).getStatus());

        // Kiểm tra hủy đơn đặt phòng xóa khỏi danh sách active
        BookingOrder cancelOrder = BookingOrder.builder()
                .userId(customer.getId())
                .roomId(targetRoom.getId())
                .dates(LocalDate.now().plusDays(40), LocalDate.now().plusDays(42))
                .guestCount(1)
                .paymentMethod(PaymentMethodType.PAY_AT_HOTEL)
                .build();
        BookingResponse toCancel = bookingFacade.placeBooking(cancelOrder);
        bookingFacade.transitionBookingState(toCancel.getId(), BookingAction.CANCEL, customer);

        boolean existsInAdmin = bookingFacade.getAllBookings().stream()
                .anyMatch(b -> b.getId().equals(toCancel.getId()));
        assertFalse(existsInAdmin, "Cancelled booking must be removed from Admin booking list");
    }
}
