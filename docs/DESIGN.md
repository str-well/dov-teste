# Design system — como usar o pacote do designer

O pacote vive em `design/`. **É a fonte de verdade do visual.** Antes de escrever
qualquer componente, abra o HTML e o CSS da tela correspondente e porte de lá — não
estime a partir de imagem.

```
design/
  dov-tokens.css                 fonte única de cor, tipografia, espaçamento, movimento
  telas/                         17 pares HTML + CSS, autônomos
  assets/logos/                  7 SVGs
  assets/blobs/                  3 SVGs
  assets/icones/                 15 SVGs, stroke em currentColor
  meta/                          favicons, ícones do site, template de Open Graph
  ESPECIFICACAO-DE-INTERACAO.md  o que os mockups estáticos não mostram
  README.md                      notas do designer
```

Fora de `app/` e `public/` — é referência, não entra no build. Os SVGs que forem
usados de verdade vão para `public/`, passando por SVGO antes.

---

## Regra de fidelidade

O pedido foi **portar sem redesenhar**. Os CSS das telas não têm um único hex cru:
tudo sai de `dov-tokens.css`. Isso significa que a fidelidade se preserva sozinha
**se os valores vierem dos tokens**.

- Os tokens viram variáveis CSS em `globals.css` e alimentam o `tailwind.config`
- Tailwind cuida de grade, espaçamento e responsividade
- **Tipografia e componentes visuais herdam o CSS do mockup**, não são retipados em
  utilitários — é aí que a fidelidade escorre
- Nenhum valor numérico novo. Se um número não existe nos tokens, ele está errado

Os hex que aparecem em versões antigas dos meus documentos foram lidos por
amostragem de imagem e **6 de 8 estavam errados**. Ignorar. `dov-tokens.css` manda.

## Fontes

Os mockups carregam Cormorant Garamond e DM Sans do Google Fonts por `<link>`.
Em produção: `next/font`, self-hosted, sem chamada externa.
Pesos usados: Cormorant 400 e 500; DM Sans 400, 500 e 700.
**Cormorant nunca em bold** — 500 é o máximo.

## Logos

Nenhum SVG tem `width`/`height`. Dimensionar **por altura**, sempre com
`aspect-ratio`: `900 / 418` no lockup horizontal, `630 / 900` no ícone do cacho.
Sem isso o navegador cai em 300×150 e o logo colapsa em layout flex.

Alturas canônicas: 58px no cabeçalho desktop, 42px no mobile, 36–56px nos rodapés,
mínimo absoluto 32px.

---

## Mapa tela → template

| Tela | Arquivos | Template / rota |
|---|---|---|
| 00 | `00-fundamentos-componentes` | **Não é página.** É a prancha de componentes: cabeçalho nos dois estados, menu mobile, barra de busca, card nas 3 variações, botões, chips, paginação, rodapé. **Construir a Fase 2 a partir daqui.** |
| 01 · 02 | `01-home-desktop` · `02-home-mobile` | `/` |
| 03 · 04 | `03-categoria-desktop` · `04-categoria-mobile` | `/[categoria]` — serve as 7 editorias |
| 05 · 06 | `05-materia-desktop` · `06-materia-mobile` | `/[categoria]/[slug]` |
| 07 · 08 | `07-almanaque-indice-desktop` · `08-almanaque-indice-mobile` | `/almanaque` |
| 09 · 10 | `09-verbete-desktop` · `10-verbete-mobile` | `/almanaque/[termo]` |
| 11 · 12 | `11-quem-somos-desktop` · `12-quem-somos-mobile` | `/quem-somos` |
| 13 · 14 | `13-busca-desktop` · `14-busca-mobile` | `/busca` |
| 15 | `15-busca-sem-resultados-mobile` | `/busca` — estado vazio |
| 16 | `16-404-mobile` | `not-found.tsx` |

Só existe versão mobile das telas 15 e 16 — derivar o desktop dos tokens.

## Ordem de trabalho

1. **Tela 00 primeiro.** Ela contém todo componente global. Construídos a partir
   dela, os templates seguintes são quase só composição.
2. Depois a ordem do plano: matéria → categoria → verbete → índice A–Z → home →
   institucionais.

## Interação

`ESPECIFICACAO-DE-INTERACAO.md` cobre, com valores exatos: cabeçalho encolhendo
92→68px, menu mobile em tela cheia, hover/foco/pressionado de card, link, botão e
chip, rolagem horizontal dos chips, sugestões da busca, navegação sticky do A–Z,
e os estados vazio, de carregamento e de erro.

Ler antes de implementar cada componente. Os mockups são estáticos e não mostram
nada disso.

---

## Decisões em aberto

O designer listou o que ele mudaria e **não aplicou**. Três precisam de resposta
antes de codar os componentes correspondentes:

| # | Questão | Status |
|---|---|---|
| **Menu desktop** | 7 editorias + Almanaque + busca não cabem abaixo de ~1280px; a linha quebra | **Decidir:** hambúrguer a partir de 1280, ou duas editorias num "Mais ⌄" |
| **Sidebar da matéria** | Ele deixou `position: sticky`; nas pranchas é estática | **Decidir:** manter sticky, ou remover as 2 linhas em `05-materia-desktop.css` e `09-verbete-desktop.css` |
| **Botão de Instagram** | Instagram não aceita compartilhamento por URL a partir da web — o botão não funciona | **Decidir:** trocar por X/Facebook, ou usar `navigator.share` nativo |
| Faixa 768–1024 | Não desenhada, derivada dos tokens de tablet | Aceitável; pedir prancha só se o tráfego de tablet importar |
| Nome | O logotipo diz "Descubra o Vinho"; o projeto foi pedido como "Descobrindo o Vinho" | O domínio `descubraovinho.com.br` já seguiu o logotipo. Confirmar com o cliente |
| Duplicação de CSS | Cada tela repete ~11 kB de cabeçalho, rodapé, card, botões e chips | Resolve na Fase 2, ao extrair os componentes |
| Conteúdo dos mockups | Datas, "418 verbetes", "128 matérias", "Ana Ferraz" são fictícios | Vêm da API. Nunca chumbar |

## Cores do logo — pendência real

Os SVGs originais chegaram ao designer com `<defs>` vazio, todos os traçados em
preto. Ele **reconstruiu** as cores pela paleta da marca:

| Elemento | Cor aplicada |
|---|---|
| Cacho (bagos) | `#681775` roxo primário |
| Folha | `#95BA34` verde-limão |
| Centro da folha | `#009559` verde escuro |
| Assinatura "Descubra + Compartilhe + Viva +" | `#009559` verde escuro |

**Não é leitura do arquivo original — é reconstrução plausível.** Conferir com o
arquivo-fonte da marca (AI/Figma) ou com o manual antes de publicar. Se divergir,
é trocar valores de `fill` nos SVGs: dois minutos.

Os demais hex do pacote (paleta, rampas, neutros) vieram da definição usada nas
pranchas e estão conferidos.
