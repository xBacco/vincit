// Client-side image resize before upload. Returns a JPEG data URL when the
// browser can decode the source, otherwise returns the raw data URL so the
// server (Cloudinary) can do the transcoding — useful for iPhone HEIC files
// that some Safari versions can\'t draw to a canvas.
//
// size = side length of the square crop (default 512px).
// quality = JPEG compression (0..1).
export async function fileToSquareDataUrl(file, size = 512, quality = 0.85) {
  if (!file) throw new Error('not_an_image');
  const name = (file.name || '').toLowerCase();
  const isHeic = /\.(heic|heif)$/.test(name)
              || /heic|heif/i.test(file.type || '');
  // Accept files even if file.type is empty (some Android browsers) as long
  // as the extension or HEIC hint says it\'s an image.
  if (!isHeic && file.type && !file.type.startsWith('image/'))
    throw new Error('not_an_image');

  if (file.size > 20 * 1024 * 1024) throw new Error('file_too_large');

  const rawDataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result);
    r.onerror = () => reject(new Error('read_failed'));
    r.readAsDataURL(file);
  });

  // Try to decode + resize client-side. If the browser can\'t decode the
  // format (typical HEIC on older Safari), fall back to the raw upload.
  let img;
  try {
    img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload  = () => (i.naturalWidth && i.naturalHeight) ? resolve(i) : reject(new Error('decode_failed'));
      i.onerror = () => reject(new Error('decode_failed'));
      i.src = rawDataUrl;
    });
  } catch (e) {
    if (isHeic) return rawDataUrl;  // let Cloudinary handle HEIC server-side
    throw e;
  }

  // Center-crop to a square
  const side  = Math.min(img.width, img.height);
  const sx    = (img.width  - side) / 2;
  const sy    = (img.height - side) / 2;

  const canvas  = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

  return canvas.toDataURL('image/jpeg', quality);
}
