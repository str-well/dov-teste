# Descubra o Vinho — pacote de exportação para Next.js

HTML e CSS estáticos, sem framework e sem build. Cada tela abre direto no
navegador. A fidelidade visual é a prioridade: nada aqui foi “melhorado” em
relação às pranchas aprovadas — o que eu ajustaria está listado em
[Observações](#observações), no fim, sem ter sido aplicado.

```
export-nextjs/
├── dov-tokens.css                  ← fonte única de cores, tipografia, espaço e movimento
├── telas/                          ← 17 telas: cada .html com o seu .css
├── assets/
│   ├── logos/                      ← 7 SVGs, sem width/height
│   ├── blobs/                      ← 3 SVGs
│   └── icones/                     ← 15 SVGs, stroke currentColor
├── meta/                           ← favicons, ícones do site e template de Open Graph
├── ESPECIFICACAO-DE-INTERACAO.md   ← o que os mockups não mostram
└── index.html                      ← sumário navegável das 17 telas
```

---

## 1. Tokens

`dov-tokens.css` — tudo em custom properties com prefixo `--dov-`, nomes em
português. Contém, em 17 blocos numerados: cores da marca e papéis semânticos,
três rampas tonais de 100 a 900, famílias e pesos, escala tipográfica completa
desktop **e** mobile (tamanho + altura de linha por papel), tracking, escala de
espaçamento, grade, alturas de componente, raios, sombras, foco, movimento,
camadas e opacidade dos blobs.

No fim do arquivo há um reset mínimo e a base de `body`, títulos, links, foco e
`::selection`. **Em Next.js, mova esse trecho final para o `globals.css`** e
importe só o bloco `:root` no layout.

Os arquivos das telas trazem `@import url("../dov-tokens.css")` na primeira
linha, o que serve ao preview estático mas é ruim em produção (uma requisição
em cascata). No Next.js, importe uma vez no layout:

```tsx
// app/layout.tsx
import "@/styles/dov-tokens.css";
```

## 2. Telas

17 arquivos, nomeados como as pranchas. Cada `NN-nome.html` tem o seu
`NN-nome.css` ao lado.

| # | Arquivo | Prancha |
| --- | --- | --- |
| 00 | `00-fundamentos-componentes` | Folha de fundamentos e componentes (referência, não é rota) |
| 01 / 02 | `01-home-desktop` · `02-home-mobile` | Home |
| 03 / 04 | `03-categoria-desktop` · `04-categoria-mobile` | Arquivo de categoria |
| 05 / 06 | `05-materia-desktop` · `06-materia-mobile` | Matéria / post |
| 07 / 08 | `07-almanaque-indice-desktop` · `08-almanaque-indice-mobile` | Almanaque A–Z |
| 09 / 10 | `09-verbete-desktop` · `10-verbete-mobile` | Almanaque — verbete |
| 11 / 12 | `11-quem-somos-desktop` · `12-quem-somos-mobile` | Quem Somos |
| 13 / 14 | `13-busca-desktop` · `14-busca-mobile` | Resultados de busca |
| 15 | `15-busca-sem-resultados-mobile` | Busca vazia |
| 16 | `16-404-mobile` | 404 |

**Cada par desktop/mobile é uma única rota.** Foram entregues separados porque
as pranchas são separadas; ao portar, junte cada par em um componente
responsivo. Os arquivos desktop foram escritos para **≥ 1280px** e os mobile
para **≤ 767px**; a faixa 768–1024 não tem prancha e deve ser derivada dos
tokens de tablet (`--dov-margem-tablet: 48px`, `--dov-gutter-tablet: 24px`,
cartões em 2 colunas, menu em hambúrguer a partir de 1024).

Convenções da marcação:

- HTML semântico: `header`, `nav`, `main`, `article`, `aside`, `footer`,
  `figure`/`figcaption`, listas de verdade em toda listagem, `<time datetime>`
  em toda data.
- Classes descritivas em português, no padrão bloco / `bloco__elemento` /
  `bloco--modificador`. São estáveis: pode mapeá-las 1:1 para CSS Modules.
- Estado atual sempre por atributo (`aria-current`), nunca só por classe.
- `.visualmente-oculto` é o utilitário de rótulo para leitor de tela.
- Os ícones estão **inline** no HTML (para o preview funcionar offline e para
  herdarem `currentColor`) **e** como arquivos separados em `assets/icones/`.
  Em React, vire um componente `<Icone nome="busca" />`.

### Imagens

Não há fotografia no pacote. Todo espaço de imagem é um
`<div class="marcador marcador--3x2">` com a proporção anotada e
`aria-hidden="true"`. Troque cada um por `next/image` com a proporção indicada
— a tabela de tamanhos e pesos-alvo está na tela 00 e na `.marcador`
correspondente.

A moldura de fotografia (`.moldura`, usada na matéria e em Quem Somos) é parte
do design: borda de 6px em `--dov-offwhite` mais um `outline` hairline, e a
foto leva `filter: sepia(.22) saturate(.82) contrast(1.05)`.

## 3. Fontes

O CSS **não** embute nem importa fontes: referencia só por nome,
`--dov-fonte-titulo` e `--dov-fonte-corpo`. Os arquivos `.html` carregam o
Google Fonts por `<link>` apenas para o preview — remova ao portar.

```tsx
// app/layout.tsx
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

const titulo = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--dov-fonte-titulo-next",
  display: "swap",
});

const corpo = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--dov-fonte-corpo-next",
  display: "swap",
});
```

Depois, no `globals.css`, aponte os tokens para as variáveis do `next/font`:

```css
:root {
  --dov-fonte-titulo: var(--dov-fonte-titulo-next), Georgia, serif;
  --dov-fonte-corpo:  var(--dov-fonte-corpo-next), system-ui, sans-serif;
}
```

Pesos usados: Cormorant 400 e 500 (**nunca bold**), DM Sans 400, 500 e 700 (700
só em `<strong>`). Subset latino basta.

## 4. Assets

**Logos** (`assets/logos/`) — 7 arquivos: horizontal colorido, branco e preto;
vertical colorido e branco; ícone do cacho colorido e branco. Nenhum tem
`width`/`height`: dimensione por CSS, **sempre pela altura**, e mantenha
`aspect-ratio: 900 / 418` no lockup horizontal (o ícone é `630 / 900`) — sem
isso o navegador cai no padrão 300 × 150 e o logo colapsa em layouts flex.

Alturas canônicas: 58px no cabeçalho desktop, 42px no mobile, 36–56px nos
rodapés, mínimo absoluto 32px.

> A versão branca serve tanto sobre roxo quanto sobre marinho — é o mesmo
> arquivo, não duas variantes.

**Blobs** (`assets/blobs/`) — três formas. Sempre dentro de um contêiner com
`overflow: hidden`, com `alt=""` e `aria-hidden="true"`, no máximo um por
seção, e apenas em hero, busca, chamada do Almanaque e 404. Opacidades: lilás
.45–.55, menta .26–.35, roxo .14.

**Ícones** (`assets/icones/`) — 15 arquivos no traçado Lucide, `viewBox 0 0 24
24`, `stroke="currentColor"`, `stroke-width` 1.8, sem dimensão fixa: busca,
menu, fechar, seta-direita, seta-esquerda, seta-baixo, compartilhar,
copiar-link, whatsapp, instagram, youtube, cadeado, relógio, calendário,
alerta.

Os SVGs foram limpos à mão (prolog XML, ids e dimensões removidos). **Passe-os
por SVGO antes de subir** — os logos ainda têm ~16 kB de path que comprime bem.

## 5. Interação

Tudo o que é comportamento está em
[`ESPECIFICACAO-DE-INTERACAO.md`](./ESPECIFICACAO-DE-INTERACAO.md): cabeçalho
que encolhe, menu mobile, hover/foco/pressionado de cada componente, rolagem
dos chips, sugestões da busca, índice A–Z sticky e todos os estados de vazio,
carregamento e erro — com durações, curvas e valores exatos.

## 6. Favicon, ícones e Open Graph

Em `meta/` — ver [`meta/README.md`](./meta/README.md) para as tags e a rota do
`next/og`.

| Arquivo | Uso |
| --- | --- |
| `favicon.svg` | Favicon vetorial (preferido pelos navegadores modernos) |
| `favicon-16x16.png` · `favicon-32x32.png` | Cacho colorido, fundo transparente |
| `apple-touch-icon-180x180.png` | Cacho branco sobre roxo |
| `icon-512x512.png` | Manifest / PWA |
| `safari-pinned-tab.svg` | Máscara monocromática |
| `og-template.html` | Template editável 1200 × 630, com três slots |
| `og-padrao.png` | Fallback estático 1200 × 630 |

## 7. Acessibilidade — o que já está no pacote

- Contrastes verificados: branco/roxo 9,3:1 · marinho/off-white 12,4:1 ·
  roxo/branco 9,7:1 (AAA). Branco sobre verde escuro é 3,4:1 — só para texto
  ≥ 24px ou ícones. **Verde-limão nunca com texto branco.**
- `:focus-visible` de 2px roxo com offset de 2px em tudo.
- Um `<h1>` por página; hierarquia de títulos sem pulos.
- Alvos de toque de 48 × 48 no mobile (44 na paginação).
- `prefers-reduced-motion` tratado nos tokens.
- Blobs marcados como decorativos.

Falta, e depende de conteúdo real: `alt` descritivo em cada fotografia.

---

## Observações

Coisas que eu mudaria, **não aplicadas** neste pacote:

1. **Nome.** O logotipo diz “Descubra o Vinho”; o projeto foi pedido como
   “Descobrindo o Vinho”. Segui o logotipo em todos os textos. Vale decidir
   antes de publicar.
2. **Duplicação de CSS.** Cada tela repete o CSS de cabeçalho, rodapé, cartão,
   botões e chips, porque o pedido era um CSS por tela e arquivos autônomos.
   São ~11 kB repetidos por arquivo. Em produção isso vira um `dov-base.css`
   compartilhado (ou CSS Modules por componente) e cada rota fica com só o que
   é dela.
3. **Faixa 768–1024 sem prancha.** Está derivada dos tokens de tablet, não
   desenhada. Se o tráfego de tablet importar, vale uma prancha.
4. **Menu desktop apertado.** Sete editorias mais o botão Almanaque e a busca
   ocupam quase toda a barra em 1440; abaixo de ~1280 a linha quebra. Ou o menu
   passa a hambúrguer mais cedo (1280 em vez de 1024), ou duas editorias vão
   para um “Mais ⌄”.
5. **Sidebar da matéria.** Deixei `position: sticky` no `<aside>` — nas
   pranchas ela é estática. É uma diferença de comportamento, não de pixel, e
   melhora artigos longos; se quiser fidelidade absoluta, remova as duas linhas
   de `sticky` em `05-materia-desktop.css` e `09-verbete-desktop.css`.
6. **Conteúdo fictício.** Datas, contagens (“418 verbetes”, “128 matérias”,
   “23 resultados”) e o nome “Ana Ferraz” são de referência.
7. **Ícone de compartilhar.** A tela de matéria usa WhatsApp, Instagram e
   copiar-link. Instagram não aceita compartilhamento por URL a partir da web —
   na prática esse botão precisa virar X/Twitter, Facebook ou o
   `navigator.share` nativo.

## Sobre as cores do logo — **precisa de verificação**

Os SVGs de logo que recebi vieram com o bloco `<defs>` **vazio**: nenhuma cor,
todos os traçados em preto. Reconstruí as cores a partir da paleta oficial da
marca:

| Elemento | Cor aplicada |
| --- | --- |
| Cacho (bagos) | `#681775` roxo primário |
| Folha | `#95BA34` verde-limão |
| Centro da folha | `#009559` verde escuro |
| Assinatura “Descubra + Compartilhe + Viva +” | `#009559` verde escuro |

**Não posso confirmar que essa é a distribuição oficial** — é uma
reconstrução plausível, não uma leitura do arquivo original. Antes de
publicar, confirme com o arquivo-fonte da marca (AI/Figma) ou com o manual.
Se algo divergir, é uma troca de valor de `fill` nos SVGs em
`assets/logos/` — dois minutos de ajuste.

Os demais hex do pacote (paleta, rampas, neutros) vieram da definição de marca
usada nas pranchas e conferem.
