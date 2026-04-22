import { useNavigate } from 'react-router-dom';
import AppIcon, { type AppIconName } from '@/components/AppIcon';
import './HomeScreen.css';

const OCCASIONS = [
  { icon: 'jewelry' as AppIconName, label: 'งานแต่งงาน', sub: 'Formal · Semi-formal', path: '/occasions?q=wedding' },
  { icon: 'briefcase' as AppIconName, label: 'ทำงาน / Office', sub: 'Business · Smart Casual', path: '/occasions?q=office' },
  { icon: 'moon' as AppIconName, label: 'กลางคืน', sub: 'Cocktail · Party', path: '/occasions?q=night' },
  { icon: 'coffee' as AppIconName, label: 'นัดเดท', sub: 'Romantic · Casual', path: '/occasions?q=date' },
  { icon: 'leaf' as AppIconName, label: 'พักผ่อน', sub: 'Casual · Resort', path: '/occasions?q=casual' },
];

const FEATURED = [
  { icon: 'dress' as AppIconName, name: 'Wrap Dress ลินิน', price: '฿1,290', tag: 'HOT' },
  { icon: 'outerwear' as AppIconName, name: 'Oversized Blazer', price: '฿2,150', tag: '' },
  { icon: 'earrings' as AppIconName, name: 'Statement Earrings', price: '฿590', tag: 'NEW' },
  { icon: 'bag' as AppIconName, name: 'Mini Bag หนัง', price: '฿3,400', tag: '' },
];

export default function HomeScreen() {
  const nav = useNavigate();
  return (
    <div className="home">
      {/* HEADER */}
      <header className="home-header">
        <div className="home-logo">MUSE<em>.</em></div>
        <button className="home-notif" onClick={() => nav('/profile')} aria-label="โปรไฟล์">
          <AppIcon name="profile" className="home-notif-icon" label="โปรไฟล์" />
        </button>
      </header>

      {/* HERO */}
      <div className="home-hero fade-up">
        <span className="badge">AI Style Studio · ลองชุดเสมือนจริง</span>
        <h1 className="hero-h1">ค้นพบ<br/><em>สไตล์ที่ใช่</em><br/>สำหรับคุณ</h1>
        <p className="hero-sub">อัปโหลดรูปตัวเองเพื่อลองชุด ทรงผม และสไตล์ต่างๆ ปรึกษา AI Stylist ส่วนตัว</p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => nav('/studio')}><AppIcon name="spark" /> เริ่มออกแบบ</button>
          <button className="btn-outline" onClick={() => nav('/courses')}>ดูคอร์ส</button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row fade-up fade-up-1">
        <div className="stat"><span className="stat-v">2,400+</span><span className="stat-l">ลุคให้เลือก</span></div>
        <div className="stat-div" />
        <div className="stat"><span className="stat-v">18</span><span className="stat-l">คอร์สแต่งตัว</span></div>
        <div className="stat-div" />
        <div className="stat"><span className="stat-v">9,800+</span><span className="stat-l">ผู้ใช้งาน</span></div>
      </div>

      {/* OCCASIONS */}
      <section className="home-section fade-up fade-up-2">
        <div className="sec-header">
          <h2 className="section-title">แต่งตัวตาม<em>โอกาส</em></h2>
          <button className="sec-more" onClick={() => nav('/occasions')}>ดูทั้งหมด →</button>
        </div>
        <div className="occasions-scroll">
          {OCCASIONS.map(o => (
            <div key={o.label} className="occ-chip" onClick={() => nav(o.path)}>
              <AppIcon name={o.icon} className="occ-icon" label={o.label} />
              <span className="occ-name">{o.label}</span>
              <span className="occ-sub">{o.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED ITEMS */}
      <section className="home-section fade-up fade-up-3">
        <div className="sec-header">
          <h2 className="section-title">ไอเทม<em>แนะนำ</em></h2>
          <button className="sec-more">ดูทั้งหมด →</button>
        </div>
        <div className="featured-grid">
          {FEATURED.map(f => (
            <div key={f.name} className="feat-card">
              {f.tag && <span className="feat-tag">{f.tag}</span>}
              <div className="feat-icon"><AppIcon name={f.icon} label={f.name} /></div>
              <div className="feat-name">{f.name}</div>
              <div className="feat-price">{f.price}</div>
            </div>
          ))}
        </div>
      </section>

      {/* STUDIO CTA */}
      <div className="studio-cta fade-up" onClick={() => nav('/studio')}>
        <div className="cta-text">
          <div className="cta-title">ลองชุดด้วย AI</div>
          <div className="cta-sub">อัปโหลดรูปและปรึกษา Stylist ส่วนตัว</div>
        </div>
        <span className="cta-arrow">→</span>
      </div>
    </div>
  );
}
