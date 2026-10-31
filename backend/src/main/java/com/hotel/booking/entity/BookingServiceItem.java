package com.hotel.booking.entity;

import com.hotel.booking.enums.AddonServiceType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "booking_services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingServiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 40)
    private AddonServiceType serviceType;

    @Column(name = "service_name", nullable = false, length = 120)
    private String serviceName;

    @Column(name = "price", nullable = false, precision = 15, scale = 2)
    private BigDecimal price;
}
