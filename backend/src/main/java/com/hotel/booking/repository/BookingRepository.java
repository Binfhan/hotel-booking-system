package com.hotel.booking.repository;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByBookingCode(String bookingCode);

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByUserIdAndStatusNotOrderByCreatedAtDesc(Long userId, BookingStatus excludedStatus);

    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByStatusNotOrderByCreatedAtDesc(BookingStatus excludedStatus);

    void deleteByStatus(BookingStatus status);

    @Query("""
            SELECT COUNT(b) > 0 FROM Booking b
            WHERE b.room.id = :roomId
              AND b.status IN (com.hotel.booking.enums.BookingStatus.PENDING,
                               com.hotel.booking.enums.BookingStatus.CONFIRMED,
                               com.hotel.booking.enums.BookingStatus.CHECKED_IN)
              AND b.checkInDate < :checkOutDate
              AND b.checkOutDate > :checkInDate
            """)
    boolean existsOverlappingBooking(
            @Param("roomId") Long roomId,
            @Param("checkInDate") LocalDate checkInDate,
            @Param("checkOutDate") LocalDate checkOutDate
    );

    long countByStatus(BookingStatus status);

    @Query("""
            SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b
            WHERE b.status IN (com.hotel.booking.enums.BookingStatus.CONFIRMED,
                               com.hotel.booking.enums.BookingStatus.CHECKED_IN,
                               com.hotel.booking.enums.BookingStatus.CHECKED_OUT)
            """)
    BigDecimal calculateTotalConfirmedRevenue();
}
