package com.hotel.booking.patterns.behavioral.strategy.payment;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.entity.Payment;
import com.hotel.booking.enums.PaymentMethodType;

/**
 * BEHAVIORAL PATTERN 5B: Strategy Pattern - Payment Strategy Interface
 */
public interface PaymentStrategy {
    PaymentMethodType getPaymentMethod();
    Payment processPayment(Booking booking);
}
