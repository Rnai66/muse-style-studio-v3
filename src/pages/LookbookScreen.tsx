import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLookbook } from '@/hooks/useLookbook';
import './LookbookScreen.css';

const OCCASIONS = ['ทั้งหมด', 'งานแต่งงาน', 'ทำงาน', 'กลางคืน', 'นัดเดท', 'พักผ่อน'];

export default function LookbookScreen() {
  const navigate = useNavigate();
  const { looks, deleteLook } = useLookbook();
  const [filter, setFilter] = useState('ทั้งหมด');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = filter === 'ทั้งหมด' ? looks : looks.filter(l => l.occasion === filter);

  return (
    <div className="lb-page">
      <header className="lb-header">
        <h1 className="lb-title serif">Look<em>book</em></h1>
        <div style={{display: 'flex', gap: '0.8rem', alignItems: 'center'}}>
          <span className="lb-count">{looks.length} ลุค</span>
          <button className="home-notif" style={{background:'transparent', border:'none', color:'var(--text1)', fontSize:'1.2rem', padding: 0}} onClick={() => navigate('/profile')}>◎</button>
        </div>
      </header>

      {/* Occasion filter */}
      <div className="lb-filter-scroll">
        {OCCASIONS.map(o => (
          <button
            key={o}
            className={`lb-filter-btn ${filter === o ? 'active' : ''}`}
            onClick={() => setFilter(o)}
          >{o}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="lb-empty">
          <div className="lb-empty-icon">📚</div>
          <p className="lb-empty-text">ยังไม่มีลุคที่บันทึก</p>
          <p className="lb-empty-sub">สร้างลุคด้วย AI Studio แล้วกด "บันทึก ✦"</p>
        </div>
      ) : (
        <div className="lb-grid">
          {filtered.map(look => (
            <div key={look.id} className="lb-card">
              <div className="lb-img-wrap">
                <img
                  src={look.imageUrl}
                  alt={look.title}
                  className="lb-img"
                  onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="260"><rect width="200" height="260" fill="%231e1c1a"/><text x="100" y="130" text-anchor="middle" fill="%236a6460" font-size="40">👗</text></svg>'; }}
                />
                <button
                  className="lb-delete-btn"
                  onClick={() => setConfirmDelete(look.id)}
                >×</button>
              </div>
              <div className="lb-info">
                <div className="lb-look-title">{look.title}</div>
                <div className="lb-look-occasion">{look.occasion}</div>
                {look.tags.length > 0 && (
                  <div className="lb-tags">
                    {look.tags.map(t => <span key={t} className="lb-tag">{t}</span>)}
                  </div>
                )}
                {look.notes && <p className="lb-notes">{look.notes}</p>}
                <div className="lb-date">
                  {new Date(look.createdAt).toLocaleDateString('th-TH')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="lb-confirm-overlay">
          <div className="lb-confirm-box">
            <p className="lb-confirm-msg">ลบลุคนี้?</p>
            <div className="lb-confirm-btns">
              <button className="lb-conf-btn"
                onClick={() => { deleteLook(confirmDelete); setConfirmDelete(null); }}>
                ลบ
              </button>
              <button className="lb-conf-btn cancel"
                onClick={() => setConfirmDelete(null)}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
