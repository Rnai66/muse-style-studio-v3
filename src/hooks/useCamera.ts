import { useCallback, useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface CapturedImage {
  dataUrl: string;
  base64: string;
  format: string;
}

export function useCamera() {
  const [image, setImage] = useState<CapturedImage | null>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = useCallback(async (source: CameraSource = CameraSource.Photos) => {
    setLoading(true);
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source,
        quality: 85,
        width: 1080,
        correctOrientation: true,
        allowEditing: false,
      });

      const base64 = photo.base64String ?? '';
      const format = photo.format ?? 'jpeg';
      const dataUrl = `data:image/${format};base64,${base64}`;

      const captured: CapturedImage = { dataUrl, base64, format };
      setImage(captured);
      return captured;
    } catch (err: unknown) {
      // user cancelled — ไม่ throw เพื่อไม่ให้ UI พัง
      if ((err as Error)?.message?.includes('cancelled')) return null;
      console.error('Camera error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setImage(null), []);

  return { image, loading, takePhoto, clear };
}
