package com.hotel.booking.patterns.behavioral.observer;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.entity.Notification;
import com.hotel.booking.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InAppNotificationObserver implements BookingObserver {

    private final NotificationRepository notificationRepository;

    @Override
    public void onBookingEvent(BookingEvent event) {
        Booking booking = event.getBooking();
        Notification notification = Notification.builder()
                .user(booking.getUser())
                .title("Cập nhật đơn đặt phòng #" + booking.getBookingCode())
                .message(event.getMessage())
                .read(false)
                .build();
        notificationRepository.save(notification);
    }
}
