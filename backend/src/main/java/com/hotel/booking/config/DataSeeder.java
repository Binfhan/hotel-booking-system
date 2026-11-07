package com.hotel.booking.config;

import com.hotel.booking.dto.RoomDtos.CreateOrUpdateRoomRequest;
import com.hotel.booking.entity.RoomCategory;
import com.hotel.booking.entity.RoomImage;
import com.hotel.booking.entity.User;
import com.hotel.booking.enums.*;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.RoomCategoryRepository;
import com.hotel.booking.repository.RoomRepository;
import com.hotel.booking.repository.UserRepository;
import com.hotel.booking.repository.VoucherRepository;
import com.hotel.booking.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoomCategoryRepository roomCategoryRepository;
    private final RoomRepository roomRepository;
    private final VoucherRepository voucherRepository;
    private final BookingRepository bookingRepository;
    private final RoomService roomService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        // 0. Automatically migrate image URL columns to LONGTEXT in MySQL to prevent Data Truncation on Base64/long URLs
        try {
            jdbcTemplate.execute("ALTER TABLE room_images MODIFY COLUMN image_url LONGTEXT NOT NULL");
            jdbcTemplate.execute("ALTER TABLE room_categories MODIFY COLUMN default_image_url LONGTEXT");
            log.info("Verified MySQL LONGTEXT columns for room_images.image_url and room_categories.default_image_url");
        } catch (Exception e) {
            log.warn("Could not alter image columns to LONGTEXT (may already be updated or non-MySQL dialect): {}", e.getMessage());
        }

        // Normalize any existing share links (e.g., ibb.co, drive.google.com, imgur.com) already stored in DB
        roomCategoryRepository.findAll().forEach(cat -> {
            if (cat.getDefaultImageUrl() != null && !cat.getDefaultImageUrl().startsWith("data:image/")) {
                String normalized = roomService.normalizeImageUrl(cat.getDefaultImageUrl());
                if (!normalized.equals(cat.getDefaultImageUrl())) {
                    cat.setDefaultImageUrl(normalized);
                    roomCategoryRepository.save(cat);
                }
            }
        });
        roomRepository.findAll().forEach(room -> {
            boolean changed = false;
            for (RoomImage img : room.getImages()) {
                if (img.getImageUrl() != null && !img.getImageUrl().startsWith("data:image/")) {
                    String normalized = roomService.normalizeImageUrl(img.getImageUrl());
                    if (!normalized.equals(img.getImageUrl())) {
                        img.setImageUrl(normalized);
                        changed = true;
                    }
                }
            }
            if (changed) {
                roomRepository.save(room);
            }
        });

        // 1. Clean up any previously cancelled bookings
        bookingRepository.deleteByStatus(BookingStatus.CANCELLED);

        // 2. Remove legacy pre-seeded sample vouchers (WELCOME10, FIXED300K, SUMMER15) if present without custom scope
        for (String legacyCode : List.of("WELCOME10", "FIXED300K", "SUMMER15")) {
            voucherRepository.findByCodeIgnoreCase(legacyCode).ifPresent(v -> {
                bookingRepository.findAll().stream()
                        .filter(b -> b.getVoucher() != null && b.getVoucher().getId().equals(v.getId()))
                        .forEach(b -> {
                            b.setVoucher(null);
                            bookingRepository.save(b);
                        });
                voucherRepository.delete(v);
            });
        }

        // 3. Ensure default Room Categories exist so Admin can manage them in "Quản lý Hạng phòng"
        if (roomCategoryRepository.count() == 0) {
            roomCategoryRepository.save(RoomCategory.builder()
                    .code("STANDARD")
                    .name("Hạng Phòng Standard Tiêu Chuẩn")
                    .defaultPrice(new BigDecimal("850000"))
                    .defaultCapacity(2)
                    .defaultBedType("1 Queen Bed (1m6 x 2m)")
                    .defaultDescription("Phòng Standard tiêu chuẩn hiện đại, đầy đủ tiện nghi cơ bản, phù hợp cho chuyến công tác hoặc cặp đôi.")
                    .defaultAmenities("Wi-Fi tốc độ cao, Điều hòa 2 chiều, Smart TV 43 inch, Bình đun siêu tốc")
                    .defaultImageUrl("https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80")
                    .build());

            roomCategoryRepository.save(RoomCategory.builder()
                    .code("DELUXE")
                    .name("Hạng Phòng Deluxe Cao Cấp")
                    .defaultPrice(new BigDecimal("1550000"))
                    .defaultCapacity(3)
                    .defaultBedType("1 King Bed (1m8 x 2m) + Sofa Bed")
                    .defaultDescription("Phòng Deluxe cao cấp với ban công hướng biển/thành phố, bồn tắm nằm thư giãn và không gian rộng rãi.")
                    .defaultAmenities("Wi-Fi tốc độ cao, Điều hòa 2 chiều, Smart TV 55 inch, Ban công hướng biển, Bồn tắm nằm, Minibar")
                    .defaultImageUrl("https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80")
                    .build());

            roomCategoryRepository.save(RoomCategory.builder()
                    .code("SUITE")
                    .name("Hạng Phòng Suite Thượng Hạng")
                    .defaultPrice(new BigDecimal("2950000"))
                    .defaultCapacity(4)
                    .defaultBedType("2 King Beds + Phòng khách riêng biệt")
                    .defaultDescription("Phòng Presidential / Executive Suite sang trọng bậc nhất với phòng khách riêng, bể sục Jacuzzi và tầm nhìn Panorama.")
                    .defaultAmenities("Wi-Fi tốc độ cao, Điều hòa 2 chiều, Smart TV 65 inch OLED, Ban công hướng biển, Bồn tắm Jacuzzi, Minibar, Máy pha cà phê Espresso, Phòng khách riêng")
                    .defaultImageUrl("https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80")
                    .build());
        }

        if (userRepository.count() > 0) {
            return;
        }

        log.info("Initializing default seed data (Admin, Users, Rooms)...");

        // 4. Seed Admin & Customer Users
        userRepository.save(User.builder()
                .fullName("Quản Trị Viên Hệ Thống")
                .email("admin@hotel.com")
                .passwordHash(passwordEncoder.encode("admin123"))
                .phone("0901234567")
                .role(RoleType.ROLE_ADMIN)
                .locked(false)
                .build());

        userRepository.save(User.builder()
                .fullName("Nguyễn Minh Quân")
                .email("user@hotel.com")
                .passwordHash(passwordEncoder.encode("user123"))
                .phone("0912345678")
                .role(RoleType.ROLE_USER)
                .locked(false)
                .build());

        userRepository.save(User.builder()
                .fullName("Trần Bảo Ngọc")
                .email("ngoc@hotel.com")
                .passwordHash(passwordEncoder.encode("user123"))
                .phone("0987654321")
                .role(RoleType.ROLE_USER)
                .locked(false)
                .build());

        // 5. Seed Rooms using Factory Method Pattern via RoomService
        roomService.createRoom(new CreateOrUpdateRoomRequest(
                "P101",
                "Standard Cozy City View",
                RoomType.STANDARD,
                "Đà Nẵng",
                new BigDecimal("850000"),
                2,
                null,
                RoomStatus.AVAILABLE,
                null,
                null,
                null
        ));

        roomService.createRoom(new CreateOrUpdateRoomRequest(
                "P102",
                "Standard Garden Twin",
                RoomType.STANDARD,
                "Nha Trang",
                new BigDecimal("920000"),
                2,
                "2 Single Beds (1m2 x 2m)",
                RoomStatus.AVAILABLE,
                "Phòng Standard hướng vườn thoáng mát với 2 giường đơn tiện lợi.",
                List.of(
                        "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1000&q=80",
                        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80"
                ),
                null
        ));

        roomService.createRoom(new CreateOrUpdateRoomRequest(
                "P201",
                "Deluxe Ocean Panorama",
                RoomType.DELUXE,
                "Đà Nẵng",
                new BigDecimal("1650000"),
                3,
                null,
                RoomStatus.AVAILABLE,
                null,
                null,
                null
        ));

        roomService.createRoom(new CreateOrUpdateRoomRequest(
                "P202",
                "Deluxe Mountain Retreat",
                RoomType.DELUXE,
                "Đà Lạt",
                new BigDecimal("1450000"),
                3,
                null,
                RoomStatus.AVAILABLE,
                "Phòng Deluxe sang trọng giữa rừng thông Đà Lạt với lò sưởi ấm cúng và ban công ngắm mây.",
                List.of(
                        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80",
                        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80"
                ),
                null
        ));

        roomService.createRoom(new CreateOrUpdateRoomRequest(
                "P301",
                "Royal Oceanfront Suite",
                RoomType.SUITE,
                "Phú Quốc",
                new BigDecimal("3200000"),
                4,
                null,
                RoomStatus.AVAILABLE,
                null,
                null,
                null
        ));

        roomService.createRoom(new CreateOrUpdateRoomRequest(
                "P302",
                "Presidential Skyline Suite",
                RoomType.SUITE,
                "TP. Hồ Chí Minh",
                new BigDecimal("3800000"),
                4,
                null,
                RoomStatus.MAINTENANCE,
                "Phòng Tổng thống tầng 45 tầm nhìn toàn cảnh trung tâm Sài Gòn (Đang bảo trì định kỳ).",
                null,
                null
        ));

        log.info("Seed data initialized successfully. Admin: admin@hotel.com / admin123 | User: user@hotel.com / user123");
    }
}
