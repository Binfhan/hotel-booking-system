package com.hotel.booking.dto;

import com.hotel.booking.enums.DiscountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DashboardDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardStatsResponse {
        private long totalRooms;
        private long availableRooms;
        private long maintenanceRooms;
        private long totalCustomers;
        private long totalBookings;
        private long pendingBookings;
        private long confirmedBookings;
        private long checkedInBookings;
        private long checkedOutBookings;
        private long cancelledBookings;
        private BigDecimal totalRevenue;
        private List<BookingDtos.BookingResponse> recentBookings;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoucherDto {
        private Long id;
        private String code;
        private DiscountType discountType;
        private BigDecimal discountValue;
        private BigDecimal minOrderValue;
        private String applicableRoomTypes;
        private LocalDate validFrom;
        private LocalDate validTo;
        private boolean active;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateOrUpdateVoucherRequest {
        @NotBlank(message = "Mã voucher không được để trống")
        private String code;

        @NotNull(message = "Loại giảm giá không được để trống")
        private DiscountType discountType;

        @NotNull(message = "Giá trị giảm không được để trống")
        private BigDecimal discountValue;

        private BigDecimal minOrderValue;
        private String applicableRoomTypes;

        @NotNull(message = "Ngày bắt đầu hiệu lực không được để trống")
        private LocalDate validFrom;

        @NotNull(message = "Ngày kết thúc hiệu lực không được để trống")
        private LocalDate validTo;

        private Boolean active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationDto {
        private Long id;
        private String title;
        private String message;
        private boolean read;
        private LocalDateTime createdAt;
    }
}
