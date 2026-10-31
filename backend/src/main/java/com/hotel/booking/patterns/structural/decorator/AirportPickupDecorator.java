package com.hotel.booking.patterns.structural.decorator;

import com.hotel.booking.enums.AddonServiceType;

import java.math.BigDecimal;

public class AirportPickupDecorator extends BookingServiceDecorator {

    public static final BigDecimal FLAT_FEE = new BigDecimal("350000");

    public AirportPickupDecorator(BookingCostComponent wrapped) {
        super(wrapped);
    }

    @Override
    public AddonServiceType getServiceType() {
        return AddonServiceType.AIRPORT_PICKUP;
    }

    @Override
    public String getServiceName() {
        return "Xe riêng đưa đón sân bay 2 chiều";
    }

    @Override
    public BigDecimal getServiceCost() {
        return FLAT_FEE;
    }
}
