package com.hotel.booking.patterns.behavioral.observer;

import com.hotel.booking.entity.Booking;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class EmailNotificationObserver implements BookingObserver {

    @Override
    public void onBookingEvent(BookingEvent event) {
        Booking booking = event.getBooking();
        log.info("[EMAIL-OBSERVER] Sending email to <{}> for Booking #{} ({}): {}",
                booking.getUser().getEmail(),
                booking.getBookingCode(),
                event.getEventType(),
                event.getMessage());
    }
}
