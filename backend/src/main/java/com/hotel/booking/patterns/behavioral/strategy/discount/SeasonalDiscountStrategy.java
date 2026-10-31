package com.hotel.booking.patterns.behavioral.strategy.discount;

import com.hotel.booking.entity.Voucher;
import com.hotel.booking.enums.DiscountType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Seasonal / Long-stay discount strategy:
 * Base percentage discount + extra 5% bonus if stayNights >= 3.
 */
@Component
public class SeasonalDiscountStrategy implements DiscountStrategy {

    @Override
    public DiscountType getDiscountType() {
        return DiscountType.SEASONAL;
    }

    @Override
    public BigDecimal calculateDiscount(BigDecimal subTotal, Voucher voucher, long stayNights) {
        BigDecimal effectivePercent = voucher.getDiscountValue();
        if (stayNights >= 3) {
            effectivePercent = effectivePercent.add(BigDecimal.valueOf(5));
        }
        BigDecimal discount = subTotal.multiply(effectivePercent)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        return discount.min(subTotal);
    }
}
