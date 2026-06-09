'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function QRCodeModal({
  open,
  onOpenChange,
  url,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (open && url) {
      QRCode.toDataURL(url, { width: 256, margin: 2, color: { dark: '#6C63FF', light: '#13131A' } }).then(
        setQrDataUrl,
      );
    }
  }, [open, url]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-lg" />
        )}
        <p className="break-all text-xs text-muted-foreground">{url}</p>
      </DialogContent>
    </Dialog>
  );
}
