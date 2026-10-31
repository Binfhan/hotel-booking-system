package com.hotel.booking.patterns.behavioral.state;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.enums.BookingStatus;

/**
 * BEHAVIORAL PATTERN 6: State Pattern - State Interface
 * Governs valid lifecycle transitions of a Booking.
 */
public interface BookingState {
    BookingStatus getStatus();
    void confirm(Booking booking);
    void checkIn(Booking booking);
    void checkOut(Booking booking);
    void cancel(Booking booking);
}
