package com.hotel.booking.service;

import com.hotel.booking.dto.BookingDtos.BookingResponse;
import com.hotel.booking.dto.DashboardDtos.NotificationDto;
import com.hotel.booking.dto.UserDtos.CreateUserAdminRequest;
import com.hotel.booking.dto.UserDtos.UpdateUserAdminRequest;
import com.hotel.booking.dto.UserDtos.UserDetailDto;
import com.hotel.booking.dto.UserDtos.UserDto;
import com.hotel.booking.entity.Booking;
import com.hotel.booking.entity.Notification;
import com.hotel.booking.entity.User;
import com.hotel.booking.enums.BookingStatus;
import com.hotel.booking.enums.RoleType;
import com.hotel.booking.exception.BusinessRuleException;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.patterns.structural.facade.BookingFacade;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.NotificationRepository;
import com.hotel.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final BookingRepository bookingRepository;
    private final BookingFacade bookingFacade;
    private final PasswordEncoder passwordEncoder;

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
    }

    public UserDetailDto getUserDetailByAdmin(Long id) {
        User user = getUserById(id);
        List<BookingResponse> userBookings = bookingFacade.getUserBookings(id);
        BigDecimal totalSpent = userBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED
                        || b.getStatus() == BookingStatus.CHECKED_IN
                        || b.getStatus() == BookingStatus.CHECKED_OUT)
                .map(BookingResponse::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return UserDetailDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .locked(user.isLocked())
                .createdAt(user.getCreatedAt())
                .totalBookings(userBookings.size())
                .totalSpent(totalSpent)
                .bookings(userBookings)
                .build();
    }

    @Transactional
    public UserDto createUserByAdmin(CreateUserAdminRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessRuleException("Email '" + normalizedEmail + "' đã tồn tại trên hệ thống.");
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone() != null ? request.getPhone().trim() : "")
                .role(request.getRole() != null ? request.getRole() : RoleType.ROLE_USER)
                .locked(false)
                .build();

        return toDto(userRepository.save(user));
    }

    @Transactional
    public UserDto updateUserByAdmin(Long id, UpdateUserAdminRequest request) {
        User user = getUserById(id);

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            userRepository.findByEmail(newEmail)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new BusinessRuleException("Email '" + newEmail + "' đã thuộc về người dùng khác.");
                    });
            user.setEmail(newEmail);
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getLocked() != null) {
            user.setLocked(request.getLocked());
        }

        return toDto(userRepository.save(user));
    }

    @Transactional
    public void deleteUserByAdmin(Long id) {
        User user = getUserById(id);
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(id);
        notificationRepository.deleteAll(notifications);

        List<Booking> bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(id);
        bookingRepository.deleteAll(bookings);

        userRepository.delete(user);
    }

    @Transactional
    public UserDto toggleLockUser(Long id) {
        User user = getUserById(id);
        user.setLocked(!user.isLocked());
        return toDto(userRepository.save(user));
    }

    public List<NotificationDto> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(n -> NotificationDto.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .read(n.isRead())
                        .createdAt(n.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public NotificationDto markNotificationAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo với ID: " + notificationId));
        if (!notification.getUser().getId().equals(userId)) {
            throw new BusinessRuleException("Bạn không có quyền cập nhật thông báo này.");
        }
        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return NotificationDto.builder()
                .id(saved.getId())
                .title(saved.getTitle())
                .message(saved.getMessage())
                .read(saved.isRead())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Transactional
    public void markAllNotificationsAsRead(Long userId) {
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (Notification n : list) {
            n.setRead(true);
        }
        notificationRepository.saveAll(list);
    }

    public UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .locked(user.isLocked())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
