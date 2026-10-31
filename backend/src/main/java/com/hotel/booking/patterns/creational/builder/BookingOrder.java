package com.hotel.booking.patterns.creational.builder;

import com.hotel.booking.enums.AddonServiceType;
import com.hotel.booking.enums.PaymentMethodType;
import com.hotel.booking.exception.BusinessRuleException;
import lombok.Getter;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * CREATIONAL PATTERN 1B: Builder Pattern
 * Constructs an immutable BookingOrder object step-by-step and validates domain constraints.
 */
@Getter
public class BookingOrder {

    private final Long userId;
    private final Long roomId;
    private final LocalDate checkInDate;
    private final LocalDate checkOutDate;
    private final Integer guestCount;
    private final String voucherCode;
    private final List<AddonServiceType> addonServices;
    private final PaymentMethodType paymentMethod;
    private final String specialRequests;

    private BookingOrder(Builder builder) {
        this.userId = builder.userId;
        this.roomId = builder.roomId;
        this.checkInDate = builder.checkInDate;
        this.checkOutDate = builder.checkOutDate;
        this.guestCount = builder.guestCount;
        this.voucherCode = builder.voucherCode;
        this.addonServices = Collections.unmodifiableList(new ArrayList<>(builder.addonServices));
        this.paymentMethod = builder.paymentMethod;
        this.specialRequests = builder.specialRequests;
    }

    public long getStayNights() {
        return ChronoUnit.DAYS.between(checkInDate, checkOutDate);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long userId;
        private Long roomId;
        private LocalDate checkInDate;
        private LocalDate checkOutDate;
        private Integer guestCount = 1;
        private String voucherCode;
        private List<AddonServiceType> addonServices = new ArrayList<>();
        private PaymentMethodType paymentMethod = PaymentMethodType.PAY_AT_HOTEL;
        private String specialRequests;

        public Builder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public Builder roomId(Long roomId) {
            this.roomId = roomId;
            return this;
        }

        public Builder dates(LocalDate checkInDate, LocalDate checkOutDate) {
            this.checkInDate = checkInDate;
            this.checkOutDate = checkOutDate;
            return this;
        }

        public Builder guestCount(Integer guestCount) {
            this.guestCount = guestCount;
            return this;
        }

        public Builder voucherCode(String voucherCode) {
            this.voucherCode = (voucherCode != null && !voucherCode.isBlank())
                    ? voucherCode.trim().toUpperCase()
                    : null;
            return this;
        }

        public Builder addonServices(List<AddonServiceType> services) {
            if (services != null) {
                this.addonServices = new ArrayList<>(services);
            }
            return this;
        }

        public Builder addService(AddonServiceType service) {
            if (service != null && !this.addonServices.contains(service)) {
                this.addonServices.add(service);
            }
            return this;
        }

        public Builder paymentMethod(PaymentMethodType paymentMethod) {
            if (paymentMethod != null) {
                this.paymentMethod = paymentMethod;
            }
            return this;
        }

        public Builder specialRequests(String specialRequests) {
            this.specialRequests = specialRequests;
            return this;
        }

        private void validate() {
            if (roomId == null) {
                throw new BusinessRuleException("Phòng đặt không được để trống.");
            }
            if (checkInDate == null || checkOutDate == null) {
                throw new BusinessRuleException("Ngày nhận phòng và ngày trả phòng không được để trống.");
            }
            if (!checkOutDate.isAfter(checkInDate)) {
                throw new BusinessRuleException("Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.");
            }
            if (guestCount == null || guestCount <= 0) {
                throw new BusinessRuleException("Số lượng khách phải lớn hơn 0.");
            }
        }

        public BookingOrder build() {
            validate();
            return new BookingOrder(this);
        }
    }
}
