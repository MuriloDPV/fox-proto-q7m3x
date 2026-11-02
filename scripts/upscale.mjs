// UPSCALE DAS FOTOS COM REAL-ESRGAN
// As fotos do site atual têm no máximo ~620 px de largura. Esticadas na
// tela, ficam borradas. O Real-ESRGAN é uma rede neural que "redesenha" a
// foto 4× maior, inventando detalhes plausíveis (bordas, texturas).
//
// Passo a passo, para cada pasta de fotos:
//   1. roda o realesrgan-ncnn-vulkan.exe (modelo realesrgan-x4plus) na
//      pasta inteira: o modelo é carregado uma vez só (bem mais rápido);
//   2. reduz o resultado de 4× para 2× o tamanho original com o sharp.
//      Reduzir esconde boa parte dos exageros da rede e o arquivo fica menor;
//   3. salva em src/assets/fotos-hd/... como webp de qualidade 95.
// Pula as fotos que já existem no destino (dá para parar e continuar).
//
// O executável fica em ferramentas/realesrgan/ (baixado das releases do
// GitHub xinntao/Real-ESRGAN; não vai para o site).
// Rodar:  node scripts/upscale.mjs                (tudo)
//         node scripts/upscale.mjs quartos/suite-espanha   (só uma pasta)
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readdir, rm, access } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const rodar = promisify(execFile);
const EXE = path.resolve('ferramentas/realesrgan/realesrgan-ncnn-vulkan.exe');
const ORIGEM = path.resolve('fotos-originais');
const DESTINO = path.resolve('src/assets/fotos-hd');
const TEMP = path.resolve('ferramentas/tmp-x4');
const EXTENSOES = /\.(png|jpe?g|webp)$/i;

const existe = (p) => access(p).then(() => true, () => false);

// Pastas a processar (relativas a fotos-originais/)
async function listarPastas() {
  const pedidas = process.argv.slice(2);
  if (pedidas.length) return pedidas;
  const quartos = (await readdir(path.join(ORIGEM, 'quartos'), { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => `quartos/${d.name}`);
  return ['galeria/estrutura', 'galeria/cafe', 'galeria/piscina', 'galeria/extras', ...quartos];
}

for (const pasta of await listarPastas()) {
  const entrada = path.join(ORIGEM, pasta);
  if (!(await existe(entrada))) continue;
  const saida = path.join(DESTINO, pasta);
  await mkdir(saida, { recursive: true });

  // só as fotos que ainda não têm versão HD
  const fotos = [];
  for (const arq of (await readdir(entrada)).filter((a) => EXTENSOES.test(a))) {
    const nomeHd = arq.replace(EXTENSOES, '.webp');
    if (!(await existe(path.join(saida, nomeHd)))) fotos.push(arq);
  }
  if (!fotos.length) continue;

  // o executável trabalha com pastas: copia as pendentes para uma temporária
  const tmpEntrada = path.join(TEMP, 'entrada');
  const tmpSaida = path.join(TEMP, 'saida');
  await rm(TEMP, { recursive: true, force: true });
  await mkdir(tmpEntrada, { recursive: true });
  await mkdir(tmpSaida, { recursive: true });
  for (const arq of fotos) {
    // grava como PNG (sem perda) para o executável ler qualquer formato
    await sharp(path.join(entrada, arq)).png().toFile(path.join(tmpEntrada, arq.replace(EXTENSOES, '.png')));
  }

  // -n modelo  -s escala  -f formato de saída  -g 0 = primeira placa de vídeo
  await rodar(EXE, ['-i', tmpEntrada, '-o', tmpSaida, '-n', 'realesrgan-x4plus', '-s', '4', '-f', 'png'], {
    maxBuffer: 64 * 1024 * 1024,
  });

  for (const arq of fotos) {
    const png = arq.replace(EXTENSOES, '.png');
    const { width, height } = await sharp(path.join(entrada, arq)).metadata();
    await sharp(path.join(tmpSaida, png))
      .resize(width * 2, height * 2, { kernel: 'lanczos3' }) // 4× → 2×
      .webp({ quality: 95 })
      .toFile(path.join(saida, arq.replace(EXTENSOES, '.webp')));
  }
  console.log(`${pasta}: ${fotos.length} fotos`);
}

await rm(TEMP, { recursive: true, force: true });
console.log('pronto');
