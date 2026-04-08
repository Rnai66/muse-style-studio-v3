import type { PipelineState } from '@/hooks/useAIPipeline';

interface Props {
  state: PipelineState;
  label?: string;
  beforeUrl?: string;
  onReset: () => void;
  onDownload?: (url: string) => void;
}

function downloadImage(url: string) {
  // For remote URLs, fetch and create a blob URL so download attribute works
  fetch(url)
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `muse-style-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch(() => {
      // Fallback: open in new tab
      window.open(url, '_blank');
    });
}

export default function AIProcessingPanel({ state, label = 'AI Processing', beforeUrl, onReset, onDownload }: Props) {
  const { status, progress, message, resultUrl, error } = state;

  // Don't render anything in idle state
  if (status === 'idle') return null;

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.label}>✦ {label}</span>
        <button style={styles.closeBtn} onClick={onReset} title="ปิด">✕</button>
      </div>

      {/* Progress bar */}
      {status === 'running' && (
        <div style={styles.progressWrap}>
          <div style={{ ...styles.progressBar, width: `${progress}%` }} />
        </div>
      )}

      {/* Status message */}
      {(status === 'running' || (status === 'done' && message)) && (
        <p style={styles.message}>
          {status === 'running' && <span style={styles.spinner} />}
          {message || 'กำลังประมวลผล…'}
          {status === 'running' && ` (${progress}%)`}
        </p>
      )}

      {/* Error */}
      {status === 'error' && error && (
        <div style={styles.errorBox}>
          <span>⚠ {error}</span>
        </div>
      )}

      {/* Before / After comparison */}
      {resultUrl && (
        <div style={styles.comparison}>
          {beforeUrl && (
            <div style={styles.imgWrap}>
              <span style={styles.imgLabel}>Before</span>
              <img src={beforeUrl} alt="before" style={styles.img} />
            </div>
          )}
          <div style={styles.imgWrap}>
            <span style={styles.imgLabel}>After ✦</span>
            <img src={resultUrl} alt="AI result" style={styles.img} />
          </div>
        </div>
      )}

      {/* Actions */}
      {status === 'done' && resultUrl && (
        <div style={styles.actions}>
          <button
            style={styles.downloadBtn}
            onClick={() => {
              if (onDownload) onDownload(resultUrl);
              else downloadImage(resultUrl);
            }}
          >
            ⬇ ดาวน์โหลด
          </button>
          <button style={styles.resetBtn} onClick={onReset}>
            ✕ ล้าง
          </button>
        </div>
      )}

      <style>{`
        @keyframes ai-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ai-fadein {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    background: 'rgba(14, 13, 26, 0.97)',
    border: '1px solid rgba(192, 132, 252, 0.2)',
    borderRadius: '14px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '10px',
    animation: 'ai-fadein 0.3s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#c084fc',
    letterSpacing: '0.05em',
    fontFamily: 'Inter, sans-serif',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.35)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: '2px 6px',
    borderRadius: '6px',
    transition: 'color 0.2s',
  },
  progressWrap: {
    height: '5px',
    background: 'rgba(255,255,255,0.07)',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #7c3aed, #c084fc, #818cf8)',
    borderRadius: '99px',
    transition: 'width 0.5s ease',
  },
  message: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.55)',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    fontFamily: 'Inter, sans-serif',
  },
  spinner: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.12)',
    borderTopColor: '#c084fc',
    animation: 'ai-spin 0.7s linear infinite',
    flexShrink: 0,
  },
  errorBox: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '0.75rem',
    color: '#fca5a5',
    fontFamily: 'Inter, sans-serif',
  },
  comparison: {
    display: 'flex',
    gap: '8px',
  },
  imgWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'center',
  },
  imgLabel: {
    fontSize: '0.63rem',
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontFamily: 'Inter, sans-serif',
  },
  img: {
    width: '100%',
    borderRadius: '10px',
    objectFit: 'cover',
    aspectRatio: '3/4',
    background: 'rgba(255,255,255,0.04)',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  downloadBtn: {
    flex: 1,
    padding: '10px',
    background: 'linear-gradient(135deg, #7c3aed, #c084fc)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.02em',
    transition: 'opacity 0.2s',
  },
  resetBtn: {
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
};
