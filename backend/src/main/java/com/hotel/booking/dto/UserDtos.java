package com.hotel.booking.dto;

import com.hotel.booking.dto.BookingDtos.BookingResponse;
import com.hotel.booking.enums.RoleType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class UserDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private RoleType role;
        private boolean locked;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDetailDto {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private RoleType role;
        private boolean locked;
        private LocalDateTime createdAt;
        private long totalBookings;
        private BigDecimal totalSpent;
        private List<BookingResponse> bookings;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateUserAdminRequest {
        @NotBlank(message = "Họ và tên không được để trống")
        private String fullName;

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        private String email;

        @NotBlank(message = "Mật khẩu không được để trống")
        private String password;

        private String phone;
        private RoleType role;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateUserAdminRequest {
        private String fullName;
        private String email;
        private String phone;
        private String password;
        private RoleType role;
        private Boolean locked;
    }
}
