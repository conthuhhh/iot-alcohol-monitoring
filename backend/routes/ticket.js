const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// Tạo vé phạt mới
router.post('/', async (req, res) => {
  try {
    const { name, licensePlate, alcoholValue, deviceId } = req.body;
    
    if (!name || !licensePlate || !alcoholValue) {
      return res.status(400).json({ message: 'Thiếu thông tin: cần có tên, biển số xe và giá trị nồng độ cồn' });
    }
    
    const ticket = new Ticket({
      name,
      licensePlate,
      alcoholValue: parseFloat(alcoholValue),
      deviceId: deviceId || 'unknown_device'
    });
    
    await ticket.save();
    
    // Phát socket.io cho client
    const io = req.app.get('io');
    if (io) io.emit('ticket:new', ticket);
    
    res.status(201).json({ message: 'Đã lưu vé phạt', ticket });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Lấy tất cả vé phạt
router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ timestamp: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Lấy vé phạt theo ID
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Không tìm thấy vé phạt' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Xóa vé phạt
router.delete('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Không tìm thấy vé phạt' });
    res.json({ message: 'Đã xóa vé phạt' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

module.exports = router; 