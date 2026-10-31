package com.hotel.booking.patterns.creational.factory;

import com.hotel.booking.enums.RoomType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class StandardRoomTemplate implements RoomTemplate {

    @Override
    public RoomType getRoomType() {
        return RoomType.STANDARD;
    }

    @Override
    public int getDefaultCapacity() {
        return 2;
    }

    @Override
    public String getDefaultBedType() {
        return "1 Queen Bed (1m6 x 2m)";
    }

    @Override
    public BigDecimal getDefaultBasePrice() {
        return new BigDecimal("850000");
    }

    @Override
    public String getDefaultDescription() {
        return "Phòng Standard tiêu chuẩn hiện đại, đầy đủ tiện nghi cơ bản, phù hợp cho chuyến công tác hoặc cặp đôi.";
    }

    @Override
    public List<String> getDefaultAmenities() {
        return List.of("Wi-Fi tốc độ cao", "Điều hòa 2 chiều", "Smart TV 43 inch", "Bình đun siêu tốc");
    }

    @Override
    public List<String> getDefaultImages() {
        return List.of(
                "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80"
        );
    }
}
