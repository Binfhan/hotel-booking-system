package com.hotel.booking.patterns.structural.decorator;

import java.math.BigDecimal;

/**
 * STRUCTURAL PATTERN 3: Decorator Pattern - Component Interface
 * Defines common contract for base room cost and dynamically attached add-on services.
 */
public interface BookingCostComponent {
    BigDecimal calculateCost();
    String getDescription();
}
