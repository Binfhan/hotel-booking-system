package com.hotel.booking.service;

import com.hotel.booking.dto.BookingDtos.BookingResponse;
import com.hotel.booking.dto.DashboardDtos.CreateOrUpdateVoucherRequest;
import com.hotel.booking.dto.DashboardDtos.DashboardStatsResponse;
import com.hotel.booking.dto.DashboardDtos.VoucherDto;
import com.hotel.booking.entity.Booking;
import com.hotel.booking.entity.Voucher;
import com.hotel.booking.enums.BookingStatus;
import com.hotel.booking.enums.RoleType;
import com.hotel.booking.enums.RoomStatus;
import com.hotel.booking.exception.BusinessRuleException;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.patterns.structural.facade.BookingFacade;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.RoomRepository;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final VoucherRepository voucherRepository;
    private final BookingFacade bookingFacade;

    public DashboardStatsResponse getDashboardStats() {
        long totalRooms = roomRepository.count();
        long availableRooms = roomRepository.countByStatus(RoomStatus.AVAILABLE);
        long maintenanceRooms = roomRepository.countByStatus(RoomStatus.MAINTENANCE);
        long totalCustomers = userRepository.countByRole(RoleType.ROLE_USER);
        long totalBookings = bookingRepository.count();

        long pending = bookingRepository.countByStatus(BookingStatus.PENDING);
        long confirmed = bookingRepository.countByStatus(BookingStatus.CONFIRMED);
        long checkedIn = bookingRepository.countByStatus(BookingStatus.CHECKED_IN);
        long checkedOut = bookingRepository.countByStatus(BookingStatus.CHECKED_OUT);
        long cancelled = bookingRepository.countByStatus(BookingStatus.CANCELLED);

        BigDecimal totalRevenue = bookingRepository.calculateTotalConfirmedRevenue();

        List<BookingResponse> recentBookings = bookingFacade.getAllBookings().stream()
                .limit(8)
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .totalRooms(totalRooms)
                .availableRooms(availableRooms)
                .maintenanceRooms(maintenanceRooms)
                .totalCustomers(totalCustomers)
                .totalBookings(totalBookings)
                .pendingBookings(pending)
                .confirmedBookings(confirmed)
                .checkedInBookings(checkedIn)
                .checkedOutBookings(checkedOut)
                .cancelledBookings(cancelled)
                .totalRevenue(totalRevenue)
                .recentBookings(recentBookings)
                .build();
    }

    public List<VoucherDto> getActiveVouchers() {
        return voucherRepository.findAll().stream()
                .filter(Voucher::isActive)
                .map(this::toVoucherDto)
                .collect(Collectors.toList());
    }

    public List<VoucherDto> getAllVouchers() {
        return voucherRepository.findAll().stream()
                .map(this::toVoucherDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public VoucherDto createVoucher(CreateOrUpdateVoucherRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase();
        if (voucherRepository.findByCodeIgnoreCase(normalizedCode).isPresent()) {
            throw new BusinessRuleException("Mã voucher '" + normalizedCode + "' đã tồn tại.");
        }
        if (request.getValidTo().isBefore(request.getValidFrom())) {
            throw new BusinessRuleException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu hiệu lực.");
        }

        String roomTypes = (request.getApplicableRoomTypes() != null && !request.getApplicableRoomTypes().isBlank())
                ? request.getApplicableRoomTypes().trim().toUpperCase()
                : "ALL";

        Voucher voucher = Voucher.builder()
                .code(normalizedCode)
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderValue(request.getMinOrderValue() != null ? request.getMinOrderValue() : BigDecimal.ZERO)
                .applicableRoomTypes(roomTypes)
                .validFrom(request.getValidFrom())
                .validTo(request.getValidTo())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        return toVoucherDto(voucherRepository.save(voucher));
    }

    @Transactional
    public VoucherDto updateVoucher(Long id, CreateOrUpdateVoucherRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với ID: " + id));

        String normalizedCode = request.getCode().trim().toUpperCase();
        voucherRepository.findByCodeIgnoreCase(normalizedCode)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BusinessRuleException("Mã voucher '" + normalizedCode + "' đã thuộc về voucher khác.");
                });

        if (request.getValidTo().isBefore(request.getValidFrom())) {
            throw new BusinessRuleException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu hiệu lực.");
        }

        String roomTypes = (request.getApplicableRoomTypes() != null && !request.getApplicableRoomTypes().isBlank())
                ? request.getApplicableRoomTypes().trim().toUpperCase()
                : "ALL";

        voucher.setCode(normalizedCode);
        voucher.setDiscountType(request.getDiscountType());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMinOrderValue(request.getMinOrderValue() != null ? request.getMinOrderValue() : BigDecimal.ZERO);
        voucher.setApplicableRoomTypes(roomTypes);
        voucher.setValidFrom(request.getValidFrom());
        voucher.setValidTo(request.getValidTo());
        if (request.getActive() != null) {
            voucher.setActive(request.getActive());
        }

        return toVoucherDto(voucherRepository.save(voucher));
    }

    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với ID: " + id));

        // Detach voucher reference from existing bookings before deleting
        List<Booking> bookingsWithVoucher = bookingRepository.findAll().stream()
                .filter(b -> b.getVoucher() != null && b.getVoucher().getId().equals(id))
                .collect(Collectors.toList());
        for (Booking b : bookingsWithVoucher) {
            b.setVoucher(null);
        }
        bookingRepository.saveAll(bookingsWithVoucher);

        voucherRepository.delete(voucher);
    }

    public VoucherDto toVoucherDto(Voucher v) {
        return VoucherDto.builder()
                .id(v.getId())
                .code(v.getCode())
                .discountType(v.getDiscountType())
                .discountValue(v.getDiscountValue())
                .minOrderValue(v.getMinOrderValue())
                .applicableRoomTypes(
                        (v.getApplicableRoomTypes() != null && !v.getApplicableRoomTypes().isBlank())
                                ? v.getApplicableRoomTypes()
                                : "ALL"
                )
                .validFrom(v.getValidFrom())
                .validTo(v.getValidTo())
                .active(v.isActive())
                .build();
    }
}
