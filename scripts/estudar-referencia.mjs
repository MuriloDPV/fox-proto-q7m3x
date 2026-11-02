// Estuda a referência: prints em 1440 e 390, rolando a página e abrindo o menu.
import { chromium } from 'playwright';
const SAIDA = process.argv[2];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const info = {};
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto('https://tengilemalamala.com/', { waitUntil: 'networkidle', timeout: 90000 }).catch(e => console.log('goto', e.message));
  await espera(5000);
  await page.screenshot({ path: `${SAIDA}/${w}-00-topo.png` });
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  info[w] = { total };
  let n = 1;
  for (let y = h; y < total && n < 14; y += Math.round(h * 0.9)) {
    await page.mouse.wheel(0, Math.round(h * 0.9));
    await espera(1400);
    await page.screenshot({ path: `${SAIDA}/${w}-${String(n).padStart(2, '0')}-rolagem.png` });
    n++;
  }
  // Tipografia e cores dominantes
  info[w].estilos = await page.evaluate(() => {
    const pega = (el) => { const s = getComputedStyle(el); return { tag: el.tagName, txt: el.textContent.trim().slice(0, 40), font: s.fontFamily.slice(0, 60), size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing, tt: s.textTransform, color: s.color }; };
    const els = [...document.querySelectorAll('h1,h2,h3,p,a,span,li,button')].filter(e => e.offsetParent && e.textContent.trim().length > 2);
    const vistos = new Set(); const out = [];
    for (const e of els) { const p = pega(e); const k = p.font + p.size + p.weight + p.tt; if (!vistos.has(k)) { vistos.add(k); out.push(p); } if (out.length > 30) break; }
    return { body: getComputedStyle(document.body).backgroundColor, bodyColor: getComputedStyle(document.body).color, tipos: out };
  });
  // Menu
  await page.evaluate(() => window.scrollTo(0, 0)); await espera(1500);
  const botao = page.locator('button, a').filter({ hasText: /^\s*menu\s*$/i }).first();
  if (await botao.count()) {
    await botao.click().catch(e => console.log('menu click', e.message));
    await espera(2000);
    await page.screenshot({ path: `${SAIDA}/${w}-menu-aberto.png` });
    const links = page.locator('nav a, [class*=menu] a');
    const c = await links.count();
    for (let i = 0; i < Math.min(c, 40); i++) { const l = links.nth(i); if (await l.isVisible()) { await l.hover().catch(()=>{}); await espera(900); await page.screenshot({ path: `${SAIDA}/${w}-menu-hover.png` }); break; } }
  } else console.log('sem botão menu', w);
  await page.close();
}
console.log(JSON.stringify(info, null, 1));
await browser.close();
