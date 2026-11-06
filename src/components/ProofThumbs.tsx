// Shows uploaded proof files (bill photos / PDFs) as small thumbnails. Click to open full size.
import React, { useEffect, useState } from 'react';
import { FileText, ImageOff } from 'lucide-react';
import { StoredFile } from '../lib/hrTypes';
import { getFile, openStoredFile } from '../lib/fileStore';

const Thumb: React.FC<{ f: StoredFile; size: number }> = ({ f, size }) => {
  const [url, setUrl] = useState<string>('');
  const [missing, setMissing] = useState(false);
  const isImg = (f.mimeType || '').startsWith('image/');
  useEffect(() => {
    let u = '';
    if (!isImg) return;
    getFile(f.fileId).then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u); } else setMissing(true); }).catch(() => setMissing(true));
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [f.fileId, isImg]);
  return (
    <button type="button" title={`Open ${f.fileName}`} onClick={() => openStoredFile(f)}
      className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 shrink-0"
      style={{ width: size, height: size }}>
      {isImg && url ? <img src={url} alt={f.fileName} className="w-full h-full object-cover" />
        : missing ? <ImageOff className="w-4 h-4 text-slate-400" />
        : <FileText className="w-5 h-5 text-rose-500" />}
    </button>
  );
};

export const ProofThumbs: React.FC<{ files?: StoredFile[]; size?: number; showNames?: boolean }> = ({ files, size = 44, showNames = true }) => {
  if (!files || files.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      {files.map((f) => (
        <div key={f.fileId} className="flex items-center gap-1.5">
          <Thumb f={f} size={size} />
          {showNames && files.length === 1 && <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono truncate max-w-[180px]">{f.fileName}</span>}
        </div>
      ))}
    </div>
  );
};
