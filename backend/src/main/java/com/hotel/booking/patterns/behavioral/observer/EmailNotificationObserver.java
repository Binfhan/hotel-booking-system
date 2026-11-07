package com.hotel.booking.patterns.behavioral.observer;

import com.hotel.booking.entity.Booking;
import com.hotel.booking.entity.BookingServiceItem;
import com.hotel.booking.entity.Payment;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

@Slf4j
@Component
public class EmailNotificationObserver implements BookingObserver {

    private static final DateTimeFormatter VN_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public EmailNotificationObserver(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void onBookingEvent(BookingEvent event) {
        Booking booking = event.getBooking();
        String recipientEmail = booking.getUser().getEmail();
        String subject = String.format("[Hotel Booking] Xác nhận #%s - %s (%s)",
                booking.getBookingCode(),
                booking.getRoom().getName(),
                event.getEventType());

        String textSummary = buildDetailedTextInvoice(event, booking);
        log.info("\n{}", textSummary);

        if (mailSender != null && mailUsername != null && !mailUsername.isBlank()) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());
                helper.setFrom(mailUsername);
                helper.setTo(recipientEmail);
                helper.setSubject(subject);
                helper.setText(buildHtmlInvoice(event, booking), true);
                mailSender.send(mimeMessage);
                log.info("[EMAIL-OBSERVER] Đã gửi Email SMTP thực tế thành công tới <{}> cho đơn #{}",
                        recipientEmail, booking.getBookingCode());
            } catch (Exception ex) {
                log.warn("[EMAIL-OBSERVER] Không thể gửi qua SMTP ({}). Đã chuyển sang chế độ lưu nội dung Email vào Log hệ thống.",
                        ex.getMessage());
            }
        } else {
            log.info("[EMAIL-OBSERVER] (Chế độ Local/Demo chưa cấu hình MAIL_USERNAME/MAIL_PASSWORD) -> Đã xuất hóa đơn Email chi tiết cho <{}> ở trên.",
                    recipientEmail);
        }
    }

    private String buildDetailedTextInvoice(BookingEvent event, Booking booking) {
        long nights = ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate());
        StringBuilder sb = new StringBuilder();
        sb.append("================================================================================\n");
        sb.append(String.format("  [EMAIL XÁC NHẬN ĐẶT PHÒNG KHÁCH SẠN] - SỰ KIỆN: %s\n", event.getEventType()));
        sb.append("================================================================================\n");
        sb.append(String.format("  • Người nhận       : %s <%s> | SĐT: %s\n",
                booking.getUser().getFullName(), booking.getUser().getEmail(), booking.getUser().getPhone()));
        sb.append(String.format("  • Mã đặt phòng     : #%s\n", booking.getBookingCode()));
        sb.append(String.format("  • Phòng & Địa điểm : Phòng %s - %s (%s - Hạng %s)\n",
                booking.getRoom().getRoomNumber(), booking.getRoom().getName(),
                booking.getRoom().getLocation(), booking.getRoom().getRoomType()));
        sb.append(String.format("  • Lịch lưu trú     : Nhận phòng %s -> Trả phòng %s (%d đêm, %d khách)\n",
                booking.getCheckInDate().format(VN_DATE_FMT),
                booking.getCheckOutDate().format(VN_DATE_FMT),
                nights,
                booking.getGuestCount()));
        sb.append("--------------------------------------------------------------------------------\n");
        sb.append("  CHI TIẾT CẤU THÀNH GIÁ (DECORATOR + STRATEGY PATTERN):\n");
        sb.append(String.format("  1. Tiền phòng cơ bản (%d đêm)        : %,.0f VNĐ\n",
                nights, booking.getBaseRoomCost()));

        if (booking.getAddonServices() == null || booking.getAddonServices().isEmpty()) {
            sb.append("  2. Dịch vụ cộng thêm (Add-ons)       : Không chọn (0 VNĐ)\n");
        } else {
            sb.append(String.format("  2. Dịch vụ cộng thêm (Tổng +%,.0f VNĐ):\n", booking.getAddonServicesCost()));
            for (BookingServiceItem item : booking.getAddonServices()) {
                sb.append(String.format("     + %-34s: %,.0f VNĐ\n", item.getServiceName(), item.getPrice()));
            }
        }

        if (booking.getVoucher() != null) {
            sb.append(String.format("  3. Mã giảm giá (%s)            : -%,.0f VNĐ\n",
                    booking.getVoucher().getCode(), booking.getDiscountAmount()));
        } else {
            sb.append("  3. Mã giảm giá (Voucher)             : Không áp dụng (0 VNĐ)\n");
        }

        sb.append(String.format("  => TỔNG TIỀN THANH TOÁN              : %,.0f VNĐ\n", booking.getTotalAmount()));
        sb.append("--------------------------------------------------------------------------------\n");
        Payment payment = booking.getPayment();
        if (payment != null) {
            sb.append(String.format("  • Phương thức & TT Thanh toán        : %s | %s (Mã GD: %s)\n",
                    payment.getPaymentMethod(), payment.getPaymentStatus(), payment.getTransactionRef()));
        }
        sb.append(String.format("  • Trạng thái Đơn đặt phòng           : %s\n", booking.getStatus()));
        sb.append(String.format("  • Trạng thái Phòng hiện tại          : %s\n", booking.getRoom().getStatus()));
        sb.append(String.format("  • Thông điệp hệ thống                : %s\n", event.getMessage()));
        sb.append("================================================================================");
        return sb.toString();
    }

    private String buildHtmlInvoice(BookingEvent event, Booking booking) {
        long nights = ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate());
        StringBuilder addonsHtml = new StringBuilder();
        if (booking.getAddonServices() == null || booking.getAddonServices().isEmpty()) {
            addonsHtml.append("<li>Không có dịch vụ cộng thêm (0 VNĐ)</li>");
        } else {
            for (BookingServiceItem item : booking.getAddonServices()) {
                addonsHtml.append(String.format("<li>%s: <strong>%,.0f VNĐ</strong></li>",
                        item.getServiceName(), item.getPrice()));
            }
        }

        String voucherText = booking.getVoucher() != null
                ? String.format("%s (-%,.0f VNĐ)", booking.getVoucher().getCode(), booking.getDiscountAmount())
                : "Không áp dụng (0 VNĐ)";

        return String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden;">
                  <div style="background: #1e3a8a; color: #ffffff; padding: 16px 24px;">
                    <h2 style="margin: 0;">Xác nhận Đặt phòng Khách sạn #%s</h2>
                    <p style="margin: 4px 0 0; opacity: 0.9;">Sự kiện: %s</p>
                  </div>
                  <div style="padding: 20px 24px; color: #1e293b; line-height: 1.6;">
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>%s</p>
                    <table style="width: 100%%; border-collapse: collapse; margin: 14px 0;">
                      <tr><td style="padding: 6px 0; color: #475569;">Phòng đặt:</td><td><strong>Phòng %s - %s (%s)</strong></td></tr>
                      <tr><td style="padding: 6px 0; color: #475569;">Ngày nhận - trả phòng:</td><td><strong>%s đến %s (%d đêm, %d khách)</strong></td></tr>
                      <tr><td style="padding: 6px 0; color: #475569;">Tiền phòng cơ bản:</td><td><strong>%,.0f VNĐ</strong></td></tr>
                      <tr><td style="padding: 6px 0; color: #475569;">Dịch vụ cộng thêm:</td><td><ul style="margin: 4px 0; padding-left: 18px;">%s</ul></td></tr>
                      <tr><td style="padding: 6px 0; color: #475569;">Giảm giá Voucher:</td><td><strong>%s</strong></td></tr>
                      <tr style="border-top: 2px solid #1e3a8a;"><td style="padding: 10px 0; font-size: 16px;"><strong>TỔNG THANH TOÁN:</strong></td><td style="padding: 10px 0; font-size: 18px; color: #1e3a8a;"><strong>%,.0f VNĐ</strong></td></tr>
                    </table>
                    <p style="font-size: 13px; color: #475569;">Trạng thái đơn: <strong>%s</strong> | Trạng thái phòng: <strong>%s</strong></p>
                  </div>
                </div>
                """,
                booking.getBookingCode(),
                event.getEventType(),
                booking.getUser().getFullName(),
                event.getMessage(),
                booking.getRoom().getRoomNumber(),
                booking.getRoom().getName(),
                booking.getRoom().getLocation(),
                booking.getCheckInDate().format(VN_DATE_FMT),
                booking.getCheckOutDate().format(VN_DATE_FMT),
                nights,
                booking.getGuestCount(),
                booking.getBaseRoomCost(),
                addonsHtml,
                voucherText,
                booking.getTotalAmount(),
                booking.getStatus(),
                booking.getRoom().getStatus()
        );
    }
}
