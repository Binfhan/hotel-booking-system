package com.hotel.booking.patterns.structural.decorator;

import com.hotel.booking.enums.AddonServiceType;

import java.math.BigDecimal;

public class SpaDecorator extends BookingServiceDecorator {

    public static final BigDecimal PRICE_PER_GUEST = new BigDecimal("400000");

    private final int guestCount;

    public SpaDecorator(BookingCostComponent wrapped, int guestCount) {
        super(wrapped);
        this.guestCount = guestCount;
    }

    @Override
    public AddonServiceType getServiceType() {
        return AddonServiceType.SPA;
    }

    @Override
    public String getServiceName() {
        return String.format("Gói thư giãn Spa & Sauna (%d khách)", guestCount);
    }

    @Override
    public BigDecimal getServiceCost() {
        return PRICE_PER_GUEST.multiply(BigDecimal.valueOf(guestCount));
    }
}
