package com.hotel.booking.patterns.creational.factory;

import com.hotel.booking.enums.RoomType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class SuiteRoomTemplate implements RoomTemplate {

    @Override
    public RoomType getRoomType() {
        return RoomType.SUITE;
    }

    @Override
    public int getDefaultCapacity() {
        return 4;
    }

    @Override
    public String getDefaultBedType() {
        return "2 King Beds + Phòng khách riêng biệt";
    }

    @Override
    public BigDecimal getDefaultBasePrice() {
        return new BigDecimal("2950000");
    }

    @Override
    public String getDefaultDescription() {
        return "Phòng Presidential / Executive Suite sang trọng bậc nhất với phòng khách riêng, bể sục Jacuzzi và tầm nhìn Panorama.";
    }

    @Override
    public List<String> getDefaultAmenities() {
        return List.of(
                "Wi-Fi tốc độ cao",
                "Điều hòa 2 chiều",
                "Smart TV 65 inch OLED",
                "Ban công hướng biển",
                "Bồn tắm Jacuzzi",
                "Minibar",
                "Máy pha cà phê Espresso",
                "Phòng khách riêng"
        );
    }

    @Override
    public List<String> getDefaultImages() {
        return List.of(
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80"
        );
    }
}
