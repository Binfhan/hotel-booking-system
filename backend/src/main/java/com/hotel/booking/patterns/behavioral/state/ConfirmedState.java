package com.hotel.booking.patterns.behavioral.state;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.enums.BookingStatus;
import com.hotel.booking.enums.PaymentStatus;
import com.hotel.booking.enums.RoomStatus;
import com.hotel.booking.exception.BusinessRuleException;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class ConfirmedState implements BookingState {

    @Override
    public BookingStatus getStatus() {
        return BookingStatus.CONFIRMED;
    }

    @Override
    public void confirm(Booking booking) {
        throw new BusinessRuleException("Đơn đặt phòng đã ở trạng thái CONFIRMED.");
    }

    @Override
    public void checkIn(Booking booking) {
        booking.setStatus(BookingStatus.CHECKED_IN);
        if (booking.getRoom() != null) {
            booking.getRoom().setStatus(RoomStatus.OCCUPIED);
        }
        if (booking.getPayment() != null && booking.getPayment().getPaymentStatus() == PaymentStatus.PENDING) {
            booking.getPayment().setPaymentStatus(PaymentStatus.PAID);
            booking.getPayment().setPaidAt(LocalDateTime.now());
        }
    }

    @Override
    public void checkOut(Booking booking) {
        throw new BusinessRuleException("Khách chưa nhận phòng (CHECKED_IN), không thể thực hiện trả phòng (CHECKED_OUT).");
    }

    @Override
    public void cancel(Booking booking) {
        booking.setStatus(BookingStatus.CANCELLED);
        if (booking.getRoom() != null && booking.getRoom().getStatus() == RoomStatus.OCCUPIED) {
            booking.getRoom().setStatus(RoomStatus.AVAILABLE);
        }
        if (booking.getPayment() != null && booking.getPayment().getPaymentStatus() == PaymentStatus.PAID) {
            booking.getPayment().setPaymentStatus(PaymentStatus.REFUNDED);
        }
    }
}
