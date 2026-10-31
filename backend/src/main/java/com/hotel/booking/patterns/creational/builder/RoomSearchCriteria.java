package com.hotel.booking.patterns.creational.builder;

import com.hotel.booking.enums.RoomStatus;
import com.hotel.booking.enums.RoomType;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * CREATIONAL PATTERN 1A: Builder Pattern
 * Builds complex multi-criteria search filter for hotel rooms without telescoping constructors.
 */
@Getter
public class RoomSearchCriteria {

    private final String keyword;
    private final String location;
    private final String roomType;
    private final Integer minGuests;
    private final BigDecimal minPrice;
    private final BigDecimal maxPrice;
    private final LocalDate checkInDate;
    private final LocalDate checkOutDate;
    private final RoomStatus status;

    private RoomSearchCriteria(Builder builder) {
        this.keyword = builder.keyword;
        this.location = builder.location;
        this.roomType = builder.roomType;
        this.minGuests = builder.minGuests;
        this.minPrice = builder.minPrice;
        this.maxPrice = builder.maxPrice;
        this.checkInDate = builder.checkInDate;
        this.checkOutDate = builder.checkOutDate;
        this.status = builder.status;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String keyword;
        private String location;
        private String roomType;
        private Integer minGuests;
        private BigDecimal minPrice;
        private BigDecimal maxPrice;
        private LocalDate checkInDate;
        private LocalDate checkOutDate;
        private RoomStatus status;

        public Builder keyword(String keyword) {
            this.keyword = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
            return this;
        }

        public Builder location(String location) {
            this.location = (location != null && !location.isBlank()) ? location.trim() : null;
            return this;
        }

        public Builder roomType(String roomType) {
            this.roomType = (roomType != null && !roomType.isBlank()) ? roomType.trim().toUpperCase() : null;
            return this;
        }

        public Builder roomType(RoomType roomType) {
            this.roomType = roomType != null ? roomType.name() : null;
            return this;
        }

        public Builder minGuests(Integer minGuests) {
            this.minGuests = minGuests;
            return this;
        }

        public Builder priceRange(BigDecimal minPrice, BigDecimal maxPrice) {
            this.minPrice = minPrice;
            this.maxPrice = maxPrice;
            return this;
        }

        public Builder stayDates(LocalDate checkInDate, LocalDate checkOutDate) {
            this.checkInDate = checkInDate;
            this.checkOutDate = checkOutDate;
            return this;
        }

        public Builder status(RoomStatus status) {
            this.status = status;
            return this;
        }

        public RoomSearchCriteria build() {
            return new RoomSearchCriteria(this);
        }
    }
}
