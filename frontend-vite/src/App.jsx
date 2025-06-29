import { useState, useEffect, useRef } from 'react'
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  Box,
  Slider,
  Alert,
  CircularProgress,
  Divider,
  Snackbar,
  Tab,
  Tabs,
  Chip,
  Tooltip,
  IconButton,
  Fade
} from '@mui/material'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RefreshIcon from '@mui/icons-material/Refresh'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import SensorsIcon from '@mui/icons-material/Sensors'
import WifiIcon from '@mui/icons-material/Wifi'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import io from 'socket.io-client'
import { Howl, Howler } from 'howler'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { DataGrid } from '@mui/x-data-grid';
import Badge from '@mui/material/Badge';
import TicketForm from './components/TicketForm';
import TicketHistory from './components/TicketHistory';
// import './App.css'
// import DataTable from './components/DataTable'

// Đăng ký các thành phần Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
)

// URL API backend
const API_URL = '/api/alcohol'
const SOCKET_URL = ''

function App() {
  // Trạng thái dữ liệu
  const [currentValue, setCurrentValue] = useState(0)
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Nồng độ cồn (mg/L)',
        data: [],
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#38bdf8',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#38bdf8'
      }
    ]
  })
  
  // Ngưỡng cảnh báo
  const [threshold, setThreshold] = useState(0.25)
  const [savedThreshold, setSavedThreshold] = useState(0.25)
  
  // Trạng thái kết nối
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  
  // Trạng thái cảm biến
  const [sensorStatus, setSensorStatus] = useState({
    status: 'disconnected',
    simulation: true,
    port: null
  })
  
  // Trạng thái loading
  const [loading, setLoading] = useState(true)
  
  // Socket.io reference
  const socketRef = useRef(null)
  
  // Tham chiếu đến audio interval cho cảnh báo
  const audioIntervalRef = useRef(null);
  const soundRef = useRef(null);
  
  // Tham chiếu đến card hiện tại để áp dụng animation
  const currentCardRef = useRef(null)
  
  // Trạng thái hiển thị form vé phạt
  const [ticketFormOpen, setTicketFormOpen] = useState(false);
  
  // Tùy chọn cho biểu đồ
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#38bdf8',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Nồng độ: ${context.raw} mg/L`
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  }

  const [history, setHistory] = useState([])
  const [pageSize, setPageSize] = useState(5);

  const columns = [
    {
      field: 'timestamp',
      headerName: 'Thời gian',
      flex: 1.2,
      renderCell: (params) => new Date(params.value).toLocaleString('vi-VN'),
      headerAlign: 'center', align: 'center',
    },
    {
      field: 'value',
      headerName: 'Giá trị (mg/L)',
      flex: 0.8,
      headerAlign: 'center', align: 'center',
      renderCell: (params) => (
        <span style={{ fontWeight: 600, color: params.value >= savedThreshold ? (params.value >= savedThreshold + 0.1 ? '#ff1744' : '#ff9100') : '#00e676' }}>
          {params.value}
        </span>
      )
    },
    {
      field: 'deviceId',
      headerName: 'Thiết bị',
      flex: 0.8,
      headerAlign: 'center', align: 'center',
      renderCell: (params) => (
        <Badge badgeContent={params.value} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 12, padding: '0 8px', borderRadius: 8 } }} />
      )
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 0.8,
      headerAlign: 'center', align: 'center',
      renderCell: (params) => {
        const value = params.row.value;
        let color = 'success', label = 'An toàn';
        if (value >= savedThreshold + 0.1) { color = 'error'; label = 'Nguy hiểm'; }
        else if (value >= savedThreshold) { color = 'warning'; label = 'Cảnh báo'; }
        return <Chip label={label} color={color} size="small" sx={{ fontWeight: 600, fontSize: 14 }} />;
      }
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      flex: 0.8,
      headerAlign: 'center', align: 'center',
      renderCell: (params) => {
        const value = params.row.value;
        // Chỉ hiển thị nút "Lập biên bản" khi giá trị vượt ngưỡng
        if (value >= savedThreshold) {
          return (
            <Button 
              variant="contained" 
              color="error" 
              size="small"
              onClick={() => handleCreateTicket(value)}
            >
              Lập biên bản
            </Button>
          );
        }
        return null;
      }
    }
  ];

  // Hàm xử lý khi nhấn nút "Lập biên bản"
  const handleCreateTicket = (value) => {
    setTicketFormOpen(true);
  };

  // Hàm đóng form vé phạt
  const handleCloseTicketForm = () => {
    setTicketFormOpen(false);
  };

  // Hàm lấy dữ liệu từ API
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_URL}/latest`)
      
      if (!response.ok) {
        throw new Error('Không thể kết nối với server')
      }
      
      const data = await response.json()
      if (data) {
        setCurrentValue(data.value)
        
        // Kiểm tra nếu vượt mức nguy hiểm thì phát âm thanh lặp lại
        if (data.value >= savedThreshold) {
          startRepeatingAlert();
          if (currentCardRef.current) {
            currentCardRef.current.classList.add('danger-alert')
            setTimeout(() => {
              if (currentCardRef.current) {
                currentCardRef.current.classList.remove('danger-alert')
              }
            }, 1000)
          }
        } else {
          // Nếu không ở mức nguy hiểm, dừng phát âm thanh lặp lại
          stopRepeatingAlert();
        }
      }
      
      // Lấy dữ liệu cho biểu đồ
      const chartResponse = await fetch(`${API_URL}/chart`)
      
      if (chartResponse.ok) {
        const chartDataFromApi = await chartResponse.json()
        
        if (chartDataFromApi && chartDataFromApi.length > 0) {
          const labels = chartDataFromApi.map(item => {
            const date = new Date(item.timestamp)
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          })
          
          const values = chartDataFromApi.map(item => item.value)
          
          setChartData({
            labels,
            datasets: [
              {
                ...chartData.datasets[0],
                data: values
              }
            ]
          })
        }
      }
      
      // Kiểm tra trạng thái cảm biến
      const sensorResponse = await fetch(`${SOCKET_URL}/api/sensor/status`)
      if (sensorResponse.ok) {
        const sensorData = await sensorResponse.json()
        setSensorStatus(sensorData)
      }
      
      setConnected(true)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  // Hàm xử lý lỗi JSON
  const safeParseJSON = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON parsing error:", e);
      return null;
    }
  }

  // Hàm lưu ngưỡng cảnh báo
  const saveThreshold = () => {
    setSavedThreshold(threshold)
  }

  // Hàm phát âm thanh cảnh báo
  const playAlertSound = () => {
    try {
      // Sử dụng thẻ audio có sẵn trong HTML
      const audioElement = document.getElementById('alertSound');
      if (audioElement) {
        audioElement.play().catch(err => {
          console.error('Error playing sound:', err);
        });
      } else {
        console.warn('Audio element not found');
      }
    } catch (err) {
      console.error('Error playing alert sound:', err);
    }
  }

  // Hàm bắt đầu phát âm thanh lặp lại
  const startRepeatingAlert = () => {
    // Nếu đã có interval, không tạo mới
    if (audioIntervalRef.current) return;
    
    // Phát âm thanh ngay lập tức
    playAlertSound();
    
    // Thiết lập interval để phát âm thanh mỗi 3 giây
    audioIntervalRef.current = setInterval(() => {
      playAlertSound();
    }, 3000);
  }

  // Hàm dừng phát âm thanh lặp lại
  const stopRepeatingAlert = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
  }

  // Hàm lấy lịch sử đo
  const fetchHistory = async () => {
    try {
      const res = await fetch(API_URL)
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (err) {
      // ignore
    }
  }

  // Kết nối Socket.IO và thiết lập các event listener
  useEffect(() => {
    // Thiết lập Howler
    Howler.autoUnlock = true;
    Howler.volume(1.0);
    
    // Khởi tạo kết nối Socket.IO
    socketRef.current = io(SOCKET_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket'],
      forceNew: true,
      autoConnect: true
    })
    
    // Lắng nghe sự kiện kết nối
    socketRef.current.on('connect', () => {
      console.log('Socket.IO connected')
      setConnected(true)
      setError(null)
      
      // Gửi ping để kiểm tra kết nối
      socketRef.current.emit('ping', (response) => {
        console.log('Server ping response:', response)
      })
      
      // Phát âm thanh khi kết nối thành công với server
      if (soundRef.current) {
        // Đảm bảo âm thanh ở mức tối đa
        soundRef.current.volume(1.0);
        soundRef.current.play();
      }
    })
    
    // Lắng nghe sự kiện ngắt kết nối
    socketRef.current.on('disconnect', () => {
      console.log('Socket.IO disconnected')
      setConnected(false)
    })
    
    // Lắng nghe sự kiện lỗi
    socketRef.current.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err)
      setError('Lỗi kết nối: ' + err.message)
      setConnected(false)
      
      // Thử kết nối lại sau 5 giây
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.connect();
        }
      }, 5000);
    })
    
    // Lắng nghe sự kiện dữ liệu mới
    socketRef.current.on('alcoholReading', (data) => {
      console.log('Received alcohol reading:', data)
      setCurrentValue(data.value)
      
      // Cập nhật biểu đồ với dữ liệu mới
      setChartData(prevData => {
        const newLabels = [...prevData.labels]
        const newData = [...prevData.datasets[0].data]
        
        // Thêm nhãn thời gian mới
        const date = new Date(data.timestamp)
        const timeString = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        
        // Giữ tối đa 10 điểm dữ liệu
        if (newLabels.length >= 10) {
          newLabels.shift()
          newData.shift()
        }
        
        newLabels.push(timeString)
        newData.push(data.value)
        
        return {
          labels: newLabels,
          datasets: [
            {
              ...prevData.datasets[0],
              data: newData
            }
          ]
        }
      })
      
      // Kiểm tra nếu vượt ngưỡng cảnh báo
      if (data.value >= savedThreshold) {
        startRepeatingAlert()
        if (currentCardRef.current) {
          currentCardRef.current.classList.add('danger-alert')
          setTimeout(() => {
            if (currentCardRef.current) {
              currentCardRef.current.classList.remove('danger-alert')
            }
          }, 1000)
        }
      } else {
        stopRepeatingAlert()
      }
    })
    
    // Lắng nghe sự kiện dữ liệu biểu đồ
    socketRef.current.on('chartData', (data) => {
      console.log('Received chart data:', data)
      if (data && data.length > 0) {
        const labels = data.map(item => {
          const date = new Date(item.timestamp)
          return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        })
        
        const values = data.map(item => item.value)
        
        setChartData({
          labels,
          datasets: [
            {
              ...chartData.datasets[0],
              data: values
            }
          ]
        })
      }
    })
    
    // Lắng nghe sự kiện pong từ server
    socketRef.current.on('pong', (data) => {
      console.log('Server pong response:', data)
      setConnected(true)
    })
    
    // Lấy dữ liệu ban đầu
    fetchData()
    
    // Thiết lập interval để cập nhật dữ liệu định kỳ
    const interval = setInterval(() => {
      if (!socketRef.current || !socketRef.current.connected) {
        fetchData()
      } else {
        // Gửi ping để kiểm tra kết nối
        socketRef.current.emit('ping', (response) => {
          if (!response) {
            fetchData()
          }
        })
      }
    }, 10000) // Cập nhật mỗi 10 giây nếu socket không kết nối được
    
    // Cleanup function
    return () => {
      clearInterval(interval)
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      if (soundRef.current) {
        soundRef.current.stop();
      }
      // Dừng interval khi unmount
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    }
  }, [savedThreshold])

  // Gọi fetchHistory khi load và khi có dữ liệu mới
  useEffect(() => {
    fetchHistory()
  }, [])
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on('alcohol:new', () => {
        fetchHistory()
      })
    }
  }, [socketRef.current])

  // Làm mới dữ liệu
  const handleRefresh = () => {
    fetchData()
  }

  // Thêm class cho hiệu ứng glow
  const glowText = {
    color: '#4fc3f7',
    fontWeight: 900,
    fontSize: '2.8rem',
    textShadow: '0 0 16px #00eaff, 0 0 32px #00eaff',
    letterSpacing: 2,
    fontFamily: 'Montserrat, Arial, sans-serif',
    marginBottom: 8,
    animation: 'fadeInGlow 1.2s',
    textAlign: 'center',
  };

  const [reloadTicketHistory, setReloadTicketHistory] = useState(0);

  const handleTicketCreated = () => {
    setReloadTicketHistory(prev => prev + 1);
  };

  const [mode, setMode] = useState('manual'); // 'manual' hoặc 'auto'

  // Hàm tự động mở form phạt khi ở chế độ auto và vượt ngưỡng
  useEffect(() => {
    if (mode === 'auto' && currentValue > savedThreshold) {
      // Nếu form chưa mở thì mở form
      if (!ticketFormOpen) {
        setTicketFormOpen(true);
      }
    }
  }, [currentValue, mode, savedThreshold, ticketFormOpen]);

  const [sensorHistoryOpen, setSensorHistoryOpen] = useState(true);
  const [ticketHistoryOpen, setTicketHistoryOpen] = useState(true);

  // Render
  return (
    <div className="app-container" style={{ background: 'linear-gradient(135deg, #0f172a 60%, #1e293b 100%)', minHeight: '100vh', paddingBottom: 32 }}>
      <Container maxWidth="md" className="main-container" sx={{ pt: 4 }}>
        <Typography variant="h3" sx={glowText} gutterBottom>
          <span style={{ verticalAlign: 'middle', marginRight: 12 }}>
            <img src="/breathalyzer.svg" alt="icon" style={{ width: 48, filter: 'drop-shadow(0 0 8px #00eaff)' }} />
          </span>
          HỆ THỐNG GIÁM SÁT NỒNG ĐỘ CỒN
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#b3e5fc', textAlign: 'center', fontWeight: 600, mb: 2, letterSpacing: 1 }}>
          SỬ DỤNG CẢM BIẾN MQ3 VÀ IOT
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, gap: 2 }}>
          <Chip
            label={mode === 'manual' ? 'Chế độ thủ công' : 'Chế độ tự động phạt'}
            color={mode === 'manual' ? 'primary' : 'error'}
            sx={{ fontWeight: 700, fontSize: 16 }}
          />
          <Button
            variant={mode === 'manual' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setMode('manual')}
          >
            Thủ công
          </Button>
          <Button
            variant={mode === 'auto' ? 'contained' : 'outlined'}
            color="error"
            onClick={() => setMode('auto')}
          >
            Tự động phạt
          </Button>
        </Box>
        <Box className="dashboard-row" sx={{ display: 'flex', gap: 3, justifyContent: 'center', mb: 2, flexWrap: 'wrap' }}>
          <Card className="dashboard-card current-value-card" sx={{ flex: 1, minWidth: 280, maxWidth: 340, borderRadius: 5, boxShadow: '0 4px 32px #000a', background: 'rgba(30,40,70,0.98)', p: 2, animation: 'fadeInUp 1s' }} ref={currentCardRef}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1, letterSpacing: 1 }}>
                Nồng độ cồn hiện tại
              </Typography>
              <Box className="value-container" sx={{ textAlign: 'center', mb: 1 }}>
                <Fade in={!loading}>
                  <Box className="value-box">
                    {currentValue < savedThreshold ? (
                      <CheckCircleIcon className="safe-icon" sx={{ color: '#00e676', fontSize: 40, mb: -1, filter: 'drop-shadow(0 0 8px #00e676)' }} />
                    ) : (
                      <WarningIcon className="danger-icon" sx={{ color: '#ff1744', fontSize: 40, mb: -1, filter: 'drop-shadow(0 0 12px #ff1744)' }} />
                    )}
                    <Typography variant="h1" sx={{ fontSize: 64, fontWeight: 900, color: currentValue < savedThreshold ? '#fff' : '#ff1744', textShadow: currentValue < savedThreshold ? '0 0 12px #00e676' : '0 0 24px #ff1744', letterSpacing: 2, mb: -1 }}>
                      {currentValue}
                    </Typography>
                    <Typography variant="h6" className="unit" sx={{ color: '#b3e5fc', fontWeight: 700, fontSize: 22 }}>
                      mg/L
                    </Typography>
                  </Box>
                </Fade>
                {loading && <CircularProgress className="loading-spinner" />}
                <Box className="sensor-image" sx={{ textAlign: 'center', mt: 1 }}>
                  <img src="/breathalyzer.svg" alt="Alcohol sensor" style={{ width: 64, opacity: 0.8 }} />
                </Box>
                <Box className="status-indicator" sx={{ mt: 1 }}>
                  {currentValue < savedThreshold ? (
                    <Chip label="An toàn" color="success" className="status-chip" sx={{ fontWeight: 700, fontSize: 15, px: 2, borderRadius: 2 }} />
                  ) : (
                    <Chip label="Nguy hiểm" color="error" className="status-chip" sx={{ fontWeight: 700, fontSize: 15, px: 2, borderRadius: 2 }} />
                  )}
                </Box>
                <IconButton className="refresh-button" onClick={handleRefresh} disabled={loading} sx={{ mt: 1, color: '#4fc3f7' }}>
                  <RefreshIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
          <Card className="dashboard-card chart-card" sx={{ flex: 1.2, minWidth: 320, maxWidth: 420, borderRadius: 5, boxShadow: '0 4px 32px #000a', background: 'rgba(30,40,70,0.98)', p: 2, animation: 'fadeInUp 1.2s' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1, letterSpacing: 1 }}>
                Biểu đồ theo dõi
              </Typography>
              <Box className="chart-container" sx={{ height: 220 }}>
                {chartData.labels.length > 0 ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <Box className="no-data">
                    <Typography>Không có dữ liệu</Typography>
                  </Box>
                )}
              </Box>
              <Box className="threshold-slider" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" className="slider-label" sx={{ color: '#b3e5fc', fontWeight: 600, mb: 1 }}>
                  Cài đặt ngưỡng cảnh báo (mg/L)
                </Typography>
                <Box className="slider-container" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Slider
                    value={threshold}
                    onChange={(e, newValue) => setThreshold(newValue)}
                    min={0}
                    max={1}
                    step={0.01}
                    valueLabelDisplay="auto"
                    sx={{ color: '#4fc3f7', width: 120 }}
                  />
                  <Typography variant="body2" className="threshold-value" sx={{ color: '#4fc3f7', fontWeight: 700, fontSize: 18 }}>
                    {threshold}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={saveThreshold}
                    className="save-button"
                    sx={{ ml: 1, background: 'linear-gradient(90deg,#00eaff,#4fc3f7)', color: '#222', fontWeight: 700, borderRadius: 2 }}
                  >
                    Lưu
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box className="status-indicators" sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Chip
            icon={connected ? <WifiIcon /> : <WifiOffIcon />}
            label={connected ? 'Đã kết nối server' : 'Mất kết nối server'}
            color={connected ? 'success' : 'error'}
            className="status-chip"
            style={{ fontWeight: 'bold', fontSize: 16, marginRight: 8 }}
          />
          <Chip
            label={`Ngưỡng: ${savedThreshold} mg/L`}
            color="primary"
            className="threshold-chip"
            style={{ fontWeight: 'bold', fontSize: 16, marginRight: 8 }}
          />
          <Chip
            icon={<SensorsIcon />}
            label={sensorStatus.simulation ? 'Mô phỏng' : 'Cảm biến thật'}
            color="secondary"
            className="sensor-chip"
            style={{ fontWeight: 'bold', fontSize: 16 }}
          />
        </Box>
        <Box className="data-table-container" style={{ background: 'rgba(20,30,60,0.95)', borderRadius: 24, boxShadow: '0 4px 32px #000a', margin: '32px auto 0', padding: 16, maxWidth: 800, animation: 'fadeInUp 1.5s' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" sx={{ color: '#4fc3f7', fontWeight: 700, mb: 1, textAlign: 'center', letterSpacing: 1, textShadow: '0 0 8px #00eaff', flex: 1 }}>
              Lịch sử dữ liệu cảm biến
            </Typography>
            <IconButton onClick={() => setSensorHistoryOpen(o => !o)}>
              {sensorHistoryOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <IconButton onClick={fetchHistory} sx={{ ml: 1 }} color="info"><RefreshIcon /></IconButton>
          </Box>
          {sensorHistoryOpen && (
            <DataGrid
              rows={history.map((row, idx) => ({ ...row, id: row._id || idx, status: row.value }))}
              columns={columns}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              rowsPerPageOptions={[5, 10, 20]}
              autoHeight
              disableSelectionOnClick
              sx={{
                background: 'rgba(30,40,70,0.98)',
                borderRadius: 3,
                fontSize: 16,
                color: '#fff',
                boxShadow: 2,
                '& .MuiDataGrid-columnHeaders': { background: 'rgba(33,150,243,0.15)', color: '#4fc3f7', fontWeight: 700, fontSize: 16 },
                '& .MuiDataGrid-row': { borderBottom: '1px solid #223' },
                '& .MuiDataGrid-cell': { border: 'none' },
                '& .MuiDataGrid-footerContainer': { background: 'rgba(33,150,243,0.10)' },
                '& .MuiTablePagination-root': { color: '#fff' },
              }}
            />
          )}
        </Box>
        <audio id="alertSound" src="/bạn đã bị bắt.mp3" preload="auto"></audio>
        <footer className="app-footer" style={{ textAlign: 'center', marginTop: 32 }}>
          <Typography variant="body2" sx={{ color: '#b3e5fc' }}>
            © 2023 IoT Alcohol Monitoring System
          </Typography>
        </footer>
      </Container>
      {/* Form vé phạt */}
      <TicketForm 
        open={ticketFormOpen}
        onClose={handleCloseTicketForm}
        alcoholValue={currentValue}
        onTicketCreated={handleTicketCreated}
      />
      {/* Lịch sử vé phạt */}
      <Box sx={{ maxWidth: 900, mx: 'auto', mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" sx={{ color: '#ff9100', fontWeight: 700, mb: 1, textAlign: 'center', letterSpacing: 1, textShadow: '0 0 8px #ff9100', flex: 1 }}>
            Lịch sử vé phạt
          </Typography>
          <IconButton onClick={() => setTicketHistoryOpen(o => !o)}>
            {ticketHistoryOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        {ticketHistoryOpen && <TicketHistory reload={reloadTicketHistory} />}
      </Box>
    </div>
  )
}

export default App
