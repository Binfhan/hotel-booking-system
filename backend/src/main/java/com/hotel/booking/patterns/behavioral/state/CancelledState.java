package com.hotel.booking.patterns.behavioral.state;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.enums.BookingStatus;
import com.hotel.booking.exception.BusinessRuleException;
import org.springframework.stereotype.Component;

@Component
public class CancelledState implements BookingState {

    @Override
    public BookingStatus getStatus() {
        return BookingStatus.CANCELLED;
    }

    @Override
    public void confirm(Booking booking) {
        throw new BusinessRuleException("Đơn đặt phòng đã bị hủy (CANCELLED), không thể xác nhận lại.");
    }

    @Override
    public void checkIn(Booking booking) {
        throw new BusinessRuleException("Đơn đặt phòng đã bị hủy (CANCELLED), không thể Check-in.");
    }

    @Override
    public void checkOut(Booking booking) {
        throw new BusinessRuleException("Đơn đặt phòng đã bị hủy (CANCELLED), không thể Check-out.");
    }

    @Override
    public void cancel(Booking booking) {
        throw new BusinessRuleException("Đơn đặt phòng đã ở trạng thái CANCELLED.");
    }
}
