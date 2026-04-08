import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import './AuthScreen.css';

export default function RegisterScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name
      await updateProfile(userCredential.user, { displayName: name });
      
      // เมื่อสมัครสำเร็จ ให้เด้งไปหน้าหลัก
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('อีเมลนี้มีผู้ใช้งานแล้ว');
      } else {
        setError(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">MUSE<em>.</em></div>
          <div className="auth-subtitle">สร้างบัญชีใหม่เพื่อใช้งาน</div>
        </div>

        <form className="auth-form" onSubmit={handleRegister}>
          {error && <div className="auth-error">{error}</div>}
          
          <div className="auth-field">
            <label className="auth-label">ชื่อ - นามสกุล</label>
            <input
              type="text"
              className="auth-input"
              placeholder="Ex: สมหญิง รักสวย"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

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
              placeholder="ขั้นต่ำ 6 ตัวอักษร"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
             {loading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div className="auth-footer">
          มีบัญชีอยู่แล้วใช่ไหม? 
          <Link to="/login" className="auth-link">เข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
}
