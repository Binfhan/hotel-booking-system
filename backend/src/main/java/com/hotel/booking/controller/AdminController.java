package com.hotel.booking.controller;

import com.hotel.booking.dto.BookingDtos.BookingResponse;
import com.hotel.booking.dto.BookingDtos.UpdateBookingStateRequest;
import com.hotel.booking.dto.BookingDtos.UpdatePaymentStatusRequest;
import com.hotel.booking.dto.DashboardDtos.CreateOrUpdateVoucherRequest;
import com.hotel.booking.dto.DashboardDtos.DashboardStatsResponse;
import com.hotel.booking.dto.DashboardDtos.VoucherDto;
import com.hotel.booking.dto.RoomDtos.CreateOrUpdateRoomCategoryRequest;
import com.hotel.booking.dto.RoomDtos.CreateOrUpdateRoomRequest;
import com.hotel.booking.dto.RoomDtos.RoomCategoryDto;
import com.hotel.booking.dto.RoomDtos.RoomDto;
import com.hotel.booking.dto.UserDtos.CreateUserAdminRequest;
import com.hotel.booking.dto.UserDtos.UpdateUserAdminRequest;
import com.hotel.booking.dto.UserDtos.UserDetailDto;
import com.hotel.booking.dto.UserDtos.UserDto;
import com.hotel.booking.entity.User;
import com.hotel.booking.patterns.structural.facade.BookingFacade;
import com.hotel.booking.service.AuthService;
import com.hotel.booking.service.DashboardService;
import com.hotel.booking.service.RoomService;
import com.hotel.booking.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final DashboardService dashboardService;
    private final RoomService roomService;
    private final BookingFacade bookingFacade;
    private final UserService userService;
    private final AuthService authService;

    // 1. Dashboard Statistics
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }

    // 2. Room Category Management (Hạng phòng - CRUD)
    @GetMapping("/room-categories")
    public ResponseEntity<List<RoomCategoryDto>> getAllRoomCategories() {
        return ResponseEntity.ok(roomService.getAllRoomCategories());
    }

    @PostMapping("/room-categories")
    public ResponseEntity<RoomCategoryDto> createRoomCategory(
            @Valid @RequestBody CreateOrUpdateRoomCategoryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roomService.createRoomCategory(request));
    }

    @PutMapping("/room-categories/{id}")
    public ResponseEntity<RoomCategoryDto> updateRoomCategory(
            @PathVariable Long id,
            @Valid @RequestBody CreateOrUpdateRoomCategoryRequest request
    ) {
        return ResponseEntity.ok(roomService.updateRoomCategory(id, request));
    }

    @DeleteMapping("/room-categories/{id}")
    public ResponseEntity<Map<String, String>> deleteRoomCategory(@PathVariable Long id) {
        roomService.deleteRoomCategory(id);
        return ResponseEntity.ok(Map.of("message", "Xóa hạng phòng thành công"));
    }

    // 3. Room Management (CRUD + Factory Method)
    @PostMapping("/rooms")
    public ResponseEntity<RoomDto> createRoom(@Valid @RequestBody CreateOrUpdateRoomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roomService.createRoom(request));
    }

    @PutMapping("/rooms/{id}")
    public ResponseEntity<RoomDto> updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody CreateOrUpdateRoomRequest request
    ) {
        return ResponseEntity.ok(roomService.updateRoom(id, request));
    }

    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<Map<String, String>> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.ok(Map.of("message", "Xóa phòng thành công"));
    }

    // 4. Voucher Management (CRUD + Room Type Scope)
    @GetMapping("/vouchers")
    public ResponseEntity<List<VoucherDto>> getAllVouchers() {
        return ResponseEntity.ok(dashboardService.getAllVouchers());
    }

    @PostMapping("/vouchers")
    public ResponseEntity<VoucherDto> createVoucher(
            @Valid @RequestBody CreateOrUpdateVoucherRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dashboardService.createVoucher(request));
    }

    @PutMapping("/vouchers/{id}")
    public ResponseEntity<VoucherDto> updateVoucher(
            @PathVariable Long id,
            @Valid @RequestBody CreateOrUpdateVoucherRequest request
    ) {
        return ResponseEntity.ok(dashboardService.updateVoucher(id, request));
    }

    @DeleteMapping("/vouchers/{id}")
    public ResponseEntity<Map<String, String>> deleteVoucher(@PathVariable Long id) {
        dashboardService.deleteVoucher(id);
        return ResponseEntity.ok(Map.of("message", "Xóa voucher thành công"));
    }

    // 5. Booking & Payment Management (State + Observer Patterns)
    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingFacade.getAllBookings());
    }

    @PatchMapping("/bookings/{id}/state")
    public ResponseEntity<BookingResponse> updateBookingState(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBookingStateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User admin = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(bookingFacade.transitionBookingState(id, request.getAction(), admin));
    }

    @PatchMapping("/bookings/{id}/payment")
    public ResponseEntity<BookingResponse> updatePaymentStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePaymentStatusRequest request
    ) {
        return ResponseEntity.ok(bookingFacade.updatePaymentStatus(id, request.getPaymentStatus()));
    }

    // 6. User Management (Create, Read Detail, Update, Delete, Toggle Lock)
    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDetailDto> getUserDetail(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserDetailByAdmin(id));
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUserByAdmin(request));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserAdminRequest request
    ) {
        return ResponseEntity.ok(userService.updateUserByAdmin(id, request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        userService.deleteUserByAdmin(id);
        return ResponseEntity.ok(Map.of("message", "Xóa người dùng thành công"));
    }

    @PatchMapping("/users/{id}/toggle-lock")
    public ResponseEntity<UserDto> toggleLockUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleLockUser(id));
    }
}
