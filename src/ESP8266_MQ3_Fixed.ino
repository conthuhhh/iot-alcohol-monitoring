#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// Cấu hình WiFi
const char* ssid = "Ca Phe Son Nguyen";
const char* password = "Bin2581357";

// Cấu hình Server - Sử dụng IP chính xác của máy tính
const char* serverName = "http://192.168.1.46:3000/api/alcohol";

// Cấu hình thiết bị
const char* deviceId = "ESP8266_MQ3_001"; // ID của thiết bị

// Cấu hình cảm biến MQ3
const int mq3Pin = A0;  // Chân analog kết nối với MQ3

// Thông số hiệu chỉnh MQ3
const float R0 = 10.0;  // Điện trở tham chiếu ở không khí sạch (kOhm)
const float RL = 10.0;  // Giá trị điện trở tải (kOhm)

// Hằng số cho công thức chuyển đổi
const float a = 0.4;
const float b = -0.6;

// Hệ số chuyển đổi từ ppm sang mg/L (theo nghiên cứu thực nghiệm)
// Tỷ lệ này có thể điều chỉnh dựa trên hiệu chuẩn thực tế
// Thông thường: 1 mg/L ≈ 500 ppm ethanol trong không khí
const float PPM_TO_MGL = 0.002; // 1 ppm ≈ 0.002 mg/L

unsigned long lastTime = 0;
unsigned long timerDelay = 5000; // Gửi dữ liệu mỗi 5 giây

void setup() {
  Serial.begin(115200);
  
  WiFi.begin(ssid, password);
  Serial.println("Đang kết nối WiFi...");
  
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.print("Đã kết nối WiFi, IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Đọc giá trị từ cảm biến
  int sensorValue = analogRead(mq3Pin);
  
  // Chuyển đổi giá trị ADC sang điện áp
  float voltage = sensorValue * (3.3 / 1023.0);
  
  // Tính toán tỷ lệ RS/R0
  float RS = RL * (3.3 - voltage) / voltage;
  float ratio = RS / R0;
  
  // Chuyển đổi sang nồng độ cồn (ppm) dựa trên công thức hiệu chỉnh
  float alcoholPPM = a * pow(ratio, b) * 500; // Nhân với 500 để chuyển về thang đo ppm
  
  // Chuyển đổi từ ppm sang mg/L
  float alcoholMgL = alcoholPPM * PPM_TO_MGL;
  
  // Giới hạn giá trị tối thiểu để tránh nhiễu
  if (alcoholMgL < 0.05) {
    alcoholMgL = 0.0;
  }
  
  // In giá trị ra Serial Monitor
  Serial.print("Giá trị ADC: ");
  Serial.print(sensorValue);
  Serial.print(", Điện áp: ");
  Serial.print(voltage);
  Serial.print("V, RS/R0: ");
  Serial.print(ratio);
  Serial.print(", Nồng độ cồn (ppm): ");
  Serial.print(alcoholPPM);
  Serial.print(" ppm, Nồng độ cồn (mg/L): ");
  Serial.print(alcoholMgL);
  Serial.println(" mg/L");

  // Gửi dữ liệu lên server mỗi 5 giây
  if ((millis() - lastTime) > timerDelay) {
    if(WiFi.status() == WL_CONNECTED) {
      WiFiClient client;
      HTTPClient http;
      
      // In thông tin kết nối
      Serial.print("Đang kết nối đến: ");
      Serial.println(serverName);
      
      // Khởi tạo kết nối HTTP
      http.begin(client, serverName);
      http.addHeader("Content-Type", "application/x-www-form-urlencoded");
      
      // Tạo form-urlencoded payload
      String httpRequestData = "value=" + String(alcoholMgL) + "&deviceId=" + deviceId;
      Serial.print("Dữ liệu gửi đi: ");
      Serial.println(httpRequestData);
      
      // Gửi POST request
      int httpResponseCode = http.POST(httpRequestData);
      
      if (httpResponseCode > 0) {
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
        String response = http.getString();
        Serial.println("Phản hồi từ server: " + response);
      } else {
        Serial.print("Lỗi HTTP: ");
        Serial.println(httpResponseCode);
      }
      
      http.end();
    } else {
      Serial.println("WiFi đã ngắt kết nối");
      WiFi.reconnect();
    }
    lastTime = millis();
  }
  
  delay(1000);
} 