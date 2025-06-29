import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Typography, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useReactToPrint } from 'react-to-print';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2, 0),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
}));

const TicketContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  border: '2px dashed #000',
  borderRadius: '8px',
  backgroundColor: '#fff',
  width: '100%',
  maxWidth: '500px',
  margin: '0 auto',
}));

const TicketForm = ({ alcoholValue, open, onClose, onTicketCreated }) => {
  const [name, setName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [ticket, setTicket] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const ticketRef = React.useRef();

  const handlePrint = useReactToPrint({
    content: () => ticketRef.current,
  });

  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${API_BASE}/api/ticket`, {
        name,
        licensePlate,
        alcoholValue,
        vehicleType
      });
      
      setTicket(response.data.ticket);
      setShowTicket(true);
      if (onTicketCreated) onTicketCreated();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Có lỗi khi tạo vé phạt. Vui lòng thử lại!');
    }
  };

  const handleClose = () => {
    setName('');
    setLicensePlate('');
    setVehicleType('motorcycle');
    setTicket(null);
    setShowTicket(false);
    onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  // Xác định mức phạt dựa trên loại phương tiện và nồng độ cồn
  const getPenaltyInfo = () => {
    if (vehicleType === 'car') {
      // Ô tô: bất kỳ nồng độ cồn nào > 0
      return {
        fine: '16.000.000đ - 18.000.000đ',
        license: 'Tước GPLX từ 22 - 24 tháng'
      };
    } else {
      // Xe máy
      if (alcoholValue > 0.4) {
        return {
          fine: '6.000.000đ - 8.000.000đ',
          license: 'Tước GPLX từ 22 - 24 tháng'
        };
      } else if (alcoholValue > 0.25) {
        return {
          fine: '4.000.000đ - 5.000.000đ',
          license: 'Tước GPLX từ 16 - 18 tháng'
        };
      } else {
        return {
          fine: '2.000.000đ - 3.000.000đ',
          license: 'Tước GPLX từ 10 - 12 tháng'
        };
      }
    }
  };

  const penaltyInfo = getPenaltyInfo();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 'bold' }}>
        CẢNH BÁO: Phát hiện nồng độ cồn vượt ngưỡng!
      </DialogTitle>
      <DialogContent>
        {!showTicket ? (
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Vui lòng nhập thông tin người vi phạm:
            </Typography>
            <Typography variant="body1" gutterBottom color="error">
              Nồng độ cồn đo được: {alcoholValue} mg/L
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                label="Họ và tên"
                variant="outlined"
                fullWidth
                margin="normal"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                label="Biển số xe"
                variant="outlined"
                fullWidth
                margin="normal"
                required
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel id="vehicle-type-label">Loại phương tiện</InputLabel>
                <Select
                  labelId="vehicle-type-label"
                  value={vehicleType}
                  label="Loại phương tiện"
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <MenuItem value="motorcycle">Xe máy</MenuItem>
                  <MenuItem value="car">Ô tô</MenuItem>
                </Select>
              </FormControl>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth 
                sx={{ mt: 2 }}
              >
                Tạo vé phạt
              </Button>
            </form>
          </StyledPaper>
        ) : (
          <div>
            <TicketContainer ref={ticketRef}>
              <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                BIÊN BẢN VI PHẠM NỒNG ĐỘ CỒN
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Họ và tên:</strong> {ticket.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Biển số xe:</strong> {ticket.licensePlate}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Loại phương tiện:</strong> {ticket.vehicleType === 'motorcycle' ? 'Xe máy' : 'Ô tô'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Nồng độ cồn đo được:</strong> {ticket.alcoholValue} mg/L
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Thời gian vi phạm:</strong> {formatDate(ticket.timestamp)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Mã biên bản:</strong> {ticket._id}
              </Typography>
              <Box mt={2} sx={{ borderTop: '1px dashed #000', paddingTop: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  Mức xử phạt theo Nghị định 100/2019/NĐ-CP:
                </Typography>
                <Typography variant="body2">
                  <strong>Phạt tiền:</strong> {penaltyInfo.fine}
                </Typography>
                <Typography variant="body2">
                  <strong>Hình thức phạt bổ sung:</strong> {penaltyInfo.license}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  {ticket.vehicleType === 'car' ? 
                    'Người điều khiển ô tô, xe bán tải, xe khách không được phép có nồng độ cồn trong máu và khí thở.' :
                    'Người điều khiển xe máy không được vượt quá 0.25 mg/L khí thở.'}
                </Typography>
              </Box>
            </TicketContainer>
            <Box mt={2} display="flex" justifyContent="center">
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handlePrint}
                sx={{ mr: 2 }}
              >
                In vé phạt
              </Button>
              <Button 
                variant="outlined"
                onClick={() => {
                  setName('');
                  setLicensePlate('');
                  setVehicleType('motorcycle');
                  setShowTicket(false);
                }}
              >
                Tạo vé phạt mới
              </Button>
            </Box>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketForm; 