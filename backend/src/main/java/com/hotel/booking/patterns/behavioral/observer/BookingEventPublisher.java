package com.hotel.booking.patterns.behavioral.observer;

import org.springframework.stereotype.Component;

import java.util.List;

/**
 * BEHAVIORAL PATTERN 7: Observer Pattern - Subject / Publisher
 */
@Component
public class BookingEventPublisher {

    private final List<BookingObserver> observers;

    public BookingEventPublisher(List<BookingObserver> observers) {
        this.observers = observers;
    }

    public void notifyObservers(BookingEvent event) {
        for (BookingObserver observer : observers) {
            observer.onBookingEvent(event);
        }
    }
}
