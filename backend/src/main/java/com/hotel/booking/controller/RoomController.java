package com.hotel.booking.controller;

import com.hotel.booking.dto.DashboardDtos.VoucherDto;
import com.hotel.booking.dto.RoomDtos.RoomCategoryDto;
import com.hotel.booking.dto.RoomDtos.RoomDto;
import com.hotel.booking.enums.RoomStatus;
import com.hotel.booking.patterns.creational.builder.RoomSearchCriteria;
import com.hotel.booking.service.DashboardService;
import com.hotel.booking.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final DashboardService dashboardService;

    @GetMapping("/rooms")
    public ResponseEntity<List<RoomDto>> searchRooms(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false) Integer minGuests,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOutDate,
            @RequestParam(required = false) RoomStatus status
    ) {
        RoomSearchCriteria criteria = RoomSearchCriteria.builder()
                .keyword(keyword)
                .location(location)
                .roomType(roomType)
                .minGuests(minGuests)
                .priceRange(minPrice, maxPrice)
                .stayDates(checkInDate, checkOutDate)
                .status(status)
                .build();

        return ResponseEntity.ok(roomService.searchRooms(criteria));
    }

    @GetMapping("/rooms/{id}")
    public ResponseEntity<RoomDto> getRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getRoomDtoById(id));
    }

    @GetMapping("/room-categories")
    public ResponseEntity<List<RoomCategoryDto>> getRoomCategories() {
        return ResponseEntity.ok(roomService.getAllRoomCategories());
    }

    @GetMapping("/vouchers")
    public ResponseEntity<List<VoucherDto>> getActiveVouchers() {
        return ResponseEntity.ok(dashboardService.getActiveVouchers());
    }
}
