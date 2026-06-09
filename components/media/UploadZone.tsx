'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Upload, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

type FilePreview = {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};

const ACCEPTED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
};

export function UploadZone({ albumId, eventId }: { albumId: string; eventId: string }) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const previews = accepted.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...previews]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: 100 * 1024 * 1024,
    onDropRejected: () => toast({ title: 'Invalid file', description: 'Max 100MB. JPG, PNG, GIF, MP4, MOV only.', variant: 'destructive' }),
  });

  const removeFile = (index: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadFile = async (fp: FilePreview, index: number) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, status: 'uploading', progress: 10 } : f)));

    const formData = new FormData();
    formData.append('file', fp.file);
    formData.append('albumId', albumId);
    formData.append('eventId', eventId);

    try {
      const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
      const json = await res.json();

      if (json.status === 409) {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, status: 'error', error: 'Duplicate detected (>90% similar)', progress: 100 } : f,
          ),
        );
        return;
      }

      if (json.error) throw new Error(json.error);

      setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, status: 'done', progress: 100 } : f)));
    } catch (err) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'error', error: (err as Error).message, progress: 0 } : f,
        ),
      );
    }
  };

  const handleUploadAll = async () => {
    setUploading(true);
    const pending = files.map((f, i) => ({ f, i })).filter(({ f }) => f.status === 'pending');
    await Promise.all(pending.map(({ f, i }) => uploadFile(f, i)));
    setUploading(false);
    toast({ title: 'Upload complete' });
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 p-12 transition-colors',
          isDragActive && 'border-accent bg-accent/5',
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop photos/videos here, or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, GIF, MP4, MOV — max 100MB</p>
      </div>

      {files.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {files.map((fp, index) => (
              <div key={index} className="relative overflow-hidden rounded-lg bg-white/5">
                {fp.file.type.startsWith('image/') ? (
                  <div className="relative aspect-square">
                    <Image src={fp.preview} alt="" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center text-xs">Video</div>
                )}
                <button
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </button>
                {fp.status === 'uploading' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                    <div className="h-full bg-accent transition-all" style={{ width: `${fp.progress}%` }} />
                  </div>
                )}
                {fp.status === 'error' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-2 text-center text-xs text-coral">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {fp.error}
                  </div>
                )}
                {fp.status === 'done' && (
                  <div className="absolute bottom-1 left-1 rounded bg-green-500/80 px-1 text-xs">Done</div>
                )}
              </div>
            ))}
          </div>
          <Button onClick={handleUploadAll} disabled={uploading || !files.some((f) => f.status === 'pending')}>
            {uploading ? 'Uploading...' : `Upload ${files.filter((f) => f.status === 'pending').length} files`}
          </Button>
        </>
      )}
    </div>
  );
}
