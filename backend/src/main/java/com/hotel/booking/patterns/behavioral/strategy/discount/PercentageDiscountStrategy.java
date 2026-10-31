package com.hotel.booking.patterns.behavioral.strategy.discount;

import com.hotel.booking.entity.Voucher;
import com.hotel.booking.enums.DiscountType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class PercentageDiscountStrategy implements DiscountStrategy {

    @Override
    public DiscountType getDiscountType() {
        return DiscountType.PERCENTAGE;
    }

    @Override
    public BigDecimal calculateDiscount(BigDecimal subTotal, Voucher voucher, long stayNights) {
        BigDecimal percent = voucher.getDiscountValue();
        BigDecimal discount = subTotal.multiply(percent)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        return discount.min(subTotal);
    }
}
