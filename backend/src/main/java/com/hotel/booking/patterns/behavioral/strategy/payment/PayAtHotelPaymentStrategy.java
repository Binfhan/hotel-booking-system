package com.hotel.booking.patterns.behavioral.strategy.payment;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.entity.Payment;
import com.hotel.booking.enums.PaymentMethodType;
import com.hotel.booking.enums.PaymentStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class PayAtHotelPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentMethodType getPaymentMethod() {
        return PaymentMethodType.PAY_AT_HOTEL;
    }

    @Override
    public Payment processPayment(Booking booking) {
        String txRef = "COUNTER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return Payment.builder()
                .booking(booking)
                .paymentMethod(PaymentMethodType.PAY_AT_HOTEL)
                .paymentStatus(PaymentStatus.PENDING)
                .transactionRef(txRef)
                .amount(booking.getTotalAmount())
                .paidAt(null)
                .build();
    }
}
