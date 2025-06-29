#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// Cấu hình WiFi
const char* ssid = "Ca Phe Son Nguyen";
const char* password = "Bin2581357";

// Cấu hình Server
const char* serverName = "http://192.168.1.205:3000/api/alcohol";

// Cấu hình cảm biến MQ3
const int mq3Pin = A0;  // Chân analog kết nối với MQ3

// Thông số hiệu chỉnh MQ3
const float R0 = 10.0;  // Điện trở tham chiếu ở không khí sạch (kOhm)
const float RL = 10.0;  // Giá trị điện trở tải (kOhm)

// Hằng số cho công thức chuyển đổi
const float a = 0.4;
const float b = -0.6;

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
  
  // Chuyển đổi sang nồng độ cồn (mg/L)
  float alcoholMgL = a * pow(ratio, b);
  
  // Giới hạn giá trị tối thiểu
  if (alcoholMgL < 0.05) {
    alcoholMgL = 0.0;
  }
  
  // In giá trị ra Serial Monitor
  Serial.print("Giá trị ADC: ");
  Serial.print(sensorValue);
  Serial.print(", Điện áp: ");
  Serial.print(voltage);
  Serial.print("V, Nồng độ cồn: ");
  Serial.print(alcoholMgL);
  Serial.println(" mg/L");

  // Gửi dữ liệu lên server mỗi 5 giây
  if ((millis() - lastTime) > timerDelay) {
    if(WiFi.status() == WL_CONNECTED) {
      WiFiClient client;
      HTTPClient http;
      
      // Khởi tạo kết nối HTTP
      http.begin(client, serverName);
      http.addHeader("Content-Type", "application/json");
      
      // Tạo JSON payload
      String httpRequestData = "{\"value\":" + String(alcoholMgL) + "}";
      
      // Gửi POST request
      int httpResponseCode = http.POST(httpRequestData);
      
      if (httpResponseCode > 0) {
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
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