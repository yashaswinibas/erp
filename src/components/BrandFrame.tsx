// AGENCYOS_BRAND_DOCS: shows a branded page (quotation / invoice / letter) scaled to fit its box.
import React, { useEffect, useRef, useState } from 'react';
import { brandDocHtml } from '../lib/brandDocs';

export const BrandFrame: React.FC<{ page: string; landscape: boolean }> = ({ page, landscape }) => {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const W = landscape ? 1123 : 794;
  const [scale, setScale] = useState(1);
  const [h, setH] = useState(landscape ? 794 : 1123);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / W));
    fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, [W]);
  const measure = () => { const d = frame.current?.contentDocument; if (d) setH(Math.max(d.body.scrollHeight, landscape ? 790 : 1120)); };
  return (
    <div ref={box} style={{ width: '100%', overflow: 'hidden', height: h * scale }}>
      <iframe ref={frame} title="document" srcDoc={brandDocHtml('Preview', page, landscape)} onLoad={() => { measure(); setTimeout(measure, 300); }}
        style={{ width: W, height: h, border: 0, transform: `scale(${scale})`, transformOrigin: 'top left', background: '#fff', display: 'block' }} />
    </div>
  );
};