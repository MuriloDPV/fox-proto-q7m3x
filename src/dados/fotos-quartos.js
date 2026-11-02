// Fotos HD de cada acomodação (saem de scripts/baixar-fotos-quartos.mjs +
// scripts/upscale.mjs). Ficam em src/assets/fotos-hd/quartos/<slug>/01.webp...
// import.meta.glob junta todas de uma vez; aqui só separamos por pasta.
const todas = import.meta.glob('../assets/fotos-hd/quartos/*/*.webp', { eager: true, import: 'default' });

export function fotosDoQuarto(slug) {
  return Object.keys(todas)
    .filter((caminho) => caminho.includes(`/quartos/${slug}/`))
    .sort() // 01.webp, 02.webp... na ordem do motor de reservas
    .map((caminho) => todas[caminho]);
}
