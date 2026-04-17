import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { API_BASE } from '../config.js';

export default function Register({ onRegister }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) {
      setError('請填寫所有欄位');
      return;
    }
    if (form.password.length < 8) {
      setError('密碼至少需要 8 個字元');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.user);
      if (onRegister) onRegister();
    } catch (err) {
      setError(err.message || '註冊失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card auth-card">
      <h2 className="auth-title">建立帳號</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>姓名</label>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="旅客姓名"
            autoComplete="name"
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="your@email.com"
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label>密碼（至少 8 個字元）</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="請設定密碼"
            autoComplete="new-password"
          />
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading && <span className="spinner" />}
          建立帳號
        </button>
      </form>
    </div>
  );
}
