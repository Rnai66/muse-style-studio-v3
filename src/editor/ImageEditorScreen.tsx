import { useRef, useState, useCallback } from 'react';
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

export default function ImageEditorScreen() {
  const { image, takePhoto } = useCamera();
  const editor = useEditorStore();
  const tryon   = useTryOnPipeline();
  const hair    = useHairPipeline();
  const fileRef = useRef<HTMLInputElement>(null);

  const [catFilter, setCatFilter] = useState<LayerCategory>('dress');
  const [searchQ, setSearchQ]     = useState('');
  const [activePanel, setActivePanel] = useState<'layers' | 'catalog' | 'transform' | 'upload'>('catalog');
  const [aiPanel, setAIPanel]     = useState<'tryon' | 'hair' | null>(null);

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
    // For now use emoji as placeholder; AI replaces it
    editor.addLayer(item, item.previewUrl);
  }, [editor]);

  // ── Add uploaded item as layer ──
  const addUploadedItem = useCallback((item: CatalogItem, imageUrl: string) => {
    editor.addLayer(item, imageUrl);
    setActivePanel('layers');
  }, [editor]);

  // ── Run AI on selected layer ──
  const runAIOnLayer = useCallback(async (layerId: string) => {
    if (!editor.state.baseImage) return;
    const layer = editor.state.layers.find(l => l.id === layerId);
    if (!layer) return;

    setAIPanel(layer.category === 'hair' ? 'hair' : 'tryon');
    const catalogItem = CATALOG.find(c => c.name === layer.name);

    if (layer.category === 'hair') {
      const prompt = catalogItem?.aiPrompt ?? 'new hairstyle';
      await hair.changeHair(editor.state.baseImage, prompt);
      if (hair.state.resultUrl) {
        editor.markAIProcessed(layerId, hair.state.resultUrl);
        editor.setAIResult(hair.state.resultUrl);
      }
    } else {
      const garmentUrl = layer.imageUrl.startsWith('data:')
        ? layer.imageUrl
        : editor.state.baseImage; // fallback
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

  // Filtered catalog
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
          {/* Zoom */}
          <button className="tb-btn" onClick={() => editor.setZoom(editor.state.zoom - 0.1)}>−</button>
          <span className="tb-zoom">{Math.round(editor.state.zoom * 100)}%</span>
          <button className="tb-btn" onClick={() => editor.setZoom(editor.state.zoom + 0.1)}>+</button>
          <div className="tb-divider" />
          <button className="tb-btn export" onClick={exportImage} disabled={!editor.state.baseImage} title="บันทึกรูป">
            ↓ บันทึก
          </button>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="ie-body">

        {/* LEFT PANEL */}
        <div className="ie-left">
          {/* Panel tabs */}
          <div className="ie-panel-tabs">
            {(['catalog', 'upload', 'layers', 'transform'] as const).map(p => (
              <button key={p} className={`ie-ptab ${activePanel === p ? 'active' : ''}`}
                onClick={() => setActivePanel(p)}>
                { p === 'catalog'   ? '🛍 ไอเทม'
                : p === 'upload'   ? '📎 อัปโหลด'
                : p === 'layers'   ? '🗂 Layers'
                :                   '⚙ ปรับแต่ง' }
              </button>
            ))}
          </div>

          {/* CATALOG PANEL */}
          {activePanel === 'catalog' && (
            <div className="ie-catalog">
              {/* Category chips */}
              <div className="cat-scroll">
                {SIDE_CATS.map(c => (
                  <button key={c}
                    className={`cat-chip ${catFilter === c ? 'active' : ''}`}
                    onClick={() => setCatFilter(c)}
                  >
                    {CATEGORY_META[c].icon} {CATEGORY_META[c].label}
                  </button>
                ))}
              </div>
              {/* Search */}
              <input
                className="cat-search" placeholder="ค้นหาไอเทม..."
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
              />
              {/* Items */}
              <div className="cat-items">
                {filtered.map(item => (
                  <div key={item.id} className="cat-item" onClick={() => addItem(item)}>
                    <div className="ci-swatch" style={{ background: item.color }}>
                      <span className="ci-emoji">{item.previewUrl}</span>
                    </div>
                    <div className="ci-info">
                      <div className="ci-name">{item.name}</div>
                      <div className="ci-name-en">{item.nameEn}</div>
                      <div className="ci-tags">
                        {item.tags.slice(0,2).map(t => <span key={t} className="ci-tag">{t}</span>)}
                      </div>
                    </div>
                    <div className="ci-price">{item.price}</div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="cat-empty">ไม่พบไอเทม</div>
                )}
              </div>
            </div>
          )}

          {/* UPLOAD PANEL */}
          {activePanel === 'upload' && (
            <div className="ie-upload">
              <UploadItemPanel onAdd={addUploadedItem} />
            </div>
          )}

          {/* LAYERS PANEL */}
          {activePanel === 'layers' && (
            <div className="ie-layers">
              {editor.state.layers.length === 0
                ? <div className="layers-empty">ยังไม่มี layer<br/>เลือกไอเทมจากแท็บ "ไอเทม"</div>
                : [...editor.state.layers].reverse().map(layer => (
                    <LayerItem
                      key={layer.id}
                      layer={layer}
                      isSelected={layer.id === editor.state.selectedLayerId}
                      onSelect={() => { editor.selectLayer(layer.id); setActivePanel('transform'); }}
                      onToggleVisible={() => editor.toggleVisible(layer.id)}
                      onToggleLock={() => editor.toggleLock(layer.id)}
                      onDelete={() => editor.removeLayer(layer.id)}
                      onRunAI={() => runAIOnLayer(layer.id)}
                    />
                  ))
              }
            </div>
          )}

          {/* TRANSFORM PANEL */}
          {activePanel === 'transform' && (
            <div className="ie-transform">
              {editor.selectedLayer
                ? <TransformPanel
                    transform={editor.selectedLayer.transform}
                    onChange={patch => editor.updateTransform(editor.selectedLayer!.id, patch)}
                  />
                : <div className="layers-empty">เลือก layer ก่อน</div>
              }
            </div>
          )}

          {/* AI Panel */}
          {(tryon.state.status !== 'idle' || hair.state.status !== 'idle') && (
            <div className="ie-ai-section">
              <AIProcessingPanel
                state={activePipeline}
                beforeUrl={editor.state.baseImage ?? undefined}
                onReset={activeReset}
                onDownload={(url: string) => editor.setAIResult(url)}
                label={aiPanel === 'hair' ? 'AI Hair Styling' : 'AI Virtual Try-On'}
              />
            </div>
          )}
        </div>

        {/* CENTER CANVAS */}
        <EditorCanvas
          state={editor.state}
          onSelectLayer={editor.selectLayer}
          onTransformLayer={(id, patch) => editor.updateTransform(id, patch)}
        />

        {/* RIGHT QUICK-AI PANEL */}
        <div className="ie-right">
          <div className="ie-right-title">✦ AI Quick Actions</div>

          {!editor.state.baseImage ? (
            <div className="qai-hint">อัปโหลดรูปก่อน</div>
          ) : (
            <>
              <button className="qai-btn" onClick={handleCameraPhoto}>
                <span>📷</span>
                <span>เปลี่ยนรูปฐาน</span>
              </button>

              <div className="qai-section-label">Virtual Try-On</div>
              {['dress','top','bottom','outerwear'].map(cat => {
                const layer = editor.state.layers.find(l => l.category === cat as LayerCategory);
                return layer ? (
                  <button key={cat} className="qai-btn gold"
                    onClick={() => runAIOnLayer(layer.id)}
                    disabled={tryon.state.status === 'running'}>
                    <span>{CATEGORY_META[cat as LayerCategory].icon}</span>
                    <span>Try-On {layer.name}</span>
                  </button>
                ) : null;
              })}

              <div className="qai-section-label">Hair AI</div>
              {editor.state.layers.filter(l => l.category === 'hair').map(layer => (
                <button key={layer.id} className="qai-btn"
                  onClick={() => runAIOnLayer(layer.id)}
                  disabled={hair.state.status === 'running'}>
                  <span>💇</span>
                  <span>{layer.name}</span>
                </button>
              ))}

              {editor.state.aiResultUrl && (
                <>
                  <div className="qai-divider" />
                  <button className={`qai-btn ${editor.state.showComparison ? 'gold' : ''}`}
                    onClick={editor.toggleComparison}>
                    <span>⇆</span>
                    <span>{editor.state.showComparison ? 'ซ่อนผล AI' : 'แสดงผล AI'}</span>
                  </button>
                  <button className="qai-btn" onClick={exportImage}>
                    <span>↓</span>
                    <span>บันทึกรูป</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
