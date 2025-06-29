const express = require('express');
const router = express.Router();
const AlcoholReading = require('../models/AlcoholReading');

// Ngưỡng nồng độ cồn (mg/L) - dựa trên quy định pháp luật
// Theo Nghị định 100/2019/NĐ-CP:
// - Người điều khiển xe máy: không được vượt quá 0.25 mg/L khí thở
// - Người điều khiển ô tô: không được vượt quá 0.0 mg/L khí thở (0 cồn)
const ALCOHOL_THRESHOLD = 0.25; // mg/L khí thở - ngưỡng cho xe máy
const ALCOHOL_THRESHOLD_CAR = 0.0; // mg/L khí thở - ngưỡng cho ô tô

// Nhận dữ liệu đo nồng độ cồn từ thiết bị
router.post('/', async (req, res) => {
  try {
    let { value, deviceId } = req.body;
    
    // Chuyển đổi value thành số
    value = parseFloat(value);
    
    if (isNaN(value)) {
      return res.status(400).json({ message: 'Invalid data: value must be a number' });
    }
    
    // Sử dụng deviceId từ request hoặc giá trị mặc định
    const device = deviceId || 'unknown_device';
    
    const reading = new AlcoholReading({ value, deviceId: device });
    await reading.save();
    
    // Phát socket.io cho client
    const io = req.app.get('io');
    if (io) {
      io.emit('alcohol:new', reading);
      
      // Kiểm tra nếu vượt ngưỡng
      if (value >= ALCOHOL_THRESHOLD) {
        io.emit('alcohol:threshold', {
          value,
          deviceId: device,
          timestamp: reading.timestamp,
          message: 'Vượt ngưỡng nồng độ cồn cho phép!',
          threshold: ALCOHOL_THRESHOLD,
          unit: 'mg/L'
        });
      }
    }
    
    res.status(201).json({ 
      message: 'Data saved', 
      reading,
      thresholdExceeded: value >= ALCOHOL_THRESHOLD,
      threshold: {
        motorcycle: ALCOHOL_THRESHOLD,
        car: ALCOHOL_THRESHOLD_CAR,
        unit: 'mg/L'
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Lấy tất cả dữ liệu đo
router.get('/', async (req, res) => {
  try {
    const readings = await AlcoholReading.find().sort({ timestamp: -1 });
    res.json(readings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Lấy bản ghi mới nhất
router.get('/latest', async (req, res) => {
  try {
    const latest = await AlcoholReading.findOne().sort({ timestamp: -1 });
    if (!latest) return res.status(404).json({ message: 'No data' });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Lấy dữ liệu cho biểu đồ (10 bản ghi gần nhất, tăng dần)
router.get('/chart', async (req, res) => {
  try {
    const readings = await AlcoholReading.find().sort({ timestamp: -1 }).limit(10);
    const sorted = readings.reverse();
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 