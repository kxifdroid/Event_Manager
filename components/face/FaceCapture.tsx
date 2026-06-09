'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

/**
 * Client-side face descriptor extraction using face-api.js.
 * Models loaded from CDN on first use.
 */
export function FaceCapture({ onSaved }: { onSaved?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const loadModels = async () => {
    const faceapi = await import('face-api.js');
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    return faceapi;
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const faceapi = await loadModels();
      const img = await faceapi.bufferToImage(file);
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast({ title: 'No face detected', description: 'Please upload a clear selfie.', variant: 'destructive' });
        return;
      }

      const descriptor = Array.from(detection.descriptor);

      const res = await fetch('/api/ai/face-match', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faceDescriptor: descriptor }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      toast({ title: 'Face profile saved', description: 'You can now find your photos.' });
      onSaved?.();
    } catch (err) {
      console.error('Face capture error:', err);
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <h3 className="mb-2 font-heading text-lg font-semibold">Find My Photos</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Upload a selfie to enable facial recognition. We extract a 128-point face descriptor locally in your browser.
      </p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <Button onClick={() => inputRef.current?.click()} disabled={loading}>
        {loading ? 'Processing...' : 'Upload Selfie'}
      </Button>
    </div>
  );
}
