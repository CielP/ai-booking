import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function BookRoom({ prefill, onBooked }) {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    room_number: '',
    check_in: '',
    check_out: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (prefill) {
      setForm(prev => ({
        ...prev,
        room_number: String(prefill.room.room_number),
        check_in: prefill.checkIn,
        check_out: prefill.checkOut,
      }));
      setSuccess(null);
      setApiError('');
    }
  }, [prefill]);

  function validate() {
    const e = {};
    if (!form.room_number) e.room_number = '請填寫房間號碼';
    if (!form.check_in) e.check_in = '請填寫入住日期';
    if (!form.check_out) e.check_out = '請填寫退房日期';
    else if (form.check_in && form.check_out <= form.check_in) e.check_out = '退房日期必須晚於入住日期';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, room_number: parseInt(form.room_number) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.booking);
      setForm({ room_number: '', check_in: '', check_out: '', notes: '' });
      if (onBooked) onBooked(data.booking);
    } catch (err) {
      setApiError(err.message || '預訂失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="card">
        <div className="alert alert-success">
          <strong>預訂成功！</strong>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', fontSize: '0.9rem', lineHeight: '1.8' }}>
          <p><strong>訂單編號：</strong><code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>{success.id}</code></p>
          <p><strong>房間：</strong>{success.room_number} 號房</p>
          <p><strong>姓名：</strong>{success.guest_name}</p>
          <p><strong>Email：</strong>{success.guest_email}</p>
          <p><strong>入住：</strong>{success.check_in}</p>
          <p><strong>退房：</strong>{success.check_out}</p>
          {success.notes && <p><strong>備注：</strong>{success.notes}</p>}
        </div>
        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '12px' }}>
          請保存訂單編號以便查詢或取消訂單。
        </p>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setSuccess(null)}>
          再次預訂
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      {user && (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.9rem' }}>
          預訂人：<strong>{user.name}</strong>（{user.email}）
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>房間號碼 *</label>
          <select value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value})}>
            <option value="">請選擇房間</option>
            {[101, 102, 103, 104, 105].map(n => (
              <option key={n} value={n}>{n} 號房</option>
            ))}
          </select>
          {errors.room_number && <span style={{ color: '#dc2626', fontSize: '0.82rem' }}>{errors.room_number}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label>入住日期 *</label>
            <input type="date" value={form.check_in} min={today} onChange={e => setForm({...form, check_in: e.target.value})} />
            {errors.check_in && <span style={{ color: '#dc2626', fontSize: '0.82rem' }}>{errors.check_in}</span>}
          </div>
          <div className="form-group">
            <label>退房日期 *</label>
            <input type="date" value={form.check_out} min={form.check_in || today} onChange={e => setForm({...form, check_out: e.target.value})} />
            {errors.check_out && <span style={{ color: '#dc2626', fontSize: '0.82rem' }}>{errors.check_out}</span>}
          </div>
        </div>
        <div className="form-group">
          <label>備注／特殊需求</label>
          <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="如有特殊需求請填寫" />
        </div>
        {apiError && <div className="alert alert-error">{apiError}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading && <span className="spinner" />}
          確認預訂
        </button>
      </form>
    </div>
  );
}
