# Hệ thống Quản lý Đặt phòng Khách sạn (Hotel Booking Management System)

Đồ án môn học **Mẫu Thiết Kế Phần Mềm (Design Patterns)** — Xây dựng hệ thống quản lý đặt phòng khách sạn áp dụng **5 nguyên lý SOLID** và **07 Design Patterns** (thuộc đủ 3 nhóm *Creational, Structural, Behavioral*) với kiến trúc **Frontend (Next.js 14 App Router + TypeScript + Tailwind CSS)** tách rời **Backend (Java Spring Boot 3 MVC REST API + MySQL)**.

- 📄 **Báo cáo học thuật chi tiết (UML, Flowchart, SOLID, So sánh & Test Cases)**: Xem tại file [`BAO_CAO_DESIGN_PATTERNS_VA_SOLID.md`](./BAO_CAO_DESIGN_PATTERNS_VA_SOLID.md).

---

## 1. Cấu trúc Thư mục Dự án

- `backend/`: Mã nguồn Java Spring Boot 3.2.5, Spring Data JPA, Spring Security (JWT), MySQL/H2, JUnit 5 Tests và 7 Design Patterns.
  - `database/mysql_init.sql`: Script khởi tạo CSDL MySQL (`hotel_booking_db` - 10 bảng).
  - `src/main/java/com/hotel/booking/patterns/creational/`:
    - **Builder Pattern**: `BookingOrder`, `RoomSearchCriteria`
    - **Factory Method Pattern**: `RoomFactory`, `RoomTemplate`, `StandardRoomTemplate`, `DeluxeRoomTemplate`, `SuiteRoomTemplate`
  - `src/main/java/com/hotel/booking/patterns/structural/`:
    - **Decorator Pattern**: `BookingCostComponent`, `BaseRoomBookingCost`, `BookingServiceDecorator`, `BreakfastDecorator`, `AirportPickupDecorator`, `ExtraBedDecorator`, `SpaDecorator`, `BookingCostBuilderService`
    - **Facade Pattern**: `BookingFacade`
  - `src/main/java/com/hotel/booking/patterns/behavioral/`:
    - **Strategy Pattern**: `DiscountStrategy` (`Percentage`, `FixedAmount`, `Seasonal`), `PaymentStrategy` (`CreditCard`, `EWallet`, `PayAtHotel`)
    - **State Pattern**: `BookingState` (`PendingState`, `ConfirmedState`, `CheckedInState`, `CheckedOutState`, `CancelledState`), `BookingStateResolver`
    - **Observer Pattern**: `BookingObserver` (`InAppNotificationObserver`, `EmailNotificationObserver`, `AuditLogObserver`), `BookingEventPublisher`
- `frontend/`: Mã nguồn giao diện Web Next.js 14 (App Router) cho **User Portal** (`/`, `/rooms/[id]`, `/my-bookings`) và **Admin Portal có Sidebar độc lập** (`/admin`).

---

## 2. Tài khoản Mặc định (Khởi tạo tự động bởi `DataSeeder`)

- **Quản trị viên (Admin)**: `admin@hotel.com` / `admin123`
- **Khách hàng (Customer 1)**: `user@hotel.com` / `user123`
- **Khách hàng (Customer 2)**: `ngoc@hotel.com` / `user123`
- **Dữ liệu khởi tạo**: 3 Hạng phòng gốc (`STANDARD`, `DELUXE`, `SUITE`) và 6 Phòng khách sạn mẫu. Các đơn đặt phòng và mã giảm giá (Voucher) do người dùng và Admin chủ động tạo trong quá trình sử dụng.

---

## 3. Hướng dẫn Chạy Dự án

### Bước 1: Chạy Backend (Cổng `8080`)
- Chạy với MySQL (`localhost:3306`, tự động tạo database `hotel_booking_db`):
  ```bash
  cd backend
  mvn spring-boot:run
  ```
- Hoặc chạy nhanh phục vụ thuyết trình/demo không cần bật MySQL (dùng H2 in-memory chế độ tương thích MySQL):
  ```bash
  cd backend
  mvn spring-boot:run "-Dspring-boot.run.profiles=h2"
  ```
- Chạy bộ kiểm thử tự động JUnit 5 cho 7 Design Patterns:
  ```bash
  cd backend
  mvn test
  ```

### Bước 2: Chạy Frontend (Cổng `3000`)
```bash
cd frontend
npm install
npm run dev
```
Mở trình duyệt tại: `http://localhost:3000` (Trang khách hàng) hoặc `http://localhost:3000/admin` (Trang quản trị viên).
