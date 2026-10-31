package com.hotel.booking.patterns.behavioral.strategy.discount;

import com.hotel.booking.entity.Voucher;
import com.hotel.booking.enums.DiscountType;
import com.hotel.booking.exception.BusinessRuleException;
import com.hotel.booking.repository.VoucherRepository;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class DiscountContextService {

    private final Map<DiscountType, DiscountStrategy> strategyMap;
    private final VoucherRepository voucherRepository;

    public DiscountContextService(List<DiscountStrategy> strategies, VoucherRepository voucherRepository) {
        this.strategyMap = strategies.stream()
                .collect(Collectors.toMap(DiscountStrategy::getDiscountType, Function.identity()));
        this.voucherRepository = voucherRepository;
    }

    @Getter
    public static class DiscountEvaluation {
        private final Voucher voucher;
        private final BigDecimal discountAmount;

        public DiscountEvaluation(Voucher voucher, BigDecimal discountAmount) {
            this.voucher = voucher;
            this.discountAmount = discountAmount;
        }
    }

    public DiscountEvaluation evaluateVoucher(
            String voucherCode,
            BigDecimal subTotal,
            long stayNights,
            String roomType
    ) {
        if (voucherCode == null || voucherCode.isBlank()) {
            return new DiscountEvaluation(null, BigDecimal.ZERO);
        }

        Voucher voucher = voucherRepository.findByCodeIgnoreCase(voucherCode.trim())
                .orElseThrow(() -> new BusinessRuleException("Mã giảm giá '" + voucherCode + "' không tồn tại."));

        LocalDate today = LocalDate.now();
        if (!voucher.isActive()) {
            throw new BusinessRuleException("Mã giảm giá '" + voucherCode + "' đã ngưng kích hoạt.");
        }
        if (today.isBefore(voucher.getValidFrom()) || today.isAfter(voucher.getValidTo())) {
            throw new BusinessRuleException("Mã giảm giá '" + voucherCode + "' đã hết hạn hoặc chưa tới ngày áp dụng.");
        }
        if (subTotal.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new BusinessRuleException(String.format(
                    "Đơn đặt phòng tối thiểu phải từ %,.0f VNĐ để áp dụng mã '%s'.",
                    voucher.getMinOrderValue(), voucher.getCode()
            ));
        }

        // Check roomType applicability
        String applicable = voucher.getApplicableRoomTypes();
        if (applicable != null && !applicable.isBlank() && !applicable.equalsIgnoreCase("ALL") && roomType != null) {
            Set<String> allowedTypes = Arrays.stream(applicable.split(","))
                    .map(s -> s.trim().toUpperCase())
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toSet());
            if (!allowedTypes.isEmpty() && !allowedTypes.contains(roomType.trim().toUpperCase())) {
                throw new BusinessRuleException(String.format(
                        "Mã giảm giá '%s' chỉ áp dụng cho hạng phòng: %s (Phòng hiện tại thuộc hạng %s).",
                        voucher.getCode(), voucher.getApplicableRoomTypes(), roomType
                ));
            }
        }

        DiscountStrategy strategy = strategyMap.get(voucher.getDiscountType());
        if (strategy == null) {
            throw new BusinessRuleException("Chiến lược giảm giá không hợp lệ: " + voucher.getDiscountType());
        }

        BigDecimal discountAmount = strategy.calculateDiscount(subTotal, voucher, stayNights);
        return new DiscountEvaluation(voucher, discountAmount);
    }
}
