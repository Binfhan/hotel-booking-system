package com.hotel.booking.patterns.structural.decorator;

import com.hotel.booking.enums.AddonServiceType;

import java.math.BigDecimal;

public class ExtraBedDecorator extends BookingServiceDecorator {

    public static final BigDecimal PRICE_PER_NIGHT = new BigDecimal("300000");

    private final long nights;

    public ExtraBedDecorator(BookingCostComponent wrapped, long nights) {
        super(wrapped);
        this.nights = nights;
    }

    @Override
    public AddonServiceType getServiceType() {
        return AddonServiceType.EXTRA_BED;
    }

    @Override
    public String getServiceName() {
        return String.format("Giường phụ Extra Bed (%d đêm)", nights);
    }

    @Override
    public BigDecimal getServiceCost() {
        return PRICE_PER_NIGHT.multiply(BigDecimal.valueOf(nights));
    }
}
