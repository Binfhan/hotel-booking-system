package com.hotel.booking.dto;

import com.hotel.booking.enums.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class BookingDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PreviewBookingRequest {
        @NotNull(message = "Room ID không được để trống")
        private Long roomId;

        @NotNull(message = "Ngày nhận phòng không được để trống")
        private LocalDate checkInDate;

        @NotNull(message = "Ngày trả phòng không được để trống")
        private LocalDate checkOutDate;

        @NotNull(message = "Số khách không được để trống")
        @Min(value = 1, message = "Số khách tối thiểu là 1")
        private Integer guestCount;

        private List<AddonServiceType> addonServices;
        private String voucherCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateBookingRequest {
        @NotNull(message = "Room ID không được để trống")
        private Long roomId;

        @NotNull(message = "Ngày nhận phòng không được để trống")
        private LocalDate checkInDate;

        @NotNull(message = "Ngày trả phòng không được để trống")
        private LocalDate checkOutDate;

        @NotNull(message = "Số khách không được để trống")
        @Min(value = 1, message = "Số khách tối thiểu là 1")
        private Integer guestCount;

        private List<AddonServiceType> addonServices;
        private String voucherCode;
        private PaymentMethodType paymentMethod;
        private String specialRequests;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingServiceItemDto {
        private AddonServiceType serviceType;
        private String serviceName;
        private BigDecimal price;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceBreakdownResponse {
        private Long roomId;
        private String roomName;
        private long nights;
        private Integer guestCount;
        private BigDecimal baseRoomCost;
        private BigDecimal addonServicesCost;
        private BigDecimal subTotal;
        private String appliedVoucherCode;
        private BigDecimal discountAmount;
        private BigDecimal totalAmount;
        private String decoratorDescription;
        private List<BookingServiceItemDto> addonItems;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentDto {
        private Long id;
        private PaymentMethodType paymentMethod;
        private PaymentStatus paymentStatus;
        private String transactionRef;
        private BigDecimal amount;
        private LocalDateTime paidAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingResponse {
        private Long id;
        private String bookingCode;
        private Long userId;
        private String customerName;
        private String customerEmail;
        private String customerPhone;
        private Long roomId;
        private String roomNumber;
        private String roomName;
        private String roomType;
        private String roomLocation;
        private String roomPrimaryImage;
        private LocalDate checkInDate;
        private LocalDate checkOutDate;
        private long nights;
        private Integer guestCount;
        private BigDecimal baseRoomCost;
        private BigDecimal addonServicesCost;
        private String voucherCode;
        private BigDecimal discountAmount;
        private BigDecimal totalAmount;
        private String costBreakdownDescription;
        private BookingStatus status;
        private String specialRequests;
        private List<BookingServiceItemDto> addonServices;
        private PaymentDto payment;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateBookingStateRequest {
        @NotNull(message = "Hành động chuyển trạng thái không được để trống")
        private BookingAction action;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdatePaymentStatusRequest {
        @NotNull(message = "Trạng thái thanh toán không được để trống")
        private PaymentStatus paymentStatus;
    }
}
