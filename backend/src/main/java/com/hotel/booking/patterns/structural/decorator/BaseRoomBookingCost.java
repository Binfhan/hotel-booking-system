package com.hotel.booking.patterns.structural.decorator;

import java.math.BigDecimal;

/**
 * STRUCTURAL PATTERN 3: Decorator Pattern - Concrete Component
 * Represents the base cost of booking a room for a given number of nights.
 */
public class BaseRoomBookingCost implements BookingCostComponent {

    private final String roomName;
    private final BigDecimal pricePerNight;
    private final long nights;

    public BaseRoomBookingCost(String roomName, BigDecimal pricePerNight, long nights) {
        this.roomName = roomName;
        this.pricePerNight = pricePerNight;
        this.nights = nights;
    }

    @Override
    public BigDecimal calculateCost() {
        return pricePerNight.multiply(BigDecimal.valueOf(nights));
    }

    @Override
    public String getDescription() {
        return String.format("Tiền phòng %s (%d đêm x %,.0f VNĐ)", roomName, nights, pricePerNight);
    }
}
