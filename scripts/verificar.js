/*
 * Percorre todos os slides de index.html em várias janelas e acusa:
 *   - texto cortado pela borda da janela (o stage escala pela largura e
 *     transborda na vertical em janelas mais largas que 16:9);
 *   - avisos e erros do console (inclui os da LISTA DE ENTREGÁVEIS:
 *     página que transborda, paginação fora da ordem de CAPS);
 *   - requisições com falha (asset ausente depois de mover arquivos).
 *
 * Uso:  node scripts/verificar.js            todas as janelas
 *       SHOTS=1 node scripts/verificar.js    também grava .shots/ em 1920×968
 */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 4740;
// 1920×968 primeiro: a janela maximizada real (barra de tarefas) é mais
// larga que 16:9 e é onde o corte vertical aparece.
const JANELAS = [[1920, 968], [1920, 1080], [1366, 728], [2560, 1330], [1440, 900]];

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch();
  let falhas = 0;

  for (const [w, h] of JANELAS) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const msgs = [];
    page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') msgs.push(m.text()); });
    page.on('pageerror', e => msgs.push('pageerror: ' + e.message));
    page.on('response', r => { if (r.status() >= 400) msgs.push(r.status() + ' ' + r.url()); });

    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#loader.off', { state: 'attached', timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    const total = await page.evaluate(() => document.querySelectorAll('.slide').length);

    const cortados = [];
    for (let i = 0; i < total; i++) {
      if (i > 0) {
        await page.evaluate(n => go(n), i);
        await page.waitForFunction(n => cur === n && !moving, i, { timeout: 5000 });
      }
      await page.waitForTimeout(150);
      // Só elementos com texto próprio: camadas decorativas sangram de propósito
      const n = await page.evaluate(() => [...document.querySelectorAll('.slide.active *')].filter(el => {
        if (![...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim())) return false;
        const r = el.getBoundingClientRect();
        return r.width && (r.top < -1 || r.bottom > innerHeight + 1 || r.left < -1 || r.right > innerWidth + 1);
      }).length);
      if (n) cortados.push(`${i + 1}(${n})`);
      if (process.env.SHOTS && w === 1920 && h === 968) {
        fs.mkdirSync(path.join(ROOT, '.shots'), { recursive: true });
        await page.screenshot({ path: path.join(ROOT, '.shots', 's' + String(i + 1).padStart(2, '0') + '.png') });
      }
    }

    const ok = !cortados.length && !msgs.length;
    if (!ok) falhas++;
    console.log(`${String(w).padStart(4)}×${String(h).padEnd(4)}  ${total} slides  ` +
      `cortados: ${cortados.length ? cortados.join(' ') + ' ⚠' : 'nenhum'}  ` +
      `console/rede: ${msgs.length ? '⚠\n    ' + [...new Set(msgs)].join('\n    ') : 'limpo'}`);
    await page.close();
  }

  await browser.close();
  server.close();
  process.exitCode = falhas ? 1 : 0;
})();
