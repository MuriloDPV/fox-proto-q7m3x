// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Endereço publicado (GitHub Pages + public/CNAME). Sem isso, a imagem do
  // Open Graph sai com caminho relativo e o WhatsApp não mostra a prévia.
  site: 'https://ludwig.athomon.com',

  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      // Qualidade padrão das fotos geradas (webp). Sem isto o sharp usa 80,
      // e recomprimir uma foto que já veio comprimida deixa borrões e
      // "quadradinhos". 90 é quase sem perda visível, com arquivo razoável.
      // smartSubsample: guarda melhor as cores nas bordas (tijolo, flores).
      config: {
        webp: { quality: 90, smartSubsample: true },
      },
    },
  },
});
