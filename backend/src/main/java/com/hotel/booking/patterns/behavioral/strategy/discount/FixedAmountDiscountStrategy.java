package com.hotel.booking.patterns.behavioral.strategy.discount;

import com.hotel.booking.entity.Voucher;
import com.hotel.booking.enums.DiscountType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class FixedAmountDiscountStrategy implements DiscountStrategy {

    @Override
    public DiscountType getDiscountType() {
        return DiscountType.FIXED_AMOUNT;
    }

    @Override
    public BigDecimal calculateDiscount(BigDecimal subTotal, Voucher voucher, long stayNights) {
        return voucher.getDiscountValue().min(subTotal);
    }
}
