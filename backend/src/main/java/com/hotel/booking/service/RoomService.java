package com.hotel.booking.service;

import com.hotel.booking.dto.RoomDtos.CreateOrUpdateRoomCategoryRequest;
import com.hotel.booking.dto.RoomDtos.CreateOrUpdateRoomRequest;
import com.hotel.booking.dto.RoomDtos.RoomCategoryDto;
import com.hotel.booking.dto.RoomDtos.RoomDto;
import com.hotel.booking.entity.Amenity;
import com.hotel.booking.entity.Room;
import com.hotel.booking.entity.RoomCategory;
import com.hotel.booking.entity.RoomImage;
import com.hotel.booking.enums.RoomStatus;
import com.hotel.booking.exception.BusinessRuleException;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.patterns.creational.builder.RoomSearchCriteria;
import com.hotel.booking.patterns.creational.factory.RoomFactory;
import com.hotel.booking.repository.AmenityRepository;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.RoomCategoryRepository;
import com.hotel.booking.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomCategoryRepository roomCategoryRepository;
    private final AmenityRepository amenityRepository;
    private final BookingRepository bookingRepository;
    private final RoomFactory roomFactory;

    // =========================================================================
    // ROOM CATEGORY MANAGEMENT (HẠNG PHÒNG)
    // =========================================================================

    public List<RoomCategoryDto> getAllRoomCategories() {
        return roomCategoryRepository.findAll().stream()
                .map(this::toCategoryDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoomCategoryDto createRoomCategory(CreateOrUpdateRoomCategoryRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (roomCategoryRepository.existsByCodeIgnoreCase(code)) {
            throw new BusinessRuleException("Mã hạng phòng '" + code + "' đã tồn tại.");
        }

        RoomCategory category = RoomCategory.builder()
                .code(code)
                .name(request.getName().trim())
                .defaultPrice(request.getDefaultPrice())
                .defaultCapacity(request.getDefaultCapacity())
                .defaultBedType(request.getDefaultBedType().trim())
                .defaultDescription(request.getDefaultDescription())
                .defaultAmenities(request.getDefaultAmenities())
                .defaultImageUrl(request.getDefaultImageUrl())
                .build();

        return toCategoryDto(roomCategoryRepository.save(category));
    }

    @Transactional
    public RoomCategoryDto updateRoomCategory(Long id, CreateOrUpdateRoomCategoryRequest request) {
        RoomCategory category = roomCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hạng phòng với ID: " + id));

        String newCode = request.getCode().trim().toUpperCase();
        String oldCode = category.getCode();

        roomCategoryRepository.findByCodeIgnoreCase(newCode)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BusinessRuleException("Mã hạng phòng '" + newCode + "' đã thuộc về hạng phòng khác.");
                });

        category.setCode(newCode);
        category.setName(request.getName().trim());
        category.setDefaultPrice(request.getDefaultPrice());
        category.setDefaultCapacity(request.getDefaultCapacity());
        category.setDefaultBedType(request.getDefaultBedType().trim());
        category.setDefaultDescription(request.getDefaultDescription());
        category.setDefaultAmenities(request.getDefaultAmenities());
        category.setDefaultImageUrl(request.getDefaultImageUrl());

        RoomCategory saved = roomCategoryRepository.save(category);

        // If category code changed, synchronize rooms using the old code
        if (!oldCode.equalsIgnoreCase(newCode)) {
            List<Room> roomsToUpdate = roomRepository.findAll().stream()
                    .filter(r -> r.getRoomType().equalsIgnoreCase(oldCode))
                    .collect(Collectors.toList());
            for (Room r : roomsToUpdate) {
                r.setRoomType(newCode);
            }
            roomRepository.saveAll(roomsToUpdate);
        }

        return toCategoryDto(saved);
    }

    @Transactional
    public void deleteRoomCategory(Long id) {
        RoomCategory category = roomCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hạng phòng với ID: " + id));

        boolean inUse = roomRepository.findAll().stream()
                .anyMatch(r -> r.getRoomType().equalsIgnoreCase(category.getCode()));
        if (inUse) {
            throw new BusinessRuleException(
                    "Không thể xóa hạng phòng '" + category.getCode() + "' vì đang có phòng thuộc hạng này."
            );
        }

        roomCategoryRepository.delete(category);
    }

    public RoomCategoryDto toCategoryDto(RoomCategory cat) {
        return RoomCategoryDto.builder()
                .id(cat.getId())
                .code(cat.getCode())
                .name(cat.getName())
                .defaultPrice(cat.getDefaultPrice())
                .defaultCapacity(cat.getDefaultCapacity())
                .defaultBedType(cat.getDefaultBedType())
                .defaultDescription(cat.getDefaultDescription())
                .defaultAmenities(cat.getDefaultAmenities())
                .defaultImageUrl(cat.getDefaultImageUrl())
                .build();
    }

    // =========================================================================
    // ROOM MANAGEMENT (PHÒNG KHÁCH SẠN)
    // =========================================================================

    public List<RoomDto> searchRooms(RoomSearchCriteria criteria) {
        return roomRepository.findAll().stream()
                .filter(room -> matchesCriteria(room, criteria))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public RoomDto getRoomDtoById(Long id) {
        return toDto(getRoomEntityById(id));
    }

    public Room getRoomEntityById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng với ID: " + id));
    }

    public Room validateRoomForBooking(Long roomId, LocalDate checkIn, LocalDate checkOut, int guestCount) {
        Room room = getRoomEntityById(roomId);
        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new BusinessRuleException("Phòng " + room.getRoomNumber() + " hiện đang bảo trì hoặc không sẵn sàng đón khách.");
        }
        if (guestCount > room.getCapacity()) {
            throw new BusinessRuleException(String.format(
                    "Phòng %s chỉ có sức chứa tối đa %d khách (bạn chọn %d khách).",
                    room.getName(), room.getCapacity(), guestCount
            ));
        }
        boolean overlapping = bookingRepository.existsOverlappingBooking(roomId, checkIn, checkOut);
        if (overlapping) {
            throw new BusinessRuleException(String.format(
                    "Phòng %s đã được đặt trong khoảng ngày %s đến %s. Vui lòng chọn ngày hoặc phòng khác.",
                    room.getRoomNumber(), checkIn, checkOut
            ));
        }
        return room;
    }

    @Transactional
    public RoomDto createRoom(CreateOrUpdateRoomRequest request) {
        if (roomRepository.existsByRoomNumber(request.getRoomNumber().trim())) {
            throw new BusinessRuleException("Số phòng '" + request.getRoomNumber() + "' đã tồn tại.");
        }

        Room room = roomFactory.createRoom(
                request.getRoomNumber().trim(),
                request.getName().trim(),
                request.getRoomType().trim().toUpperCase(),
                request.getLocation().trim(),
                request.getPricePerNight(),
                request.getCapacity(),
                request.getBedType(),
                request.getDescription(),
                request.getStatus(),
                request.getImages(),
                this::resolveOrCreateAmenity
        );

        if (request.getAmenities() != null && !request.getAmenities().isEmpty()) {
            Set<Amenity> customAmenities = new HashSet<>();
            for (String amenityName : request.getAmenities()) {
                if (amenityName != null && !amenityName.isBlank()) {
                    customAmenities.add(resolveOrCreateAmenity(amenityName.trim()));
                }
            }
            room.setAmenities(customAmenities);
        }

        return toDto(roomRepository.save(room));
    }

    @Transactional
    public RoomDto updateRoom(Long id, CreateOrUpdateRoomRequest request) {
        Room room = getRoomEntityById(id);

        roomRepository.findByRoomNumber(request.getRoomNumber().trim())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BusinessRuleException("Số phòng '" + request.getRoomNumber() + "' đã thuộc về phòng khác.");
                });

        room.setRoomNumber(request.getRoomNumber().trim());
        room.setName(request.getName().trim());
        room.setRoomType(request.getRoomType().trim().toUpperCase());
        room.setLocation(request.getLocation().trim());

        if (request.getPricePerNight() != null) {
            room.setPricePerNight(request.getPricePerNight());
        }
        if (request.getCapacity() != null) {
            room.setCapacity(request.getCapacity());
        }
        if (request.getBedType() != null && !request.getBedType().isBlank()) {
            room.setBedType(request.getBedType().trim());
        }
        if (request.getStatus() != null) {
            room.setStatus(request.getStatus());
        }
        if (request.getDescription() != null) {
            room.setDescription(request.getDescription());
        }

        if (request.getImages() != null && !request.getImages().isEmpty()) {
            room.getImages().clear();
            for (int i = 0; i < request.getImages().size(); i++) {
                String url = request.getImages().get(i);
                if (url != null && !url.isBlank()) {
                    room.addImage(url.trim(), i == 0);
                }
            }
        }

        if (request.getAmenities() != null) {
            Set<Amenity> updatedAmenities = new HashSet<>();
            for (String amenityName : request.getAmenities()) {
                if (amenityName != null && !amenityName.isBlank()) {
                    updatedAmenities.add(resolveOrCreateAmenity(amenityName.trim()));
                }
            }
            room.setAmenities(updatedAmenities);
        }

        return toDto(roomRepository.save(room));
    }

    @Transactional
    public void deleteRoom(Long id) {
        Room room = getRoomEntityById(id);
        roomRepository.delete(room);
    }

    private Amenity resolveOrCreateAmenity(String name) {
        return amenityRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> amenityRepository.save(Amenity.builder().name(name).icon("sparkles").build()));
    }

    private boolean matchesCriteria(Room room, RoomSearchCriteria c) {
        if (c == null) {
            return true;
        }
        if (c.getStatus() != null && room.getStatus() != c.getStatus()) {
            return false;
        }
        if (c.getRoomType() != null && !room.getRoomType().equalsIgnoreCase(c.getRoomType())) {
            return false;
        }
        if (c.getMinGuests() != null && room.getCapacity() < c.getMinGuests()) {
            return false;
        }
        if (c.getMinPrice() != null && room.getPricePerNight().compareTo(c.getMinPrice()) < 0) {
            return false;
        }
        if (c.getMaxPrice() != null && room.getPricePerNight().compareTo(c.getMaxPrice()) > 0) {
            return false;
        }
        if (c.getLocation() != null) {
            boolean locMatch = room.getLocation().toLowerCase().contains(c.getLocation().toLowerCase());
            if (!locMatch) {
                return false;
            }
        }
        if (c.getKeyword() != null) {
            String kw = c.getKeyword().toLowerCase();
            boolean kwMatch = room.getName().toLowerCase().contains(kw)
                    || room.getLocation().toLowerCase().contains(kw)
                    || room.getRoomNumber().toLowerCase().contains(kw)
                    || (room.getDescription() != null && room.getDescription().toLowerCase().contains(kw));
            if (!kwMatch) {
                return false;
            }
        }
        if (c.getCheckInDate() != null && c.getCheckOutDate() != null && c.getCheckOutDate().isAfter(c.getCheckInDate())) {
            boolean hasConflict = bookingRepository.existsOverlappingBooking(
                    room.getId(), c.getCheckInDate(), c.getCheckOutDate()
            );
            if (hasConflict) {
                return false;
            }
        }
        return true;
    }

    public RoomDto toDto(Room room) {
        List<String> imageUrls = room.getImages().stream()
                .map(RoomImage::getImageUrl)
                .collect(Collectors.toList());

        List<String> amenityNames = room.getAmenities().stream()
                .map(Amenity::getName)
                .sorted()
                .collect(Collectors.toList());

        return RoomDto.builder()
                .id(room.getId())
                .roomNumber(room.getRoomNumber())
                .name(room.getName())
                .roomType(room.getRoomType())
                .location(room.getLocation())
                .pricePerNight(room.getPricePerNight())
                .capacity(room.getCapacity())
                .bedType(room.getBedType())
                .status(room.getStatus())
                .description(room.getDescription())
                .images(imageUrls)
                .amenities(amenityNames)
                .build();
    }
}
