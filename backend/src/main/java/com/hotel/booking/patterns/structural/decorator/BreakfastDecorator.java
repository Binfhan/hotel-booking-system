package com.hotel.booking.patterns.structural.decorator;

import com.hotel.booking.enums.AddonServiceType;

import java.math.BigDecimal;

public class BreakfastDecorator extends BookingServiceDecorator {

    public static final BigDecimal PRICE_PER_GUEST_PER_NIGHT = new BigDecimal("150000");

    private final int guestCount;
    private final long nights;

    public BreakfastDecorator(BookingCostComponent wrapped, int guestCount, long nights) {
        super(wrapped);
        this.guestCount = guestCount;
        this.nights = nights;
    }

    @Override
    public AddonServiceType getServiceType() {
        return AddonServiceType.BREAKFAST;
    }

    @Override
    public String getServiceName() {
        return String.format("Buffet sáng (%d khách x %d đêm)", guestCount, nights);
    }

    @Override
    public BigDecimal getServiceCost() {
        return PRICE_PER_GUEST_PER_NIGHT
                .multiply(BigDecimal.valueOf(guestCount))
                .multiply(BigDecimal.valueOf(nights));
    }
}
