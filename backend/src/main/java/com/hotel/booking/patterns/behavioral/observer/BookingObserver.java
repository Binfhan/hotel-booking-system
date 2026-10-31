package com.hotel.booking.patterns.behavioral.observer;

/**
 * BEHAVIORAL PATTERN 7: Observer Pattern - Observer Interface
 * Receives notifications whenever a Booking lifecycle event occurs.
 */
public interface BookingObserver {
    void onBookingEvent(BookingEvent event);
}
