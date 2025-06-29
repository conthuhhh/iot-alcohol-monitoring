void setup() {
  Serial.begin(115200);
  Serial.println("Bắt đầu kiểm tra cảm biến MQ3");
}

void loop() {
  // Đọc giá trị từ cảm biến
  int sensorValue = analogRead(A0);
  
  // Chuyển đổi giá trị ADC sang điện áp
  float voltage = sensorValue * (3.3 / 1023.0);
  
  // In giá trị ra Serial Monitor để debug
  Serial.print("Giá trị ADC: ");
  Serial.print(sensorValue);
  Serial.print(", Điện áp: ");
  Serial.print(voltage);
  Serial.println("V");
  
  delay(1000);
} 