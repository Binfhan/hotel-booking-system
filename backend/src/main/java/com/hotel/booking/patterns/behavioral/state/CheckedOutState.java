package com.hotel.booking.patterns.behavioral.state;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.enums.BookingStatus;
import com.hotel.booking.exception.BusinessRuleException;
import org.springframework.stereotype.Component;

@Component
public class CheckedOutState implements BookingState {

    @Override
    public BookingStatus getStatus() {
        return BookingStatus.CHECKED_OUT;
    }

    @Override
    public void confirm(Booking booking) {
        throw new BusinessRuleException("Đơn đặt phòng đã hoàn tất (CHECKED_OUT), không thể thay đổi trạng thái.");
    }

    @Override
    public void checkIn(Booking booking) {
        throw new BusinessRuleException("Đơn đặt phòng đã hoàn tất (CHECKED_OUT), không thể thay đổi trạng thái.");
    }

    @Override
    public void checkOut(Booking booking) {
        throw new BusinessRuleException("Đơn đặt phòng đã ở trạng thái CHECKED_OUT.");
    }

    @Override
    public void cancel(Booking booking) {
        throw new BusinessRuleException("Đơn đặt phòng đã hoàn tất (CHECKED_OUT), không thể hủy.");
    }
}
