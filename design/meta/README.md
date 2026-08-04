# Favicon, ícones do site e Open Graph

## Arquivos

| Arquivo | Tamanho | Descrição |
| --- | --- | --- |
| `favicon.svg` | vetor | Cacho colorido, fundo transparente. É o que os navegadores modernos usam. |
| `favicon-16x16.png` | 16 × 16 | Aba do navegador em telas 1× |
| `favicon-32x32.png` | 32 × 32 | Aba em telas 2× e atalho de desktop |
| `apple-touch-icon-180x180.png` | 180 × 180 | Tela de início do iOS. Cacho branco sobre roxo `#681775`, com respiro — o iOS arredonda sozinho, não arredonde no arquivo. |
| `icon-512x512.png` | 512 × 512 | Manifest / PWA / splash do Android |
| `safari-pinned-tab.svg` | vetor | Máscara monocromática do Safari (traçado em preto puro, como a especificação exige) |
| `og-template.html` | 1200 × 630 | Template editável do cartão social |
| `og-padrao.png` | 1200 × 630 | Fallback estático para a home e páginas sem título próprio |

Os PNGs foram rasterizados a partir de `assets/logos/dov-icone-cacho-*.svg`.
Se precisar de um `favicon.ico` multi-resolução (só para IE e alguns leitores
de feed), gere a partir dos PNGs de 16 e 32.

Falta um `site.webmanifest` — depende do nome curto e das cores de tema que o
cliente quiser expor:

```json
{
  "name": "Descubra o Vinho",
  "short_name": "Descubra o Vinho",
  "icons": [
    { "src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#681775",
  "background_color": "#FFFFFF",
  "display": "standalone"
}
```

## Em Next.js (App Router)

A convenção de arquivos resolve quase tudo. Coloque em `app/`:

```
app/
├── favicon.ico          (opcional)
├── icon.svg             ← favicon.svg
├── apple-icon.png       ← apple-touch-icon-180x180.png
└── opengraph-image.png  ← og-padrao.png  (fallback global)
```

O Next gera as tags sozinho. O que sobra vai no `metadata` do layout:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://descubraovinho.com.br"),
  title: {
    default: "Descubra o Vinho",
    template: "%s · Descubra o Vinho",
  },
  description:
    "Um portal para descobrir o universo do vinho sem solenidade: viagens, harmonizações, mercado, ciência e curiosidades.",
  openGraph: { type: "website", locale: "pt_BR", siteName: "Descubra o Vinho" },
  twitter: { card: "summary_large_image" },
  other: { "msapplication-TileColor": "#681775" },
};

export const viewport: Viewport = { themeColor: "#681775" };
```

O `safari-pinned-tab.svg` não tem convenção de arquivo — declare à mão:

```tsx
other: { "mask-icon": "/safari-pinned-tab.svg" }
```

## Open Graph dinâmico

`og-template.html` é a referência visual: fundo marinho, blob menta no canto
inferior direito, logo branco no topo e três slots — editoria, título e
assinatura. Abra no navegador para ver, e leia as notas no rodapé da própria
página.

Para gerar por rota, porte a marcação para `app/**/opengraph-image.tsx` com
`ImageResponse`. Três armadilhas do `next/og`, todas anotadas no template:

1. Não suporta `-webkit-line-clamp` nem `aspect-ratio` — corte o título no
   servidor (90 caracteres) e dê `width`/`height` explícitos ao logo (155 × 72)
   e ao blob (620 × 620).
2. Não lê `@font-face` remoto — carregue Cormorant Garamond 400 e DM Sans
   400/500 como `ArrayBuffer` na opção `fonts`.
3. Só entende um subconjunto de CSS flexbox. Nada de `grid`.

Títulos acima de 90 caracteres usam a classe `og__titulo--longo` (54px em vez
de 68px).
