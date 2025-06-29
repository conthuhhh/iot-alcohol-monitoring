# Hệ thống giám sát nồng độ cồn IoT

Dự án này là một hệ thống giám sát nồng độ cồn sử dụng cảm biến MQ3, ESP8266, React (Vite) và Node.js (Express, MongoDB, Socket.IO).

## Cấu trúc dự án

- `/backend`: Server Node.js với Express và MongoDB
- `/frontend-vite`: Giao diện người dùng React với Vite
- `/src`: Mã nguồn Arduino/ESP8266 và tài liệu hướng dẫn

## Cài đặt và chạy

### Backend

```bash
cd backend
npm install
npm start
```

Server sẽ chạy tại `http://localhost:3000`

### Frontend

```bash
cd frontend-vite
npm install
npm run build
```

Sau khi build, các file tĩnh sẽ được phục vụ từ backend.

### Arduino/ESP8266

1. Cài đặt Arduino IDE
2. Thêm hỗ trợ cho ESP8266 (xem hướng dẫn trong `src/ESP8266_MQ3_WIRING.md`)
3. Cài đặt các thư viện cần thiết:
   - ESP8266WiFi
   - ESP8266HTTPClient
   - WiFiClient
   - ArduinoJson
4. Mở file `src/Arduino_MQ3_ESP8266.ino`
5. Cập nhật thông tin WiFi và địa chỉ server
6. Nạp code lên ESP8266

## Hiệu chỉnh cảm biến MQ3

Để có kết quả đo chính xác, cần hiệu chỉnh cảm biến MQ3. Xem hướng dẫn chi tiết trong `src/MQ3_CALIBRATION_GUIDE.md`.

## Kết nối phần cứng

Xem hướng dẫn kết nối ESP8266 với cảm biến MQ3 trong `src/ESP8266_MQ3_WIRING.md`.

## API Endpoints

- `GET /api/alcohol`: Lấy tất cả dữ liệu nồng độ cồn
- `POST /api/alcohol`: Thêm dữ liệu nồng độ cồn mới
- `GET /api/alcohol/latest`: Lấy dữ liệu nồng độ cồn mới nhất

## Socket.IO Events

- `alcoholData`: Nhận dữ liệu nồng độ cồn mới nhất theo thời gian thực

## Các bước để thổi nồng độ cồn chính xác

1. Đảm bảo cảm biến MQ3 đã được làm nóng đủ thời gian (tối thiểu 12 giờ)
2. Hiệu chỉnh giá trị R0 theo hướng dẫn
3. Hiệu chỉnh công thức chuyển đổi (hệ số a và b)
4. Kiểm tra độ chính xác bằng cách so sánh với máy đo chuẩn
5. Đảm bảo kết nối WiFi và server ổn định
6. Thổi vào cảm biến ở khoảng cách 1-2cm trong khoảng 3-5 giây

## Xử lý sự cố

- Nếu giá trị đo không thay đổi: Kiểm tra kết nối cảm biến
- Nếu không kết nối được WiFi: Kiểm tra thông tin SSID và password
- Nếu không gửi được dữ liệu lên server: Kiểm tra địa chỉ IP server và cổng# iot-alcohol-monitoring
