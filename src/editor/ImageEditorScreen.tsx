import { useRef, useState, useCallback, useEffect } from 'react';
import { CameraSource } from '@capacitor/camera';
import { useCamera } from '@/hooks/useCamera';
import { useTryOnPipeline, useHairPipeline } from '@/hooks/useAIPipeline';
import { useEditorStore } from './hooks/useEditorStore';
import EditorCanvas from './components/EditorCanvas';
import LayerItem from './components/LayerItem';
import TransformPanel from './components/TransformPanel';
import AIProcessingPanel from '@/components/AIProcessingPanel';
import UploadItemPanel from './components/UploadItemPanel';
import { CATALOG, CATALOG_BY_CATEGORY } from './utils/catalog';
import { CATEGORY_META } from './types';
import type { CatalogItem, LayerCategory } from './types';
import './ImageEditorScreen.css';

const SIDE_CATS: LayerCategory[] = ['top', 'bottom', 'dress', 'hair', 'shoes', 'bag', 'outerwear'];

// Helper to detect device type
function getDeviceType() {
  const width = window.innerWidth;
  if (width < 480) return 'mobile-small';
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export default function ImageEditorScreen() {
  const { image, takePhoto } = useCamera();
  const editor = useEditorStore();
  const tryon   = useTryOnPipeline();
  const hair    = useHairPipeline();
  const fileRef = useRef<HTMLInputElement>(null);

  const [catFilter, setCatFilter] = useState<LayerCategory>('dress');
  const [searchQ, setSearchQ]     = useState('');
  const [deviceType, setDeviceType] = useState<'mobile-small' | 'mobile' | 'tablet' | 'desktop'>(getDeviceType());
  
  // Drawer States
  const [leftDrawer, setLeftDrawer] = useState<'catalog' | 'layers' | null>(null);
  const [rightDrawer, setRightDrawer] = useState<'upload' | 'transform' | 'ai' | null>(null);

  const [aiPanel, setAIPanel]     = useState<'tryon' | 'hair' | null>(null);
  
  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Load base image ──
  const loadBase = useCallback((dataUrl: string) => {
    const img = new Image();
    img.onload = () => editor.setBaseImage(dataUrl, Math.min(img.naturalWidth, 600), Math.min(img.naturalHeight, 800));
    img.src = dataUrl;
  }, [editor]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => loadBase(ev.target?.result as string);
    r.readAsDataURL(f);
  };

  const handleCameraPhoto = async () => {
    const photo = await takePhoto(CameraSource.Photos);
    if (photo) loadBase(photo.dataUrl);
  };

  // ── Add catalog item as layer ──
  const addItem = useCallback((item: CatalogItem) => {
    editor.addLayer(item, item.previewUrl);
    // Auto-close drawers on mobile/tablet after adding item
    if (deviceType !== 'desktop') {
      setLeftDrawer(null);
      setRightDrawer(null);
    }
  }, [editor, deviceType]);

  // ── Add uploaded item as layer ──
  const addUploadedItem = useCallback((item: CatalogItem, imageUrl: string) => {
    editor.addLayer(item, imageUrl);
    if (deviceType !== 'desktop') {
      setRightDrawer(null);
      setLeftDrawer('layers');
    } else {
      setRightDrawer(null);
      setLeftDrawer('layers');
    }
  }, [editor, deviceType]);

  // ── Run AI on selected layer ──
  const runAIOnLayer = useCallback(async (layerId: string) => {
    if (!editor.state.baseImage) return;
    const layer = editor.state.layers.find(l => l.id === layerId);
    if (!layer) return;

    setAIPanel(layer.category === 'hair' ? 'hair' : 'tryon');
    setRightDrawer('ai'); // Switch right drawer to AI to show progress
    
    const catalogItem = CATALOG.find(c => c.name === layer.name);

    if (layer.category === 'hair') {
      const prompt = catalogItem?.aiPrompt ?? 'new hairstyle';
      await hair.changeHair(editor.state.baseImage, prompt);
      if (hair.state.resultUrl) {
        editor.markAIProcessed(layerId, hair.state.resultUrl);
        editor.setAIResult(hair.state.resultUrl);
      }
    } else {
      const garmentUrl = layer.imageUrl.startsWith('data:') ? layer.imageUrl : editor.state.baseImage;
      const cat = catalogItem?.replicateCategory ?? 'dresses';
      await tryon.tryOn(editor.state.baseImage, garmentUrl, cat);
      if (tryon.state.resultUrl) {
        editor.markAIProcessed(layerId, tryon.state.resultUrl);
        editor.setAIResult(tryon.state.resultUrl);
      }
    }
  }, [editor, hair, tryon]);

  // ── Export canvas ──
  const exportImage = useCallback(() => {
    const url = editor.state.aiResultUrl ?? editor.state.baseImage;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `muse-style-${Date.now()}.jpg`;
    a.click();
  }, [editor.state]);

  const filtered = (CATALOG_BY_CATEGORY[catFilter] ?? []).filter(i =>
    !searchQ || i.name.includes(searchQ) || i.nameEn.toLowerCase().includes(searchQ.toLowerCase())
  );

  const activePipeline = aiPanel === 'hair' ? hair.state : tryon.state;
  const activeReset    = aiPanel === 'hair' ? hair.reset   : tryon.reset;

  return (
    <div className="ie-root">
      {/* ── TOP TOOLBAR ── */}
      <div className="ie-toolbar">
        <div className="ie-toolbar-left">
          <button className="tb-btn" onClick={handleCameraPhoto} title="เปิดรูป">📂</button>
          <input type="file" accept="image/*" ref={fileRef} style={{ display:'none' }} onChange={handleFileChange} />
          <div className="tb-divider" />
          <button className="tb-btn" onClick={editor.undo} disabled={!editor.canUndo} title="ยกเลิก">↩</button>
          <button className="tb-btn" onClick={editor.redo} disabled={!editor.canRedo} title="ทำซ้ำ">↪</button>
          <div className="tb-divider" />
          <button className={`tb-btn ${editor.state.showGrid ? 'active' : ''}`} onClick={editor.toggleGrid} title="Grid">⊞</button>
          <button className={`tb-btn ${editor.state.showComparison ? 'active' : ''}`}
            onClick={editor.toggleComparison} disabled={!editor.state.aiResultUrl} title="เปรียบเทียบ AI">⇆</button>
        </div>
        <div className="ie-logo serif">MUSE <em>Editor</em></div>
        <div className="ie-toolbar-right">
          <button className="tb-btn" onClick={() => editor.setZoom(editor.state.zoom - 0.1)}>−</button>
          <span className="tb-zoom">{Math.round(editor.state.zoom * 100)}%</span>
          <button className="tb-btn" onClick={() => editor.setZoom(editor.state.zoom + 0.1)}>+</button>
          <div className="tb-divider" />
          <button className="tb-btn export" onClick={exportImage} disabled={!editor.state.baseImage} title="บันทึกรูป">↓ บันทึก</button>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="ie-body">
        
        {/* --- LEFT SIDEBAR (Menu Buttons) --- */}
        <div className="ie-sidebar left">
          <button className={`ie-side-btn ${leftDrawer === 'catalog' ? 'active' : ''}`} 
                  onClick={() => { setLeftDrawer('catalog'); setRightDrawer(null); }}>
            <span className="ie-side-icon">🛍</span>
            <span className="ie-side-label">ไอเทม</span>
          </button>
          <button className={`ie-side-btn ${leftDrawer === 'layers' ? 'active' : ''}`} 
                  onClick={() => { setLeftDrawer('layers'); setRightDrawer(null); }}>
            <span className="ie-side-icon">🗂</span>
            <span className="ie-side-label">Layers</span>
          </button>
        </div>

        {/* --- LEFT DRAWER (Content) --- */}
        <div className={`ie-drawer left ${leftDrawer ? 'open' : ''}`}>
          <div className="ie-panel-header">
            <div className="ie-panel-title">{leftDrawer === 'catalog' ? '🛍 เลือกไอเทม' : '🗂 การจัดการเลเยอร์'}</div>
            <button className="ie-panel-close" onClick={() => setLeftDrawer(null)}>✕</button>
          </div>

          {/* CATALOG PANEL */}
          {leftDrawer === 'catalog' && (
            <div className="ie-catalog">
              <div className="cat-scroll">
                {SIDE_CATS.map(c => (
                  <button key={c} className={`cat-chip ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>
                    {CATEGORY_META[c].icon} {CATEGORY_META[c].label}
                  </button>
                ))}
              </div>
              <input className="cat-search" placeholder="ค้นหาไอเทม..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
              <div className="cat-items">
                {filtered.map(item => (
                  <div key={item.id} className="cat-item" onClick={() => addItem(item)}>
                    <div className="ci-swatch" style={{ background: item.color }}><span className="ci-emoji">{item.previewUrl}</span></div>
                    <div className="ci-info">
                      <div className="ci-name">{item.name}</div>
                      <div className="ci-name-en">{item.nameEn}</div>
                      <div className="ci-tags">{item.tags.slice(0,2).map(t => <span key={t} className="ci-tag">{t}</span>)}</div>
                    </div>
                    <div className="ci-price">{item.price}</div>
                  </div>
                ))}
                {filtered.length === 0 && <div className="cat-empty">ไม่พบไอเทม</div>}
              </div>
            </div>
          )}

          {/* LAYERS PANEL */}
          {leftDrawer === 'layers' && (
            <div className="ie-layers">
              {editor.state.layers.length === 0
                ? <div className="layers-empty">ยังไม่มี layer<br/>เลือกไอเทมจากแท็บ "ไอเทม" ทางซ้ายมือได้เลย</div>
                : [...editor.state.layers].reverse().map(layer => (
                    <LayerItem
                      key={layer.id}
                      layer={layer}
                      isSelected={layer.id === editor.state.selectedLayerId}
                      onSelect={() => { editor.selectLayer(layer.id); setRightDrawer('transform'); }}
                      onToggleVisible={() => editor.toggleVisible(layer.id)}
                      onToggleLock={() => editor.toggleLock(layer.id)}
                      onDelete={() => editor.removeLayer(layer.id)}
                      onRunAI={() => runAIOnLayer(layer.id)}
                    />
                  ))
              }
            </div>
          )}
        </div>


        {/* --- CENTER CANVAS --- */}
        <EditorCanvas
          state={editor.state}
          onSelectLayer={editor.selectLayer}
          onTransformLayer={(id, patch) => editor.updateTransform(id, patch)}
        />


        {/* --- RIGHT DRAWER (Content) --- */}
        <div className={`ie-drawer right ${rightDrawer ? 'open' : ''}`}>
           <div className="ie-panel-header">
            <div className="ie-panel-title">{
               rightDrawer === 'upload' ? '📎 อัปโหลดรูปภาพ' : 
               rightDrawer === 'transform' ? '⚙ ปรับแต่งขนาด/มุม' : 
               '✨ AI Quick Actions'
            }</div>
            <button className="ie-panel-close" onClick={() => setRightDrawer(null)}>✕</button>
          </div>

          {/* UPLOAD PANEL */}
          {rightDrawer === 'upload' && (
            <div className="ie-upload">
              <UploadItemPanel onAdd={addUploadedItem} />
            </div>
          )}

          {/* TRANSFORM PANEL */}
          {rightDrawer === 'transform' && (
            <div className="ie-transform">
              {editor.selectedLayer
                ? <TransformPanel transform={editor.selectedLayer.transform} onChange={patch => editor.updateTransform(editor.selectedLayer!.id, patch)} />
                : <div className="layers-empty">เลือก Layer ก่อนถึงจะปรับแต่งได้</div>
              }
            </div>
          )}

          {/* AI PANEL */}
          {rightDrawer === 'ai' && (
            <div className="ie-ai-section">
              {!editor.state.baseImage ? (
                 <div className="qai-hint">โปรดเพิ่มรูปคนตั้งต้นของคุณก่อน (ใช้ปุ่มเมนูด้านซ้ายบนสุด)</div>
              ) : (
                <>
                  <div className="qai-section-label">Virtual Try-On (ลองชุด AI)</div>
                  {['dress','top','bottom','outerwear'].map(cat => {
                    const layer = editor.state.layers.find(l => l.category === cat as LayerCategory);
                    return layer ? (
                      <button key={cat} className="qai-btn gold" onClick={() => runAIOnLayer(layer.id)} disabled={tryon.state.status === 'running'}>
                        <span>{CATEGORY_META[cat as LayerCategory].icon}</span> <span>Try-On {layer.name}</span>
                      </button>
                    ) : null;
                  })}

                  <div className="qai-section-label">Hair AI (เปลี่ยนทรงผม AI)</div>
                  {editor.state.layers.filter(l => l.category === 'hair').map(layer => (
                    <button key={layer.id} className="qai-btn" onClick={() => runAIOnLayer(layer.id)} disabled={hair.state.status === 'running'}>
                      <span>💇</span> <span>{layer.name}</span>
                    </button>
                  ))}

                  {(tryon.state.status !== 'idle' || hair.state.status !== 'idle') && (
                    <div style={{ marginTop: '1rem' }}>
                      <AIProcessingPanel
                        state={activePipeline}
                        beforeUrl={editor.state.baseImage ?? undefined}
                        onReset={activeReset}
                        onDownload={(url: string) => editor.setAIResult(url)}
                        label={aiPanel === 'hair' ? 'AI Hair Styling' : 'AI Virtual Try-On'}
                      />
                    </div>
                  )}

                  {editor.state.aiResultUrl && (
                    <>
                      <div className="qai-divider" />
                      <button className={`qai-btn ${editor.state.showComparison ? 'gold' : ''}`} onClick={editor.toggleComparison}>
                        <span>⇆</span> <span>{editor.state.showComparison ? 'ซ่อนผล AI' : 'แสดงผล AI ตันฉบับ'}</span>
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>


        {/* --- RIGHT SIDEBAR (Menu Buttons) --- */}
        <div className="ie-sidebar right">
          <button className={`ie-side-btn ${rightDrawer === 'ai' ? 'active' : ''}`} 
                  onClick={() => { setRightDrawer('ai'); setLeftDrawer(null); }}>
            <span className="ie-side-icon">✨</span>
            <span className="ie-side-label">AI</span>
          </button>
          <button className={`ie-side-btn ${rightDrawer === 'upload' ? 'active' : ''}`} 
                  onClick={() => { setRightDrawer('upload'); setLeftDrawer(null); }}>
            <span className="ie-side-icon">📎</span>
            <span className="ie-side-label">อัปโหลด</span>
          </button>
          <button className={`ie-side-btn ${rightDrawer === 'transform' ? 'active' : ''}`} 
                  onClick={() => { setRightDrawer('transform'); setLeftDrawer(null); }}>
            <span className="ie-side-icon">⚙</span>
            <span className="ie-side-label">ปรับแต่ง</span>
          </button>
        </div>

        {/* Backdrop for Mobile Overlay Defaults */}
        <div className={`ie-backdrop ${(leftDrawer || rightDrawer) ? 'visible' : ''}`} 
             onClick={() => { setLeftDrawer(null); setRightDrawer(null); }} />
      </div>
    </div>
  );
}
