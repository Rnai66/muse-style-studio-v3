import { useRef, useState, KeyboardEvent } from 'react';
import { CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useCamera } from '@/hooks/useCamera';
import { useAIStylist } from '@/hooks/useAIStylist';
import AppIcon from '@/components/AppIcon';
import { dataUrlToBase64, mimeFromDataUrl } from '@/lib/image';
import './StudioScreen.css';

const QUICK = ['แต่งตัวไปงานแต่ง', 'ลุค Office chic', 'สไตล์ที่ใช่สำหรับฉัน', 'Capsule wardrobe'];

export default function StudioScreen() {
  const { image, loading: camLoading, takePhoto, clear } = useCamera();
  const { messages, loading: aiLoading, send } = useAIStylist();
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scrollChat = () => {
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 50);
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput('');
    await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    await send(msg);
    scrollChat();
  };

  const handleAnalyze = async () => {
    if (!image) return;
    await Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    await send(
      'วิเคราะห์สไตล์การแต่งตัวของฉันจากรูปนี้ บอก: 1) สไตล์หลัก 2) จุดเด่น 3) คำแนะนำ upgrade look',
      dataUrlToBase64(image.dataUrl),
      mimeFromDataUrl(image.dataUrl)
    );
    scrollChat();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // stub — on web use file reader, on native use Capacitor camera
      console.log('file loaded', ev.target?.result?.toString().slice(0, 30));
    };
    reader.readAsDataURL(f);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !aiLoading) handleSend();
  };

  return (
    <div className="studio">
      <header className="studio-header">
        <h1 className="studio-title serif">Style <em>Studio</em></h1>
        <span className="badge">AI Stylist</span>
      </header>

      {/* UPLOAD AREA */}
      <div className="upload-area">
        {image ? (
          <div className="preview-wrap">
            <img src={image.dataUrl} alt="uploaded" className="preview-img" />
            <div className="preview-actions">
              <button className="pa-btn" onClick={() => takePhoto(CameraSource.Camera)}><AppIcon name="camera" /> ถ่ายใหม่</button>
              <button className="pa-btn" onClick={clear}><AppIcon name="close" /> ลบ</button>
              <button className="pa-btn gold" onClick={handleAnalyze} disabled={aiLoading}>
                {aiLoading ? '...' : <><AppIcon name="spark" /> วิเคราะห์</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-empty" onClick={() => takePhoto(CameraSource.Photos)}>
            {camLoading
              ? <span className="upload-hint">กำลังโหลด...</span>
              : <>
                  <div className="upload-silhouette"><AppIcon name="avatar" label="โปรไฟล์" /></div>
                  <p className="upload-label">แตะเพื่ออัปโหลดรูป</p>
                  <p className="upload-hint">หรือถ่ายรูปใหม่เพื่อลองชุด</p>
                  <div className="upload-btns">
                    <button className="up-btn" onClick={(e) => { e.stopPropagation(); takePhoto(CameraSource.Photos); }}><AppIcon name="gallery" /> คลังรูป</button>
                    <button className="up-btn" onClick={(e) => { e.stopPropagation(); takePhoto(CameraSource.Camera); }}><AppIcon name="camera" /> กล้อง</button>
                  </div>
                </>
            }
          </div>
        )}
        {/* fallback for web */}
        <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {/* CHAT */}
      <div className="chat-wrap">
        <div className="chat-messages" ref={chatRef}>
          {messages.map((m, i) => (
            <div key={i} className={`bubble-wrap ${m.role}`}>
              {m.role === 'assistant' && <div className="ai-label">MUSE AI</div>}
              <div className={`bubble ${m.role}`}>{m.content}</div>
            </div>
          ))}
          {aiLoading && (
            <div className="bubble-wrap assistant">
              <div className="ai-label">MUSE AI</div>
              <div className="bubble assistant typing">
                <span/><span/><span/>
              </div>
            </div>
          )}
        </div>

        {/* QUICK PROMPTS */}
        <div className="quick-scroll">
          {QUICK.map(q => (
            <button key={q} className="qp" onClick={() => { setInput(q); handleSend(q); }}>{q}</button>
          ))}
        </div>

        {/* INPUT */}
        <div className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="ถามเกี่ยวกับสไตล์..."
            disabled={aiLoading}
          />
          <button
            className="send-btn"
            onClick={() => handleSend()}
            disabled={aiLoading || !input.trim()}
          >ส่ง</button>
        </div>
      </div>
    </div>
  );
}
