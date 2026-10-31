package com.hotel.booking.patterns.behavioral.state;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.enums.BookingStatus;
import com.hotel.booking.enums.PaymentStatus;
import com.hotel.booking.exception.BusinessRuleException;
import org.springframework.stereotype.Component;

@Component
public class PendingState implements BookingState {

    @Override
    public BookingStatus getStatus() {
        return BookingStatus.PENDING;
    }

    @Override
    public void confirm(Booking booking) {
        booking.setStatus(BookingStatus.CONFIRMED);
    }

    @Override
    public void checkIn(Booking booking) {
        throw new BusinessRuleException("Không thể Check-in đơn đang ở trạng thái PENDING. Vui lòng xác nhận (CONFIRMED) đơn trước.");
    }

    @Override
    public void checkOut(Booking booking) {
        throw new BusinessRuleException("Không thể Check-out đơn đang ở trạng thái PENDING.");
    }

    @Override
    public void cancel(Booking booking) {
        booking.setStatus(BookingStatus.CANCELLED);
        if (booking.getPayment() != null && booking.getPayment().getPaymentStatus() == PaymentStatus.PAID) {
            booking.getPayment().setPaymentStatus(PaymentStatus.REFUNDED);
        }
    }
}
