package com.hotel.booking.patterns.behavioral.observer;

import com.hotel.booking.entity.Booking;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuditLogObserver implements BookingObserver {

    @Override
    public void onBookingEvent(BookingEvent event) {
        Booking booking = event.getBooking();
        log.info("[AUDIT-LOG-OBSERVER] Event={} | BookingCode={} | Room={} | Status={} | TotalAmount={}",
                event.getEventType(),
                booking.getBookingCode(),
                booking.getRoom().getRoomNumber(),
                booking.getStatus(),
                booking.getTotalAmount());
    }
}
