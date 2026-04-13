import { useState } from 'react';

export default function AvailableRooms({ onBook }) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [rooms, setRooms] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  async function handleSearch(e) {
    e.preventDefault();
    setError('');
    setRooms(null);

    if (!checkIn || !checkOut) {
      setError('請填寫入住與退房日期');
      return;
    }
    if (checkOut <= checkIn) {
      setError('退房日期必須晚於入住日期');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/available?check_in=${checkIn}&check_out=${checkOut}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRooms(data.rooms);
    } catch (err) {
      setError(err.message || '查詢失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <form onSubmit={handleSearch}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label>入住日期</label>
            <input type="date" value={checkIn} min={today} onChange={e => setCheckIn(e.target.value)} />
          </div>
          <div className="form-group">
            <label>退房日期</label>
            <input type="date" value={checkOut} min={checkIn || today} onChange={e => setCheckOut(e.target.value)} />
          </div>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading && <span className="spinner" />}
          查詢空房
        </button>
      </form>

      {rooms !== null && (
        rooms.length === 0 ? (
          <div className="alert alert-info" style={{ marginTop: '16px' }}>
            該日期區間已無空房
          </div>
        ) : (
          <>
            <p style={{ marginTop: '16px', fontSize: '0.9rem', color: '#666' }}>
              找到 {rooms.length} 間空房，點選即可預訂：
            </p>
            <div className="room-list">
              {rooms.map(room => (
                <div
                  key={room.room_number}
                  className="room-card"
                  onClick={() => onBook({ room, checkIn, checkOut })}
                >
                  <div className="room-num">{room.room_number}</div>
                  <div className="room-desc">{room.description}</div>
                </div>
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}
