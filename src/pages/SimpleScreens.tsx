import './SimpleScreens.css';

/* ───────── OCCASIONS ───────── */
const OCCS = [
  { icon:'💍', title:'งานแต่งงาน',   sub:'Formal · Semi-formal',  tips:['เลือก Midi หรือ Maxi dress','หลีกเลี่ยงสีขาวและสีดำ','เน้นผ้าที่มีน้ำหนัก เช่น ซาติน ลูกไม้'] },
  { icon:'💼', title:'ทำงาน / Office', sub:'Business · Smart Casual', tips:['Blazer + Trousers ดูน่าเชื่อถือ','Midi skirt กับ blouse ทำงานได้ดี','รองเท้า block heel เสริมความมั่นใจ'] },
  { icon:'🌙', title:'กลางคืน',       sub:'Cocktail · Party',        tips:['Slip dress + statement accessories','Little Black Dress ตัวเดียวจบ','Metallic tones โดดเด่นในที่มืด'] },
  { icon:'☕', title:'นัดเดท',        sub:'Romantic · Casual Chic',  tips:['Wrap dress เซ็กซี่แต่ไม่โชว์มาก','สีอ่อน ผ้านิ่ม ดูอ่อนหวาน','Ankle boots สุดท้าย'] },
  { icon:'🌿', title:'พักผ่อน',      sub:'Casual · Resort',         tips:['Linen set สบาย ดูดี','Sundress + sandals ง่ายแต่สวย','สีสดใส ลายดอก รีสอร์ตไวบ์'] },
  { icon:'🎓', title:'งาน Formal',    sub:'Black Tie · Gala',        tips:['Floor-length gown เป็นทางการที่สุด','ผ้าหรูหรา เช่น Velvet, Silk','Jewelry ชุดครบ เน้นคลาสสิก'] },
];

export function OccasionScreen() {
  return (
    <div className="simple-page">
      <header className="simple-header">
        <h1 className="serif" style={{fontSize:'1.5rem',fontWeight:300,color:'var(--cream)'}}>
          แต่งตัวตาม<em style={{fontStyle:'italic',color:'var(--gold)'}}>โอกาส</em>
        </h1>
      </header>
      <div className="occ-list">
        {OCCS.map(o=>(
          <div key={o.title} className="occ-card">
            <div className="occ-card-top">
              <span className="occ-card-icon">{o.icon}</span>
              <div>
                <div className="occ-card-title">{o.title}</div>
                <div className="occ-card-sub">{o.sub}</div>
              </div>
            </div>
            <ul className="occ-tips">
              {o.tips.map(t=><li key={t}>{t}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── COURSES ───────── */
const COURSES = [
  { icon:'💍', title:'Special Occasions',    desc:'เรียนรู้ Dress Code งานต่างๆ',    price:'฿1,290', lessons:8,  tag:'Popular' },
  { icon:'✨', title:'Personal Style',        desc:'ค้นพบสไตล์ส่วนตัวที่ไม่ซ้ำใคร', price:'฿1,890', lessons:12, tag:'New' },
  { icon:'💼', title:'Office & Career',       desc:'แต่งตัวให้ดูน่าเชื่อถือในงาน',   price:'฿1,490', lessons:10, tag:'Bestseller' },
  { icon:'🎨', title:'Color Analysis',        desc:'เลือกสีที่เหมาะกับ skin tone',    price:'฿990',  lessons:6,  tag:'' },
  { icon:'👗', title:'Capsule Wardrobe',      desc:'ตู้เสื้อผ้าน้อยชิ้นแต่ครบครัน', price:'฿1,190', lessons:8,  tag:'' },
  { icon:'💇', title:'Hair & Makeup',         desc:'ทรงผม เมคอัพ ให้เข้ากับลุค',     price:'฿890',  lessons:7,  tag:'New' },
];

export function CoursesScreen() {
  return (
    <div className="simple-page">
      <header className="simple-header">
        <h1 className="serif" style={{fontSize:'1.5rem',fontWeight:300,color:'var(--cream)'}}>
          คอร์ส<em style={{fontStyle:'italic',color:'var(--gold)'}}>การแต่งตัว</em>
        </h1>
      </header>
      <div className="course-list">
        {COURSES.map(c=>(
          <div key={c.title} className="course-row">
            <div className="cr-icon">{c.icon}</div>
            <div className="cr-body">
              <div className="cr-top">
                <span className="cr-title">{c.title}</span>
                {c.tag && <span className="cr-tag">{c.tag}</span>}
              </div>
              <div className="cr-desc">{c.desc} · {c.lessons} บทเรียน</div>
            </div>
            <div className="cr-right">
              <div className="cr-price">{c.price}</div>
              <button className="cr-btn">ดู</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── PROFILE ───────── */
export function ProfileScreen() {
  return (
    <div className="simple-page">
      <header className="simple-header">
        <h1 className="serif" style={{fontSize:'1.5rem',fontWeight:300,color:'var(--cream)'}}>
          โปร<em style={{fontStyle:'italic',color:'var(--gold)'}}>ไฟล์</em>
        </h1>
      </header>
      <div className="profile-avatar">
        <div className="avatar-circle">M</div>
        <div className="avatar-name">MUSE Member</div>
        <div className="avatar-sub">Style Studio · Free Plan</div>
      </div>
      <div className="profile-stats">
        <div className="ps-item"><span className="ps-v">0</span><span className="ps-l">ลุคที่บันทึก</span></div>
        <div className="ps-div"/>
        <div className="ps-item"><span className="ps-v">0</span><span className="ps-l">คอร์สที่เรียน</span></div>
        <div className="ps-div"/>
        <div className="ps-item"><span className="ps-v">0</span><span className="ps-l">ครั้งที่ปรึกษา AI</span></div>
      </div>
      <div className="profile-menu">
        {['ลุคที่บันทึก','คอร์สของฉัน','ตั้งค่าโปรไฟล์','แพ็กเกจ Premium','ช่วยเหลือ'].map(item=>(
          <div key={item} className="pm-item">
            <span>{item}</span>
            <span style={{color:'var(--text3)'}}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OccasionScreen;
