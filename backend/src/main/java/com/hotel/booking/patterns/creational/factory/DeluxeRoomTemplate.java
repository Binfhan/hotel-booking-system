package com.hotel.booking.patterns.creational.factory;

import com.hotel.booking.enums.RoomType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DeluxeRoomTemplate implements RoomTemplate {

    @Override
    public RoomType getRoomType() {
        return RoomType.DELUXE;
    }

    @Override
    public int getDefaultCapacity() {
        return 3;
    }

    @Override
    public String getDefaultBedType() {
        return "1 King Bed (1m8 x 2m) + Sofa Bed";
    }

    @Override
    public BigDecimal getDefaultBasePrice() {
        return new BigDecimal("1550000");
    }

    @Override
    public String getDefaultDescription() {
        return "Phòng Deluxe cao cấp với ban công hướng biển/thành phố, bồn tắm nằm thư giãn và không gian rộng rãi.";
    }

    @Override
    public List<String> getDefaultAmenities() {
        return List.of("Wi-Fi tốc độ cao", "Điều hòa 2 chiều", "Smart TV 55 inch", "Ban công hướng biển", "Bồn tắm nằm", "Minibar");
    }

    @Override
    public List<String> getDefaultImages() {
        return List.of(
                "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80"
        );
    }
}
