package com.hotel.booking.dto;

import com.hotel.booking.enums.RoomStatus;
import com.hotel.booking.enums.RoomType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

public class RoomDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomDto {
        private Long id;
        private String roomNumber;
        private String name;
        private String roomType;
        private String location;
        private BigDecimal pricePerNight;
        private Integer capacity;
        private String bedType;
        private RoomStatus status;
        private String description;
        private List<String> images;
        private List<String> amenities;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateOrUpdateRoomRequest {
        @NotBlank(message = "Số phòng không được để trống")
        private String roomNumber;

        @NotBlank(message = "Tên phòng không được để trống")
        private String name;

        @NotBlank(message = "Hạng phòng không được để trống")
        private String roomType;

        @NotBlank(message = "Địa điểm/Chi nhánh không được để trống")
        private String location;

        private BigDecimal pricePerNight;
        private Integer capacity;
        private String bedType;
        private RoomStatus status;
        private String description;
        private List<String> images;
        private List<String> amenities;

        public CreateOrUpdateRoomRequest(
                String roomNumber,
                String name,
                RoomType roomTypeEnum,
                String location,
                BigDecimal pricePerNight,
                Integer capacity,
                String bedType,
                RoomStatus status,
                String description,
                List<String> images,
                List<String> amenities
        ) {
            this.roomNumber = roomNumber;
            this.name = name;
            this.roomType = roomTypeEnum != null ? roomTypeEnum.name() : "STANDARD";
            this.location = location;
            this.pricePerNight = pricePerNight;
            this.capacity = capacity;
            this.bedType = bedType;
            this.status = status;
            this.description = description;
            this.images = images;
            this.amenities = amenities;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomCategoryDto {
        private Long id;
        private String code;
        private String name;
        private BigDecimal defaultPrice;
        private Integer defaultCapacity;
        private String defaultBedType;
        private String defaultDescription;
        private String defaultAmenities;
        private String defaultImageUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateOrUpdateRoomCategoryRequest {
        @NotBlank(message = "Mã hạng phòng không được để trống")
        private String code;

        @NotBlank(message = "Tên hạng phòng không được để trống")
        private String name;

        @NotNull(message = "Giá mặc định không được để trống")
        private BigDecimal defaultPrice;

        @NotNull(message = "Sức chứa mặc định không được để trống")
        private Integer defaultCapacity;

        @NotBlank(message = "Loại giường mặc định không được để trống")
        private String defaultBedType;

        private String defaultDescription;
        private String defaultAmenities;
        private String defaultImageUrl;
    }
}
