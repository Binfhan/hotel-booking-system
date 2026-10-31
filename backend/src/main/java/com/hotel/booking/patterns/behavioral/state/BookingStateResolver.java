package com.hotel.booking.patterns.behavioral.state;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.enums.BookingAction;
import com.hotel.booking.enums.BookingStatus;
import com.hotel.booking.exception.BusinessRuleException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class BookingStateResolver {

    private final Map<BookingStatus, BookingState> stateMap;

    public BookingStateResolver(List<BookingState> states) {
        this.stateMap = states.stream()
                .collect(Collectors.toMap(BookingState::getStatus, Function.identity()));
    }

    public BookingState resolve(BookingStatus status) {
        BookingState state = stateMap.get(status);
        if (state == null) {
            throw new BusinessRuleException("Trạng thái Booking không hợp lệ: " + status);
        }
        return state;
    }

    public void applyAction(Booking booking, BookingAction action) {
        BookingState currentState = resolve(booking.getStatus());
        switch (action) {
            case CONFIRM -> currentState.confirm(booking);
            case CHECK_IN -> currentState.checkIn(booking);
            case CHECK_OUT -> currentState.checkOut(booking);
            case CANCEL -> currentState.cancel(booking);
        }
    }
}
