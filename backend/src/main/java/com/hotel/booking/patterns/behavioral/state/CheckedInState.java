package com.hotel.booking.patterns.behavioral.state;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.enums.BookingStatus;
import com.hotel.booking.enums.PaymentStatus;
import com.hotel.booking.exception.BusinessRuleException;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class CheckedInState implements BookingState {

    @Override
    public BookingStatus getStatus() {
        return BookingStatus.CHECKED_IN;
    }

    @Override
    public void confirm(Booking booking) {
        throw new BusinessRuleException("Khách đã Check-in, không thể chuyển về CONFIRMED.");
    }

    @Override
    public void checkIn(Booking booking) {
        throw new BusinessRuleException("Khách đã ở trạng thái CHECKED_IN.");
    }

    @Override
    public void checkOut(Booking booking) {
        booking.setStatus(BookingStatus.CHECKED_OUT);
        if (booking.getPayment() != null && booking.getPayment().getPaymentStatus() != PaymentStatus.PAID) {
            booking.getPayment().setPaymentStatus(PaymentStatus.PAID);
            booking.getPayment().setPaidAt(LocalDateTime.now());
        }
    }

    @Override
    public void cancel(Booking booking) {
        throw new BusinessRuleException("Khách đang lưu trú (CHECKED_IN), không thể hủy đơn đặt phòng. Vui lòng thực hiện Check-out.");
    }
}
