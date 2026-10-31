package com.hotel.booking.patterns.behavioral.strategy.payment;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.entity.Payment;
import com.hotel.booking.enums.PaymentMethodType;
import com.hotel.booking.enums.PaymentStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class CreditCardPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentMethodType getPaymentMethod() {
        return PaymentMethodType.CREDIT_CARD;
    }

    @Override
    public Payment processPayment(Booking booking) {
        String txRef = "CC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return Payment.builder()
                .booking(booking)
                .paymentMethod(PaymentMethodType.CREDIT_CARD)
                .paymentStatus(PaymentStatus.PAID)
                .transactionRef(txRef)
                .amount(booking.getTotalAmount())
                .paidAt(LocalDateTime.now())
                .build();
    }
}
