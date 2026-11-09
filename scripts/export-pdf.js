/*
 * Exporta o deck (index.html) para PDF — uma página 16:9 por slide.
 *
 * Uso:
 *   npm install
 *   node scripts/export-pdf.js [saida.pdf]      (npm run pdf -- NOME-v2.pdf)
 *
 * Variáveis de ambiente:
 *   SCALE=2      resolução da captura (1 = 1920×1080, 2 = 3840×2160). Padrão 2.
 *   Q=85         qualidade JPEG de cada página. Padrão 85.
 *   GOVERNO=on   força a marca do Governo (equivale a ?governo=on). Sem ela,
 *                vale MOSTRAR_MARCA_GOVERNO do index.html.
 *   DUMP=dir     grava também o JPEG de cada página nessa pasta.
 *
 * Cada slide é capturado como imagem, no estado final: reveal concluído,
 * contadores e barras no valor final, vídeos parados num quadro fixo. O
 * texto do PDF não é selecionável — é o preço de preservar grão,
 * gradientes e vídeo exatamente como na tela.
 */
const { chromium } = require('playwright');
const { PDFDocument } = require('pdf-lib');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const W = 1920, H = 1080;
const SCALE = parseFloat(process.env.SCALE || '2');
const QUALITY = parseInt(process.env.Q || '85', 10);
const OUT = process.argv[2] || path.join(ROOT, 'deck.pdf');
const PORT = 4741;
// Instante (s) em que cada vídeo de fundo é congelado para a captura
const VIDEO_T = 1.5;

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });

  const qs = process.env.GOVERNO ? '?governo=' + process.env.GOVERNO : '';
  await page.goto(`http://localhost:${PORT}/index.html${qs}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#loader.off', { state: 'attached', timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);

  // Chrome de apresentação não entra no PDF
  await page.addStyleTag({ content: `
    #loader, .ctrl, .hud, .progress, .idx, .lb, .dw, .dw-back { display: none !important; }
    html, body { cursor: none !important; }
  ` });
  await page.mouse.move(W / 2, 10);

  const total = await page.evaluate(() => document.querySelectorAll('.slide').length);
  const META = await page.evaluate(() => ({
    titulo: document.title,
    assunto: document.querySelector('meta[name="description"]')?.content || ''
  }));

  const shots = [];
  for (let i = 0; i < total; i++) {
    if (i > 0) {
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(n => {
        const s = document.querySelectorAll('.slide')[n];
        return s.classList.contains('active') && !s.classList.contains('s-enter');
      }, i, { timeout: 5000 });
    }

    // Vídeo do slide: espera ter quadro real e congela num instante fixo
    const temVideo = await page.evaluate(() => !!document.querySelector('.slide.active .slide-video'));
    if (temVideo) {
      await page.waitForFunction(() => {
        const v = document.querySelector('.slide.active .slide-video');
        return v.classList.contains('is-playing') && v.readyState >= 3;
      }, null, { timeout: 15000 });
      await page.evaluate(t => new Promise(res => {
        const v = document.querySelector('.slide.active .slide-video');
        v.pause();
        v.addEventListener('seeked', () => res(), { once: true });
        v.currentTime = Math.min(t, (v.duration || t) - 0.05);
      }), VIDEO_T);
    }

    // Reveal CSS + barras e contadores (o contador leva 320 + 1000 ms)
    await page.evaluate(() => Promise.all(document.getAnimations()
      .filter(a => a.effect && a.effect.getComputedTiming().iterations !== Infinity)
      .map(a => a.finished.catch(() => {}))));
    await page.waitForTimeout(1800);

    const buf = await page.screenshot({ type: 'jpeg', quality: QUALITY });
    shots.push(buf);
    if (process.env.DUMP) {
      fs.mkdirSync(process.env.DUMP, { recursive: true });
      fs.writeFileSync(path.join(process.env.DUMP, 'pg' + String(i + 1).padStart(2, '0') + '.jpg'), buf);
    }
    console.log(`slide ${String(i + 1).padStart(2)}/${total}${temVideo ? ' (vídeo)' : ''}  ${(buf.length / 1024).toFixed(0)} KB`);
  }

  await browser.close();
  server.close();

  // 960×540 pt = 13,333 × 7,5 pol, o formato widescreen padrão de slides
  const PW = 960, PH = 540;
  const pdf = await PDFDocument.create();
  // Título e assunto vêm do próprio deck (<title> e <meta name="description">)
  pdf.setTitle(META.titulo);
  if (META.assunto) pdf.setSubject(META.assunto);
  pdf.setAuthor('ZPE Maranhão');
  pdf.setLanguage('pt-BR');
  pdf.setCreator('scripts/export-pdf.js');
  for (const buf of shots) {
    const img = await pdf.embedJpg(buf);
    pdf.addPage([PW, PH]).drawImage(img, { x: 0, y: 0, width: PW, height: PH });
  }
  fs.writeFileSync(OUT, await pdf.save());

  console.log(errs.length ? 'ERROS:\n  ' + errs.join('\n  ') : 'sem erros');
  console.log(`OUT ${OUT}  ${shots.length} páginas  ${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)} MB`);
})();
