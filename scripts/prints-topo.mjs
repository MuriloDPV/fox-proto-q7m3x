// Prints e checagens do TOPO (v4.4): 390px e 1440px.
// Usa o servidor de desenvolvimento já rodando (npm run dev, porta 4321).
// Rodar:  node scripts/prints-topo.mjs          (salva em prints/v4.4/)
//
// Para cada tamanho de tela, quatro prints:
//   1-inicio   topo grande, no começo da página
//   2-rolado   topo compacto, depois de rolar
//   3-menu     menu em tela cheia aberto
//   4-sobre-foto  aba com foto no alto (topo claro)
// E confere: nada cortado, nada sobreposto, sem rolagem lateral, botões
// com 44px de toque, e que com "menos movimento" o topo não anima.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4321';
const PASTA = path.resolve('prints', 'v4.4');
const TELAS = [
  { nome: '390', width: 390, height: 844 },
  { nome: '1440', width: 1440, height: 900 },
];

// Mede o topo dentro da página: retângulos das peças e o que estiver errado
function medirTopo() {
  const topo = document.getElementById('topo');
  const r = (el) => el.getBoundingClientRect();
  const pecas = {
    logo: r(topo.querySelector('.topo__logo')),
    nome: r(topo.querySelector('.topo__nome-linha')),
    reservar: r(topo.querySelector('.topo__reservar')),
    menu: r(topo.querySelector('.topo__menu')),
  };
  const problemas = [];
  const largura = document.documentElement.clientWidth;
  for (const [nome, p] of Object.entries(pecas)) {
    if (p.left < 0 || p.right > largura) problemas.push(`${nome} sai da tela (${Math.round(p.left)}–${Math.round(p.right)})`);
  }
  // sobreposição: duas peças com algum pedaço em comum
  const cruza = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  // (o "nome" entra separado: o texto pode vazar da caixa da logo)
  const nomes = ['logo', 'nome', 'reservar', 'menu'];
  for (let i = 0; i < nomes.length; i++)
    for (let j = i + 1; j < nomes.length; j++)
      if (!(nomes[i] === 'logo' && nomes[j] === 'nome') && cruza(pecas[nomes[i]], pecas[nomes[j]])) problemas.push(`${nomes[i]} encosta em ${nomes[j]}`);
  if (pecas.reservar.height < 44) problemas.push(`Reservar com ${pecas.reservar.height}px de altura`);
  if (pecas.menu.height < 44 || pecas.menu.width < 44) problemas.push(`Menu com ${pecas.menu.width}×${pecas.menu.height}px`);
  if (document.documentElement.scrollWidth > largura) problemas.push('rolagem lateral');
  const nomeTexto = topo.querySelector('.topo__nome-linha');
  return {
    altura: Math.round(r(topo).height),
    brasao: Math.round(r(topo.querySelector('.topo__brasao')).height),
    nomePx: Math.round(parseFloat(getComputedStyle(nomeTexto).fontSize) * (pecas.nome.height / nomeTexto.offsetHeight)),
    classes: topo.className,
    problemas,
  };
}

await mkdir(PASTA, { recursive: true });
const navegador = await chromium.launch();
let erros = 0;

for (const tela of TELAS) {
  {
    const contexto = await navegador.newContext({ viewport: tela, deviceScaleFactor: 2 });
    // já "viu" a entrada nesta sessão: só a cascata curta, mais rápida
    await contexto.addInitScript(() => sessionStorage.setItem('ludwig-entrada-vista', '1'));
    const pagina = await contexto.newPage();
    await pagina.goto(BASE, { waitUntil: 'networkidle' });
    await pagina.waitForTimeout(2200);

    const salvar = async (etapa) => {
      const m = await pagina.evaluate(medirTopo);
      const arquivo = `topo-${tela.nome}-${etapa}.png`;
      await pagina.screenshot({ path: path.join(PASTA, arquivo) });
      const ok = m.problemas.length === 0;
      if (!ok) erros++;
      console.log(`${ok ? 'ok ' : 'ERRO'} ${arquivo}  topo ${m.altura}px, brasão ${m.brasao}px, nome ${m.nomePx}px  ${m.problemas.join('; ')}`);
    };

    await salvar('1-inicio');
    // rola um pouco para baixo (topo compacto) e um pouco para cima (ele volta)
    await pagina.mouse.wheel(0, 700);
    await pagina.waitForTimeout(500);
    await pagina.mouse.wheel(0, -120);
    await pagina.waitForTimeout(900);
    await salvar('2-rolado');
    await pagina.click('[data-abrir-menu]');
    await pagina.waitForTimeout(1300);
    await salvar('3-menu');
    // uma aba com foto no alto: topo grande, transparente, versão clara
    await pagina.goto(`${BASE}/#hospedagem`, { waitUntil: 'networkidle' });
    await pagina.waitForTimeout(1500);
    await salvar('4-sobre-foto');
    await contexto.close();
  }
}

// "Menos movimento": o topo não pode animar ao encolher
const calmo = await navegador.newContext({ viewport: TELAS[1], reducedMotion: 'reduce' });
const pagina = await calmo.newPage();
await pagina.goto(BASE, { waitUntil: 'networkidle' });
await pagina.mouse.wheel(0, 700);
await pagina.waitForTimeout(150);
const transicao = await pagina.evaluate(() => {
  const topo = document.getElementById('topo');
  const logo = topo.querySelector('.topo__logo');
  return {
    duracao: [getComputedStyle(topo).transitionDuration, getComputedStyle(logo).transitionDuration],
    compacto: topo.classList.contains('topo--compacto'),
    animando: document.getAnimations().filter((a) => topo.contains(a.effect?.target)).length,
  };
});
const calmoOk = transicao.compacto && transicao.duracao.every((d) => d.split(',').every((s) => parseFloat(s) < 0.001)) && transicao.animando === 0;
if (!calmoOk) erros++;
console.log(`${calmoOk ? 'ok ' : 'ERRO'} menos movimento: compacto=${transicao.compacto}, transição ${transicao.duracao.join(' / ')}`);

await navegador.close();
console.log(erros ? `\n${erros} problema(s)` : '\nTudo certo.');
process.exitCode = erros ? 1 : 0;
