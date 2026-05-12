import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLang } from '../../i18n.js';
import { useToast } from '../../Toast.jsx';
import { fileToSquareDataUrl } from '../../imageUtils.js';

// Robust camera flow:
//  1. Try getUserMedia with a facingMode preference to grant permission.
//  2. Once permission is given, enumerateDevices() exposes real deviceId+label
//     for each camera. Cycle through them via the flip button.
//  3. If anything fails, surface the exact error and keep the gallery fallback.
export default function PhotoCaptureModal({ onCapture, onClose, size = 1080, quality = 0.85 }) {
  const { t } = useLang();
  const toast = useToast();
  const videoRef = useRef(null);
  const fileRef  = useRef(null);
  const streamRef = useRef(null);

  const [cameras, setCameras] = useState([]);      // VideoInputDevice[]
  const [camIdx, setCamIdx]   = useState(0);
  const [streamLive, setStreamLive] = useState(false);
  const [starting, setStarting] = useState(true);
  const [error, setError]   = useState(null);
  const [busy, setBusy]     = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setStreamLive(false);
  }, []);

  const startCamera = useCallback(async (preferredIdx = null) => {
    setError(null);
    setStarting(true);
    stopStream();

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t('photo.err_unsupported'));
      setStarting(false);
      return;
    }

    try {
      let constraints;
      // If we already know the camera list, target a specific device by ID
      if (cameras.length && preferredIdx != null && cameras[preferredIdx]) {
        constraints = { video: { deviceId: { exact: cameras[preferredIdx].deviceId } }, audio: false };
      } else {
        // First boot — let the browser pick a back-facing camera if possible
        constraints = { video: { facingMode: 'environment' }, audio: false };
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e1) {
        // Some Android browsers reject 'environment' on a single-camera device;
        // retry with a permissive default before giving up.
        try { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); }
        catch (e2) { throw e1; }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch { /* iOS may need a tap */ }
      }
      setStreamLive(true);

      // Now that permission is granted, labels are populated
      const list = await navigator.mediaDevices.enumerateDevices().catch(() => []);
      const cams = list.filter(d => d.kind === 'videoinput');
      setCameras(cams);

      // Try to align camIdx with the actually-running device
      if (cams.length > 0) {
        const liveId = stream.getVideoTracks()[0]?.getSettings?.().deviceId;
        if (liveId) {
          const i = cams.findIndex(c => c.deviceId === liveId);
          if (i >= 0) setCamIdx(i);
        } else if (preferredIdx != null) {
          setCamIdx(preferredIdx);
        }
      }
    } catch (e) {
      console.error('[PhotoCapture]', e);
      const name = e?.name || '';
      let msg = e?.message || String(e);
      if (name === 'NotAllowedError')       msg = t('photo.err_denied');
      else if (name === 'NotFoundError')    msg = t('photo.err_no_camera');
      else if (name === 'NotReadableError') msg = t('photo.err_in_use');
      setError(msg);
    } finally {
      setStarting(false);
    }
  }, [cameras, stopStream, t]);

  // Boot on mount
  useEffect(() => {
    startCamera(null);
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flipCamera = () => {
    if (cameras.length < 2) return;
    const next = (camIdx + 1) % cameras.length;
    setCamIdx(next);
    startCamera(next);
  };

  const shoot = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth || !streamRef.current) return;
    setBusy(true);
    try {
      const side = Math.min(v.videoWidth, v.videoHeight);
      const sx = (v.videoWidth - side) / 2;
      const sy = (v.videoHeight - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(v, sx, sy, side, side, 0, 0, size, size);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      stopStream();
      onCapture?.(dataUrl);
      onClose?.();
    } catch (e) {
      console.error(e);
      toast.error(t('app.error_create'));
      setBusy(false);
    }
  };

  const pickFile = async e => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusy(true);
    try {
      const dataUrl = await fileToSquareDataUrl(f, size, quality);
      stopStream();
      onCapture?.(dataUrl);
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error(t('app.error_create'));
      setBusy(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.92)', zIndex:140,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }}>
      <div onClick={e => e.stopPropagation()} className="bIn" style={{
        width:'100%', maxWidth:520,
        background:'var(--surf)', border:'1px solid var(--brd)', borderRadius:18,
        boxShadow:'0 24px 64px rgba(0,0,0,.6)',
        display:'flex', flexDirection:'column', maxHeight:'calc(100dvh - 32px)',
        minHeight: 0,
      }}>
        {/* Header */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'14px 18px', borderBottom:'1px solid var(--brd)', flexShrink:0}}>
          <div style={{fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700}}>
            📸 {t('photo.title')}
          </div>
          <button onClick={onClose} style={{
            background:'transparent', border:'1px solid var(--brd)', borderRadius:10,
            color:'var(--dim)', padding:'5px 11px', cursor:'pointer',
            fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:600,
          }}>✕</button>
        </div>

        {/* Preview area */}
        <div style={{padding:'14px 16px 8px', flex:'1 1 auto', minHeight:0, display:'flex', justifyContent:'center'}}>
          <div style={{
            position:'relative',
            width:'100%',
            aspectRatio:'1/1',
            borderRadius:14, overflow:'hidden',
            background:'#0a0913', border:'1px solid var(--brd)',
            maxWidth: 'min(100%, calc(100dvh - 240px))',
          }}>
            <video
              ref={videoRef} autoPlay playsInline muted
              style={{
                width:'100%', height:'100%', objectFit:'cover',
                display: streamLive ? 'block' : 'none',
                // Mirror only when the active device looks like a front camera
                transform: cameras[camIdx]?.label?.toLowerCase().includes('front')
                  ? 'scaleX(-1)' : 'none',
              }}
            />
            {!streamLive && (
              <div style={{
                position:'absolute', inset:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                flexDirection:'column', gap:10, color:'var(--dim)', textAlign:'center', padding:24,
              }}>
                {starting ? (
                  <>
                    <div style={{fontSize:36}}>🎥</div>
                    <div style={{fontSize:11, letterSpacing:2, color:'var(--mut)'}}>{t('photo.starting')}</div>
                  </>
                ) : error ? (
                  <>
                    <div style={{fontSize:36}}>📵</div>
                    <div style={{fontSize:13, color:'var(--red)', maxWidth:280, lineHeight:1.4}}>{error}</div>
                    <button onClick={() => startCamera(null)} style={{
                      marginTop:8, padding:'7px 14px', borderRadius:10,
                      background:'var(--gold)22', border:'1px solid var(--gold)44',
                      color:'var(--gold)', cursor:'pointer',
                      fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700,
                    }}>{t('photo.retry')}</button>
                  </>
                ) : null}
              </div>
            )}
            {/* Camera index pill — shown when ≥2 cameras */}
            {cameras.length >= 2 && streamLive && (
              <div style={{
                position:'absolute', top:8, right:8,
                padding:'3px 8px', borderRadius:12, background:'rgba(0,0,0,.55)',
                color:'#fff', fontSize:10, fontWeight:700, letterSpacing:1,
                fontFamily:"'Syne',sans-serif",
              }}>
                CAM {camIdx + 1}/{cameras.length}
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} style={{display:'none'}}/>
        </div>

        {/* Sticky action bar */}
        <div style={{
          padding:'10px 14px 14px', borderTop:'1px solid var(--brd)',
          background:'var(--surf)', flexShrink:0,
          display:'flex', flexDirection:'column', gap:8,
        }}>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <button onClick={flipCamera} disabled={cameras.length < 2 || !streamLive}
              title={t('photo.flip')}
              style={{
                width:48, height:48, borderRadius:'50%', flexShrink:0,
                background:'var(--card)', border:'1px solid var(--brd)',
                color: cameras.length >= 2 ? 'var(--gold)' : 'var(--mut)',
                cursor: cameras.length >= 2 && streamLive ? 'pointer' : 'not-allowed',
                fontSize:20, opacity: cameras.length >= 2 && streamLive ? 1 : .35,
              }}>🔄</button>

            <button onClick={shoot} disabled={!streamLive || busy}
              style={{
                flex:1, height:56, borderRadius:14, border:'none',
                background: streamLive ? 'var(--gold)' : 'var(--mut)44',
                color: streamLive ? '#07060f' : 'var(--dim)',
                fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800,
                cursor: streamLive && !busy ? 'pointer' : 'not-allowed',
                boxShadow: streamLive ? '0 4px 16px var(--glow)' : 'none',
                letterSpacing:1,
              }}>
              📷 {t('photo.shoot')}
            </button>

            <button onClick={() => fileRef.current?.click()} disabled={busy} title={t('photo.gallery')} style={{
              width:48, height:48, borderRadius:'50%', flexShrink:0,
              background:'var(--card)', border:'1px solid var(--brd)',
              color:'var(--gold)', cursor:'pointer', fontSize:20,
            }}>🖼</button>
          </div>

          <div style={{fontSize:10, color:'var(--mut)', textAlign:'center', letterSpacing:1, minHeight:14}}>
            {error
              ? t('photo.hint_file')
              : streamLive
                ? t('photo.hint')
                : starting ? ' ' : t('photo.hint_file')}
          </div>
        </div>
      </div>
    </div>
  );
}
