import React, { useEffect, useState } from 'react';
import './AlcoholManager.css';

function AlcoholManager() {
  const [readings, setReadings] = useState([]);
  const [value, setValue] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Lấy danh sách readings
  const fetchReadings = async () => {
    setFetchLoading(true);
    setError('');
    try {
      const res = await fetch('/api/alcohol');
      if (!res.ok) throw new Error('Không thể tải dữ liệu');
      const data = await res.json();
      setReadings(data);
    } catch (err) {
      setError('Lỗi khi tải dữ liệu: ' + err.message);
    }
    setFetchLoading(false);
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  // Validate input
  const validate = () => {
    if (!value || isNaN(Number(value)) || Number(value) < 0) {
      setError('Giá trị nồng độ cồn phải là số dương');
      return false;
    }
    if (!deviceId.trim()) {
      setError('Mã thiết bị không được để trống');
      return false;
    }
    return true;
  };

  // Thêm reading mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!validate()) return;
    setSubmitLoading(true);
    try {
      const res = await fetch('/api/alcohol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: Number(value), deviceId: deviceId.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Thêm thành công!');
        setValue('');
        setDeviceId('');
        fetchReadings();
      } else {
        setError(data.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    }
    setSubmitLoading(false);
  };

  return (
    <div className="container">
      <h1>Quản lý nồng độ cồn</h1>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="number"
          placeholder="Giá trị nồng độ cồn"
          value={value}
          onChange={e => setValue(e.target.value)}
          min="0"
          step="any"
          required
        />
        <input
          type="text"
          placeholder="Mã thiết bị"
          value={deviceId}
          onChange={e => setDeviceId(e.target.value)}
          required
        />
        <button type="submit" disabled={submitLoading}>{submitLoading ? 'Đang thêm...' : 'Thêm mới'}</button>
      </form>
      {error && <div className="error-message">{error}</div>}
      {message && <div className="message">{message}</div>}
      <h2>Danh sách readings</h2>
      {fetchLoading ? <p className="loading">Đang tải dữ liệu...</p> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Giá trị</th>
                <th>Mã thiết bị</th>
              </tr>
            </thead>
            <tbody>
              {readings.length === 0 ? (
                <tr><td colSpan="3">Chưa có dữ liệu</td></tr>
              ) : readings.map(r => (
                <tr key={r._id}>
                  <td>{new Date(r.timestamp).toLocaleString()}</td>
                  <td>{r.value}</td>
                  <td>{r.deviceId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AlcoholManager; 