// AGENCYOS_V2_PART17: official Priority Ads Agency letterhead used on every printed letter / PDF.
export const LETTERHEAD_URL = '/letterhead.webp';
export const LH_CSS = `
@page{size:A4;margin:0}
html,body{margin:0!important;padding:0!important;background:#fff}
body.lh{-webkit-print-color-adjust:exact;print-color-adjust:exact}
.lh-bg{position:fixed;top:0;left:0;width:210mm;height:297mm;z-index:0}
table.lh-tbl{position:relative;z-index:1;width:210mm;border-collapse:collapse;border:0!important;margin:0!important}
table.lh-tbl>thead>tr>td,table.lh-tbl>tfoot>tr>td,table.lh-tbl>tbody>tr>td{border:0!important;padding:0!important;background:none!important}
.lh-top{height:46mm}.lh-bot{height:34mm}
table.lh-tbl>tbody>tr>td.lh-body{padding:0 18mm!important;vertical-align:top}
.lh-gst{text-align:right;font-size:10.5px;color:#475569;margin:-4px 0 8px}
@media screen{body.lh{width:210mm;margin:0 auto!important;position:relative;box-shadow:0 0 12px rgba(0,0,0,.15)}.lh-bg{position:absolute}}
.lh .slip{border:0!important;border-radius:0!important;max-width:none}
.lh .slip .top{background:none!important;color:#0f172a!important;padding:0 0 10px!important;border-bottom:2px solid #0050C8}
.lh .slip .brand{display:none!important}.lh .slip .ttl{text-align:left}.lh .slip .ttl .p,.lh .slip .ttl .n{color:#475569!important}
.lh .slip .sec{padding:14px 0!important}.lh .slip .foot{background:none!important;padding:10px 0!important}
`;
export const wrapLetterhead = (inner: string) => {
  const src = (typeof location !== 'undefined' ? location.origin : '') + LETTERHEAD_URL;
  return `<img class="lh-bg" src="${src}" alt=""><table class="lh-tbl"><thead><tr><td><div class="lh-top"></div></td></tr></thead><tbody><tr><td class="lh-body">${inner}</td></tr></tbody><tfoot><tr><td><div class="lh-bot"></div></td></tr></tfoot></table>`;
};
