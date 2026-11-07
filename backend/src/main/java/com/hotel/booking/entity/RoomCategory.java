package com.hotel.booking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "room_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "default_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal defaultPrice;

    @Column(name = "default_capacity", nullable = false)
    private Integer defaultCapacity;

    @Column(name = "default_bed_type", nullable = false, length = 100)
    private String defaultBedType;

    @Column(name = "default_description", columnDefinition = "TEXT")
    private String defaultDescription;

    @Column(name = "default_amenities", columnDefinition = "TEXT")
    private String defaultAmenities;

    @Column(name = "default_image_url", columnDefinition = "LONGTEXT")
    private String defaultImageUrl;
}
