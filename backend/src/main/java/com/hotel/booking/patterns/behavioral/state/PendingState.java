package com.hotel.booking.patterns.behavioral.state;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.enums.BookingStatus;
import com.hotel.booking.enums.PaymentStatus;
import com.hotel.booking.enums.RoomStatus;
import com.hotel.booking.exception.BusinessRuleException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class PendingState implements BookingState {

    @Override
    public BookingStatus getStatus() {
        return BookingStatus.PENDING;
    }

    @Override
    public void confirm(Booking booking) {
        booking.setStatus(BookingStatus.CONFIRMED);
        if (booking.getRoom() != null && booking.getCheckInDate() != null
                && !booking.getCheckInDate().isAfter(LocalDate.now())) {
            booking.getRoom().setStatus(RoomStatus.OCCUPIED);
        }
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
        if (booking.getRoom() != null && booking.getRoom().getStatus() == RoomStatus.OCCUPIED) {
            booking.getRoom().setStatus(RoomStatus.AVAILABLE);
        }
        if (booking.getPayment() != null && booking.getPayment().getPaymentStatus() == PaymentStatus.PAID) {
            booking.getPayment().setPaymentStatus(PaymentStatus.REFUNDED);
        }
    }
}
