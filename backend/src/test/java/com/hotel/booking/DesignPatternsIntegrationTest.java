package com.hotel.booking;

import com.hotel.booking.dto.BookingDtos.BookingResponse;
import com.hotel.booking.dto.DashboardDtos.CreateOrUpdateVoucherRequest;
import com.hotel.booking.dto.RoomDtos.CreateOrUpdateRoomRequest;
import com.hotel.booking.dto.RoomDtos.RoomDto;
import com.hotel.booking.entity.User;
import com.hotel.booking.enums.*;
import com.hotel.booking.exception.BusinessRuleException;
import com.hotel.booking.patterns.creational.builder.BookingOrder;
import com.hotel.booking.patterns.creational.builder.RoomSearchCriteria;
import com.hotel.booking.patterns.structural.decorator.AirportPickupDecorator;
import com.hotel.booking.patterns.structural.decorator.BaseRoomBookingCost;
import com.hotel.booking.patterns.structural.decorator.BookingCostComponent;
import com.hotel.booking.patterns.structural.decorator.BreakfastDecorator;
import com.hotel.booking.patterns.structural.facade.BookingFacade;
import com.hotel.booking.repository.NotificationRepository;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.service.DashboardService;
import com.hotel.booking.service.RoomService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("h2")
class DesignPatternsIntegrationTest {

    @Autowired
    private RoomService roomService;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private BookingFacade bookingFacade;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    @DisplayName("1. Creational - Builder Pattern: Validates BookingOrder & RoomSearchCriteria")
    void testBuilderPattern() {
        BookingOrder order = BookingOrder.builder()
                .userId(1L)
                .roomId(1L)
                .dates(LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 4))
                .guestCount(2)
                .addService(AddonServiceType.BREAKFAST)
                .voucherCode("welcome10")
                .build();

        assertEquals(3, order.getStayNights());
        assertEquals("WELCOME10", order.getVoucherCode());
        assertEquals(1, order.getAddonServices().size());

        // Invalid date range should throw BusinessRuleException
        assertThrows(BusinessRuleException.class, () -> BookingOrder.builder()
                .roomId(1L)
                .dates(LocalDate.of(2026, 12, 5), LocalDate.of(2026, 12, 2))
                .guestCount(2)
                .build());

        RoomSearchCriteria criteria = RoomSearchCriteria.builder()
                .location("Đà Nẵng")
                .minGuests(2)
                .priceRange(new BigDecimal("500000"), new BigDecimal("2000000"))
                .build();

        List<RoomDto> results = roomService.searchRooms(criteria);
        assertFalse(results.isEmpty());
    }

    @Test
    @DisplayName("2. Creational - Factory Method Pattern: Creates SUITE room with default category attributes")
    void testFactoryMethodPattern() {
        CreateOrUpdateRoomRequest req = new CreateOrUpdateRoomRequest(
                "P999",
                "Test Suite Factory Room",
                RoomType.SUITE,
                "Hà Nội",
                null,
                null,
                null,
                RoomStatus.AVAILABLE,
                null,
                null,
                null
        );

        RoomDto created = roomService.createRoom(req);
        assertNotNull(created.getId());
        assertEquals("SUITE", created.getRoomType());
        assertEquals(4, created.getCapacity());
        assertEquals(0, new BigDecimal("2950000").compareTo(created.getPricePerNight()));
        assertFalse(created.getAmenities().isEmpty());
    }

    @Test
    @DisplayName("3. Structural - Decorator Pattern: Wraps base room cost with Breakfast & Airport Pickup")
    void testDecoratorPattern() {
        BookingCostComponent cost = new BaseRoomBookingCost("Deluxe Ocean", new BigDecimal("1000000"), 2);
        cost = new BreakfastDecorator(cost, 2, 2); // 150,000 * 2 guests * 2 nights = 600,000
        cost = new AirportPickupDecorator(cost);   // + 350,000

        assertEquals(new BigDecimal("2950000"), cost.calculateCost());
        assertTrue(cost.getDescription().contains("Buffet sáng"));
        assertTrue(cost.getDescription().contains("Xe riêng đưa đón sân bay"));
    }

    @Test
    @DisplayName("4, 5, 6, 7. Structural & Behavioral - Facade + Strategy + State + Observer workflow")
    void testFacadeStrategyStateAndObserverPatterns() {
        User customer = userRepository.findByEmail("user@hotel.com").orElseThrow();
        User admin = userRepository.findByEmail("admin@hotel.com").orElseThrow();
        List<RoomDto> rooms = roomService.searchRooms(RoomSearchCriteria.builder().status(RoomStatus.AVAILABLE).build());
        RoomDto targetRoom = rooms.get(0);

        // Create a test voucher via Admin Voucher Service
        dashboardService.createVoucher(new CreateOrUpdateVoucherRequest(
                "TEST10",
                DiscountType.PERCENTAGE,
                new BigDecimal("10"),
                new BigDecimal("500000"),
                "ALL",
                LocalDate.now().minusDays(1),
                LocalDate.now().plusMonths(6),
                true
        ));

        long initialNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(customer.getId()).size();

        BookingOrder order = BookingOrder.builder()
                .userId(customer.getId())
                .roomId(targetRoom.getId())
                .dates(LocalDate.now().plusDays(30), LocalDate.now().plusDays(32))
                .guestCount(2)
                .addService(AddonServiceType.BREAKFAST)
                .voucherCode("TEST10")
                .paymentMethod(PaymentMethodType.PAY_AT_HOTEL)
                .specialRequests("Test Facade & Patterns")
                .build();

        BookingResponse booking = bookingFacade.placeBooking(order);
        assertNotNull(booking.getId());
        assertEquals(BookingStatus.PENDING, booking.getStatus());
        assertTrue(booking.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0);

        // Observer Pattern check: In-App notification created
        long afterCreateNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(customer.getId()).size();
        assertTrue(afterCreateNotifications > initialNotifications);

        // State Pattern check: Cannot CHECK_IN while PENDING
        assertThrows(BusinessRuleException.class, () ->
                bookingFacade.transitionBookingState(booking.getId(), BookingAction.CHECK_IN, admin)
        );

        // Valid state transition: PENDING -> CONFIRMED -> CHECKED_IN -> CHECKED_OUT
        BookingResponse confirmed = bookingFacade.transitionBookingState(booking.getId(), BookingAction.CONFIRM, admin);
        assertEquals(BookingStatus.CONFIRMED, confirmed.getStatus());

        BookingResponse checkedIn = bookingFacade.transitionBookingState(booking.getId(), BookingAction.CHECK_IN, admin);
        assertEquals(BookingStatus.CHECKED_IN, checkedIn.getStatus());
        assertEquals(PaymentStatus.PAID, checkedIn.getPayment().getPaymentStatus());

        // Cannot CANCEL after CHECKED_IN
        assertThrows(BusinessRuleException.class, () ->
                bookingFacade.transitionBookingState(booking.getId(), BookingAction.CANCEL, admin)
        );

        BookingResponse checkedOut = bookingFacade.transitionBookingState(booking.getId(), BookingAction.CHECK_OUT, admin);
        assertEquals(BookingStatus.CHECKED_OUT, checkedOut.getStatus());

        // Test cancellation deletes the booking from both User and Admin active booking lists
        BookingOrder cancelOrder = BookingOrder.builder()
                .userId(customer.getId())
                .roomId(targetRoom.getId())
                .dates(LocalDate.now().plusDays(40), LocalDate.now().plusDays(42))
                .guestCount(1)
                .paymentMethod(PaymentMethodType.PAY_AT_HOTEL)
                .build();
        BookingResponse toCancel = bookingFacade.placeBooking(cancelOrder);
        bookingFacade.transitionBookingState(toCancel.getId(), BookingAction.CANCEL, customer);

        boolean existsInAdmin = bookingFacade.getAllBookings().stream()
                .anyMatch(b -> b.getId().equals(toCancel.getId()));
        assertFalse(existsInAdmin, "Cancelled booking must be removed from Admin booking list");
    }
}
