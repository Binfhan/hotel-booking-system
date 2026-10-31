package com.hotel.booking.patterns.creational.factory;

import com.hotel.booking.entity.Amenity;
import com.hotel.booking.entity.Room;
import com.hotel.booking.entity.RoomCategory;
import com.hotel.booking.enums.RoomStatus;
import com.hotel.booking.repository.RoomCategoryRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * CREATIONAL PATTERN 2: Factory Method Pattern - Creator / Factory
 * Encapsulates room instantiation logic based on RoomCategory / RoomTemplate defaults.
 */
@Component
public class RoomFactory {

    private final Map<String, RoomTemplate> templateMap;
    private final RoomCategoryRepository roomCategoryRepository;

    public RoomFactory(List<RoomTemplate> templates, RoomCategoryRepository roomCategoryRepository) {
        this.templateMap = templates.stream()
                .collect(Collectors.toMap(t -> t.getRoomType().name(), Function.identity()));
        this.roomCategoryRepository = roomCategoryRepository;
    }

    public Room createRoom(
            String roomNumber,
            String name,
            String roomTypeCode,
            String location,
            BigDecimal customPrice,
            Integer customCapacity,
            String customBedType,
            String customDescription,
            RoomStatus status,
            List<String> imageUrls,
            Function<String, Amenity> amenityResolver
    ) {
        String normalizedType = (roomTypeCode != null && !roomTypeCode.isBlank())
                ? roomTypeCode.trim().toUpperCase()
                : "STANDARD";

        Optional<RoomCategory> dbCategoryOpt = roomCategoryRepository.findByCodeIgnoreCase(normalizedType);
        RoomTemplate fallbackTemplate = templateMap.getOrDefault(normalizedType, templateMap.get("STANDARD"));

        BigDecimal defaultPrice = dbCategoryOpt.map(RoomCategory::getDefaultPrice)
                .orElseGet(fallbackTemplate::getDefaultBasePrice);
        int defaultCapacity = dbCategoryOpt.map(RoomCategory::getDefaultCapacity)
                .orElseGet(fallbackTemplate::getDefaultCapacity);
        String defaultBed = dbCategoryOpt.map(RoomCategory::getDefaultBedType)
                .orElseGet(fallbackTemplate::getDefaultBedType);
        String defaultDesc = dbCategoryOpt.map(RoomCategory::getDefaultDescription)
                .orElseGet(fallbackTemplate::getDefaultDescription);

        List<String> defaultAmenities = dbCategoryOpt
                .map(cat -> cat.getDefaultAmenities() != null && !cat.getDefaultAmenities().isBlank()
                        ? Arrays.stream(cat.getDefaultAmenities().split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .collect(Collectors.toList())
                        : fallbackTemplate.getDefaultAmenities())
                .orElseGet(fallbackTemplate::getDefaultAmenities);

        List<String> defaultImages = dbCategoryOpt
                .filter(cat -> cat.getDefaultImageUrl() != null && !cat.getDefaultImageUrl().isBlank())
                .map(cat -> List.of(cat.getDefaultImageUrl().trim()))
                .orElseGet(fallbackTemplate::getDefaultImages);

        Room room = Room.builder()
                .roomNumber(roomNumber)
                .name(name)
                .roomType(normalizedType)
                .location(location)
                .pricePerNight(customPrice != null ? customPrice : defaultPrice)
                .capacity(customCapacity != null ? customCapacity : defaultCapacity)
                .bedType((customBedType != null && !customBedType.isBlank()) ? customBedType : defaultBed)
                .description((customDescription != null && !customDescription.isBlank()) ? customDescription : defaultDesc)
                .status(status != null ? status : RoomStatus.AVAILABLE)
                .build();

        List<String> finalImages = (imageUrls != null && !imageUrls.isEmpty())
                ? imageUrls
                : defaultImages;

        for (int i = 0; i < finalImages.size(); i++) {
            room.addImage(finalImages.get(i), i == 0);
        }

        if (amenityResolver != null) {
            Set<Amenity> amenities = new HashSet<>();
            for (String amenityName : defaultAmenities) {
                Amenity amenity = amenityResolver.apply(amenityName);
                if (amenity != null) {
                    amenities.add(amenity);
                }
            }
            room.setAmenities(amenities);
        }

        return room;
    }
}
