# Hệ thống Quản lý Đặt phòng Khách sạn (Hotel Booking Management System)

Đồ án môn học **Mẫu Thiết Kế Phần Mềm (Design Patterns)** — Xây dựng hệ thống quản lý đặt phòng khách sạn áp dụng **5 nguyên lý SOLID** và **07 Design Patterns** (thuộc đủ 3 nhóm *Creational, Structural, Behavioral*) với kiến trúc **Frontend (Next.js 14 App Router + TypeScript + Tailwind CSS)** tách rời **Backend (Java Spring Boot 3 MVC REST API + MySQL)**.


---


## Hướng dẫn Chạy Dự án

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
