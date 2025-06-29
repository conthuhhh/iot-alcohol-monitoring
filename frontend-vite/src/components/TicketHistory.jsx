import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

const columns = [
  { field: 'timestamp', headerName: 'Thời gian', flex: 1.2, headerAlign: 'center', align: 'center',
    renderCell: (params) => new Date(params.value).toLocaleString('vi-VN') },
  { field: 'name', headerName: 'Họ và tên', flex: 1, headerAlign: 'center', align: 'center' },
  { field: 'licensePlate', headerName: 'Biển số xe', flex: 1, headerAlign: 'center', align: 'center' },
  { field: 'vehicleType', headerName: 'Loại phương tiện', flex: 1, headerAlign: 'center', align: 'center',
    renderCell: (params) => params.value === 'car' ? 'Ô tô' : 'Xe máy' },
  { field: 'alcoholValue', headerName: 'Nồng độ cồn (mg/L)', flex: 1, headerAlign: 'center', align: 'center' },
  { field: '_id', headerName: 'Mã biên bản', flex: 1.2, headerAlign: 'center', align: 'center' },
];

const TicketHistory = ({ reload }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(5);

  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/ticket`);
      setTickets(res.data.tickets || res.data || []);
    } catch (err) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [reload]);

  return (
    <Box sx={{ background: 'rgba(20,30,60,0.95)', borderRadius: 4, boxShadow: '0 4px 32px #000a', mt: 4, p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h6" sx={{ color: '#ff9100', fontWeight: 700, mb: 1, textAlign: 'center', letterSpacing: 1, textShadow: '0 0 8px #ff9100' }}>
        Lịch sử vé phạt
        <IconButton onClick={fetchTickets} sx={{ ml: 1 }} color="warning"><RefreshIcon /></IconButton>
      </Typography>
      <DataGrid
        rows={tickets.map((row, idx) => ({ ...row, id: row._id || idx }))}
        columns={columns}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        rowsPerPageOptions={[5, 10, 20]}
        autoHeight
        loading={loading}
        disableSelectionOnClick
        sx={{
          background: 'rgba(30,40,70,0.98)',
          borderRadius: 3,
          fontSize: 16,
          color: '#fff',
          boxShadow: 2,
          '& .MuiDataGrid-columnHeaders': { background: 'rgba(255,152,0,0.15)', color: '#ff9100', fontWeight: 700, fontSize: 16 },
          '& .MuiDataGrid-row': { borderBottom: '1px solid #223' },
          '& .MuiDataGrid-cell': { border: 'none' },
          '& .MuiDataGrid-footerContainer': { background: 'rgba(255,152,0,0.10)' },
          '& .MuiTablePagination-root': { color: '#fff' },
        }}
      />
    </Box>
  );
};

export default TicketHistory; 