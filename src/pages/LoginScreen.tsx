import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import './AuthScreen.css';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // เมื่อ Login สำเร็จ ให้เด้งไปหน้าหลัก หรือหน้าที่ผู้ใช้ต้องการเข้า
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('กรุณากรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน');
      return;
    }
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน');
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">MUSE<em>.</em></div>
          <div className="auth-subtitle"><span style={{ color: 'var(--gold)' }}>เข้าสู่ระบบ</span>เพื่อดีไซน์ลุคของคุณ</div>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-error" style={{background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', borderColor: 'rgba(76, 175, 80, 0.3)'}}>{message}</div>}
          
          <div className="auth-field">
            <label className="auth-label">อีเมล</label>
            <input
              type="email"
              className="auth-input"
              placeholder="example@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">รหัสผ่าน</label>
            <input
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem' }}>
            <button type="button" onClick={handleResetPassword} style={{ background: 'transparent', border: 'none', color: 'var(--text2)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>
              ลืมรหัสผ่าน?
            </button>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
             {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="auth-footer">
          ยังไม่มีบัญชีใช่ไหม? 
          <Link to="/register" className="auth-link">สมัครสมาชิก</Link>
        </div>
      </div>
    </div>
  );
}
