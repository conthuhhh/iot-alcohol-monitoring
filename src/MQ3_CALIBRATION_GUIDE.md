# Hướng dẫn hiệu chỉnh cảm biến MQ3 để đo nồng độ cồn chính xác

## 1. Thông tin cơ bản về cảm biến MQ3

Cảm biến MQ3 là cảm biến khí bán dẫn được sử dụng để phát hiện nồng độ cồn trong không khí. Để có kết quả chính xác, cảm biến cần được hiệu chỉnh đúng cách.

## 2. Quá trình làm nóng (Warm-up)

- Cảm biến MQ3 cần được làm nóng trước khi sử dụng
- Thời gian làm nóng lý tưởng: 24-48 giờ
- Thời gian làm nóng tối thiểu: 12 giờ
- Trong code Arduino, đã thiết lập thời gian làm nóng 60 giây khi khởi động, nhưng đây chỉ là thời gian tối thiểu

## 3. Xác định giá trị R0

R0 là điện trở của cảm biến trong không khí sạch (không có cồn). Để xác định R0:

1. Đảm bảo cảm biến đã được làm nóng ít nhất 12 giờ
2. Đặt cảm biến trong không khí sạch (không có cồn)
3. Sử dụng đoạn code sau để đo giá trị R0:

```arduino
void setup() {
  Serial.begin(115200);
  Serial.println("Đang đo giá trị R0...");
  delay(20000); // Đợi 20 giây để ổn định
}

void loop() {
  // Đọc giá trị từ cảm biến
  int sensorValue = analogRead(A0);
  
  // Chuyển đổi giá trị ADC sang điện áp
  float voltage = sensorValue * (3.3 / 1023.0);
  
  // Tính toán giá trị R0
  float RS = 10.0 * (3.3 - voltage) / voltage; // 10.0 là giá trị RL (kOhm)
  
  Serial.print("Giá trị ADC: ");
  Serial.print(sensorValue);
  Serial.print(", Điện áp: ");
  Serial.print(voltage);
  Serial.print("V, RS: ");
  Serial.print(RS);
  Serial.println(" kOhm");
  
  delay(1000);
}
```

4. Ghi lại giá trị RS trung bình sau khi đo trong 5 phút
5. Giá trị R0 chính là giá trị RS trung bình đo được
6. Cập nhật giá trị R0 trong code Arduino chính

## 4. Hiệu chỉnh công thức chuyển đổi

Công thức chuyển đổi từ tỷ lệ RS/R0 sang nồng độ cồn (mg/L) có dạng:

```
BAC (mg/L) = a * (RS/R0)^b
```

Trong đó:
- a và b là hằng số cần được hiệu chỉnh
- RS là điện trở của cảm biến khi có cồn
- R0 là điện trở của cảm biến trong không khí sạch

Để hiệu chỉnh a và b:

1. Chuẩn bị các mẫu cồn với nồng độ đã biết (có thể sử dụng máy đo cồn chuẩn để so sánh)
2. Đo giá trị RS/R0 với từng mẫu
3. Vẽ đồ thị log-log của nồng độ cồn (mg/L) và tỷ lệ RS/R0
4. Xác định đường thẳng tốt nhất đi qua các điểm đo
5. Từ đường thẳng này, xác định giá trị a và b

Giá trị mặc định trong code:
- a = 0.4
- b = -0.6

Bạn cần điều chỉnh các giá trị này dựa trên kết quả hiệu chỉnh thực tế.

## 5. Chuyển đổi đơn vị đo

- Nồng độ cồn trong hơi thở thường được đo bằng mg/L hoặc BAC% (Blood Alcohol Content)
- Công thức chuyển đổi: 1 mg/L ≈ 0.0021 BAC%
- Nếu muốn hiển thị kết quả theo BAC%, thêm phép chuyển đổi trong code Arduino:
  ```arduino
  float bacPercentage = alcoholMgL * 0.0021;
  ```

## 6. Kiểm tra độ chính xác

Sau khi hiệu chỉnh, kiểm tra độ chính xác của cảm biến bằng cách:
1. So sánh với máy đo cồn chuẩn
2. Thử với các mẫu cồn có nồng độ đã biết
3. Điều chỉnh lại các tham số nếu cần

## 7. Các lưu ý quan trọng

- Nhiệt độ và độ ẩm có thể ảnh hưởng đến kết quả đo
- Cảm biến MQ3 có thể phản ứng với các khí khác ngoài cồn
- Tuổi thọ của cảm biến khoảng 2 năm, sau đó cần thay thế
- Để có kết quả chính xác nhất, nên hiệu chỉnh lại cảm biến mỗi 3-6 tháng 