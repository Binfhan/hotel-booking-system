package com.hotel.booking.patterns.behavioral.strategy.payment;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.entity.Payment;
import com.hotel.booking.enums.PaymentMethodType;
import com.hotel.booking.exception.BusinessRuleException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PaymentContextService {

    private final Map<PaymentMethodType, PaymentStrategy> strategyMap;

    public PaymentContextService(List<PaymentStrategy> strategies) {
        this.strategyMap = strategies.stream()
                .collect(Collectors.toMap(PaymentStrategy::getPaymentMethod, Function.identity()));
    }

    public Payment executePayment(Booking booking, PaymentMethodType methodType) {
        PaymentMethodType resolvedMethod = methodType != null ? methodType : PaymentMethodType.PAY_AT_HOTEL;
        PaymentStrategy strategy = strategyMap.get(resolvedMethod);
        if (strategy == null) {
            throw new BusinessRuleException("Không hỗ trợ phương thức thanh toán: " + resolvedMethod);
        }
        return strategy.processPayment(booking);
    }
}
