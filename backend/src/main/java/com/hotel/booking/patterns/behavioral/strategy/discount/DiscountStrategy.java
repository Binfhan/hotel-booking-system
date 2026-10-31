package com.hotel.booking.patterns.behavioral.strategy.discount;

import com.hotel.booking.entity.Voucher;
import com.hotel.booking.enums.DiscountType;

import java.math.BigDecimal;

/**
 * BEHAVIORAL PATTERN 5A: Strategy Pattern - Discount Strategy Interface
 */
public interface DiscountStrategy {
    DiscountType getDiscountType();
    BigDecimal calculateDiscount(BigDecimal subTotal, Voucher voucher, long stayNights);
}
