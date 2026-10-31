package com.hotel.booking.patterns.structural.decorator;

import com.hotel.booking.enums.AddonServiceType;

import java.math.BigDecimal;

/**
 * STRUCTURAL PATTERN 3: Decorator Pattern - Abstract Decorator
 * Wraps a BookingCostComponent to add extra responsibilities (cost + description).
 */
public abstract class BookingServiceDecorator implements BookingCostComponent {

    protected final BookingCostComponent wrapped;

    protected BookingServiceDecorator(BookingCostComponent wrapped) {
        this.wrapped = wrapped;
    }

    public abstract AddonServiceType getServiceType();
    public abstract String getServiceName();
    public abstract BigDecimal getServiceCost();

    @Override
    public BigDecimal calculateCost() {
        return wrapped.calculateCost().add(getServiceCost());
    }

    @Override
    public String getDescription() {
        return wrapped.getDescription() + " + " + getServiceName()
                + String.format(" (%,.0f VNĐ)", getServiceCost());
    }
}
