package com.hotel.booking.patterns.creational.factory;

import com.hotel.booking.enums.RoomType;

import java.math.BigDecimal;
import java.util.List;

/**
 * CREATIONAL PATTERN 2: Factory Method Pattern - Product Interface
 * Defines default configuration template for each category of hotel room.
 */
public interface RoomTemplate {
    RoomType getRoomType();
    int getDefaultCapacity();
    String getDefaultBedType();
    BigDecimal getDefaultBasePrice();
    String getDefaultDescription();
    List<String> getDefaultAmenities();
    List<String> getDefaultImages();
}
