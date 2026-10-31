package com.hotel.booking.patterns.behavioral.observer;

import com.hotel.booking.entity.Booking;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BookingEvent {
    private final String eventType;
    private final Booking booking;
    private final String message;
}
