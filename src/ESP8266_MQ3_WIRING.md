# Hướng dẫn kết nối ESP8266 với cảm biến MQ3

## Sơ đồ kết nối

```
ESP8266 NodeMCU     MQ3 Sensor
--------------     -----------
      3V3    -----> VCC
      GND    -----> GND
      A0     -----> AO (Analog Output)
```

## Mô tả chân cắm của cảm biến MQ3

Cảm biến MQ3 thường có 4 chân:
- VCC: Nguồn điện dương (3.3V hoặc 5V)
- GND: Nối đất
- DO: Digital Output (không sử dụng trong dự án này)
- AO: Analog Output (kết nối với chân A0 của ESP8266)

## Lưu ý quan trọng

1. **Điện áp hoạt động**:
   - ESP8266 NodeMCU hoạt động ở mức 3.3V
   - Một số module cảm biến MQ3 được thiết kế cho 5V
   - Nếu sử dụng module MQ3 5V, cần đảm bảo nó có thể hoạt động ở 3.3V hoặc sử dụng bộ chuyển đổi mức logic

2. **Điện trở tải (RL)**:
   - Điện trở tải mặc định trên module MQ3 thường là 10kΩ
   - Giá trị này phải khớp với giá trị RL trong code Arduino (hiện đang đặt là 10.0)

3. **Chân A0 của ESP8266**:
   - ESP8266 chỉ có một chân Analog (A0) và có thể đọc điện áp từ 0-1V
   - Một số board NodeMCU đã có bộ chia điện áp để đọc 0-3.3V
   - Kiểm tra board của bạn và điều chỉnh công thức tính điện áp trong code nếu cần

## Kiểm tra kết nối

Sau khi kết nối, bạn có thể kiểm tra bằng cách:

1. Tải code kiểm tra đơn giản lên ESP8266:

```arduino
void setup() {
  Serial.begin(115200);
  Serial.println("Bắt đầu kiểm tra cảm biến MQ3");
}

void loop() {
  int sensorValue = analogRead(A0);
  Serial.print("Giá trị ADC: ");
  Serial.println(sensorValue);
  delay(1000);
}
```

2. Mở Serial Monitor và kiểm tra giá trị đọc được:
   - Trong không khí sạch, giá trị ADC thường ở mức thấp
   - Khi có cồn gần cảm biến, giá trị sẽ tăng lên

3. Nếu giá trị không thay đổi hoặc luôn ở mức cao/thấp, kiểm tra lại kết nối và đảm bảo cảm biến đã được làm nóng đủ thời gian 