package com.hotel.booking.controller;

import com.hotel.booking.dto.BookingDtos.BookingResponse;
import com.hotel.booking.dto.BookingDtos.CreateBookingRequest;
import com.hotel.booking.dto.BookingDtos.PreviewBookingRequest;
import com.hotel.booking.dto.BookingDtos.PriceBreakdownResponse;
import com.hotel.booking.dto.DashboardDtos.NotificationDto;
import com.hotel.booking.entity.User;
import com.hotel.booking.enums.BookingAction;
import com.hotel.booking.patterns.creational.builder.BookingOrder;
import com.hotel.booking.patterns.structural.facade.BookingFacade;
import com.hotel.booking.service.AuthService;
import com.hotel.booking.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingFacade bookingFacade;
    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/preview")
    public ResponseEntity<PriceBreakdownResponse> previewBookingPrice(
            @Valid @RequestBody PreviewBookingRequest request
    ) {
        BookingOrder order = BookingOrder.builder()
                .roomId(request.getRoomId())
                .dates(request.getCheckInDate(), request.getCheckOutDate())
                .guestCount(request.getGuestCount())
                .addonServices(request.getAddonServices())
                .voucherCode(request.getVoucherCode())
                .build();

        return ResponseEntity.ok(bookingFacade.previewBookingPrice(order));
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateBookingRequest request
    ) {
        User currentUser = authService.getCurrentUser(userDetails.getUsername());

        BookingOrder order = BookingOrder.builder()
                .userId(currentUser.getId())
                .roomId(request.getRoomId())
                .dates(request.getCheckInDate(), request.getCheckOutDate())
                .guestCount(request.getGuestCount())
                .addonServices(request.getAddonServices())
                .voucherCode(request.getVoucherCode())
                .paymentMethod(request.getPaymentMethod())
                .specialRequests(request.getSpecialRequests())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(bookingFacade.placeBooking(order));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponse>> getMyBookings(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User currentUser = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(bookingFacade.getUserBookings(currentUser.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User currentUser = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(bookingFacade.getBookingById(id, currentUser));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelMyBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User currentUser = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(bookingFacade.transitionBookingState(id, BookingAction.CANCEL, currentUser));
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDto>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User currentUser = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(userService.getUserNotifications(currentUser.getId()));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<NotificationDto> markNotificationAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User currentUser = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(userService.markNotificationAsRead(id, currentUser.getId()));
    }

    @PatchMapping("/notifications/read-all")
    public ResponseEntity<List<NotificationDto>> markAllNotificationsAsRead(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User currentUser = authService.getCurrentUser(userDetails.getUsername());
        userService.markAllNotificationsAsRead(currentUser.getId());
        return ResponseEntity.ok(userService.getUserNotifications(currentUser.getId()));
    }
}
