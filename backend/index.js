require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const alcoholRoutes = require('./routes/alcohol');
const ticketRoutes = require('./routes/ticket');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGODB_URI = 'mongodb+srv://iotproject:171004@cluster0.szfrvwl.mongodb.net/iot_alcohol?retryWrites=true&w=majority&appName=Cluster0';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/alcohol', alcoholRoutes);
app.use('/api/ticket', ticketRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
app.set('io', io);

const SOCKET_URL = import.meta.env.VITE_API_URL || '';
io(SOCKET_URL, { ... });

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test local at: http://localhost:${PORT}`);
    console.log(`Test from ESP8266 at: http://<your-ip>:${PORT}`);
  });
  io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
}); 