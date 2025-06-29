#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// Cấu hình WiFi
const char* ssid = "Ca Phe Son Nguyen";
const char* password = "Bin2581357";

// Cấu hình Server
const char* serverName = "http://192.168.1.46:3000/api/alcohol";

// Cấu hình cảm biến MQ3
const int mq3Pin = A0;  // Chân analog kết nối với MQ3

// Thông số hiệu chỉnh MQ3
// Các giá trị này cần được hiệu chỉnh dựa trên cảm biến cụ thể của bạn
const float R0 = 10.0;  // Điện trở tham chiếu ở không khí sạch (kOhm)
const float RL = 10.0;  // Giá trị điện trở tải (kOhm)

// Hằng số cho công thức chuyển đổi (cần hiệu chỉnh)
const float a = 0.4;  // Hệ số a trong công thức y = a*(x^b)
const float b = -0.6; // Hệ số b trong công thức y = a*(x^b)

// Biến lưu giá trị đo
float alcoholValue = 0;
float alcoholMgL = 0;

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

  // Thời gian làm nóng cảm biến
  Serial.println("Đang làm nóng cảm biến MQ3 (60 giây)...");
  for(int i = 0; i < 60; i++) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\nCảm biến sẵn sàng!");
}

void loop() {
  // Đọc giá trị từ cảm biến
  int sensorValue = analogRead(mq3Pin);
  
  // Chuyển đổi giá trị ADC sang điện áp
  float voltage = sensorValue * (3.3 / 1023.0);
  
  // Tính toán tỷ lệ RS/R0
  float RS = RL * (3.3 - voltage) / voltage;
  float ratio = RS / R0;
  
  // Chuyển đổi sang nồng độ cồn (mg/L) dựa trên công thức hiệu chỉnh
  // BAC = a * (RS/R0)^b
  alcoholMgL = a * pow(ratio, b);
  
  // Giới hạn giá trị tối thiểu để tránh nhiễu
  if (alcoholMgL < 0.05) {
    alcoholMgL = 0.0;
  }
  
  // In giá trị ra Serial Monitor để debug
  Serial.print("Giá trị ADC: ");
  Serial.print(sensorValue);
  Serial.print(", Điện áp: ");
  Serial.print(voltage);
  Serial.print("V, RS/R0: ");
  Serial.print(ratio);
  Serial.print(", Nồng độ cồn: ");
  Serial.print(alcoholMgL);
  Serial.println(" mg/L");

  // Gửi dữ liệu lên server mỗi 5 giây
  if ((millis() - lastTime) > timerDelay) {
    // Kiểm tra kết nối WiFi
    if(WiFi.status() == WL_CONNECTED) {
      sendAlcoholData(alcoholMgL);
    } else {
      Serial.println("WiFi đã ngắt kết nối");
      WiFi.reconnect();
    }
    lastTime = millis();
  }
  
  delay(1000);
}

void sendAlcoholData(float alcoholValue) {
  WiFiClient client;
  HTTPClient http;
  
  // Khởi tạo kết nối HTTP
  http.begin(client, serverName);
  http.addHeader("Content-Type", "application/json");
  
  // Tạo JSON payload
  StaticJsonDocument<200> doc;
  doc["value"] = alcoholValue;
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  // Gửi POST request
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("HTTP Response code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
  } else {
    Serial.print("Lỗi gửi HTTP Request. Mã lỗi: ");
    Serial.println(httpResponseCode);
  }
  
  // Giải phóng tài nguyên
  http.end();
} 