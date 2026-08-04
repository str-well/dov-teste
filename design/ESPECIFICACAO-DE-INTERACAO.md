# Especificação de interação — Descubra o Vinho

O que os mockups estáticos não mostram. Todos os valores são normativos: se
divergirem do que está no CSS das telas, **este documento vence**.

Referências de token entre parênteses vêm de `dov-tokens.css`.

Base de movimento:

| Papel | Duração | Curva |
| --- | --- | --- |
| Cor de link, hover de menu, borda de chip | 150 ms (`--dov-duracao-rapida`) | `--dov-easing` |
| Zoom de imagem, sombra de cartão | 250 ms (`--dov-duracao`) | `--dov-easing` |
| Sugestões da busca, cabeçalho sticky | 320 ms (`--dov-duracao-media`) | `--dov-easing` |
| Menu mobile em tela cheia | 400 ms (`--dov-duracao-lenta`) | `--dov-easing-saida` na entrada, `--dov-easing-entrada` na saída |

`--dov-easing` é `cubic-bezier(.4, 0, .2, 1)`.

**`prefers-reduced-motion: reduce`** — já tratado em `dov-tokens.css`: todas as
transições e animações caem para 0,01 ms e o `scroll-behavior` vira `auto`. O
que muda de *estado* (cor, borda, sombra) continua mudando; o que **move**
(zoom da imagem, deslize do menu, encolhimento do cabeçalho) passa a ser
instantâneo. Nunca condicione a legibilidade a uma animação.

---

## 1. Cabeçalho que encolhe no scroll (desktop ≥ 1025px)

Só a barra branca é fixa. A faixa utilitária de 44px rola para fora normalmente
e **não volta**.

| Estado | Gatilho | Altura da barra | Logo | Sombra |
| --- | --- | --- | --- | --- |
| Repouso | `scrollY < 40` | 92px (`--dov-altura-cabecalho`) | 58px | nenhuma |
| Reduzido | `scrollY ≥ 40` | 68px (`--dov-altura-cabecalho-reduzido`) | 44px | `--dov-sombra-pequena` |

- A barra branca recebe `position: sticky; top: 0; z-index: 200`
  (`--dov-z-cabecalho`). A transição de `height`, da altura do logo e da sombra
  dura 320 ms.
- **Histerese obrigatória:** entra em Reduzido a 40px e só volta a Repouso
  abaixo de 24px. Sem isso o cabeçalho vibra quando o usuário para em cima do
  limiar.
- Não esconder o cabeçalho ao rolar para baixo. Ele encolhe e fica.
- Implementar com `IntersectionObserver` sobre uma sentinela de 1px no topo do
  documento — não com listener de `scroll`.
- A borda inferior hairline permanece nos dois estados.
- No mobile o cabeçalho **não** é sticky: rola junto com a página.

## 2. Menu mobile em tela cheia (≤ 1024px)

Ver a marcação e o CSS em `telas/00-fundamentos-componentes.html`
(`.menu-tela-cheia`).

**Abertura** — toque no hambúrguer:

1. O painel monta com `position: fixed; inset: 0; z-index: 400`
   (`--dov-z-menu-mobile`), fundo `--dov-offwhite`, opaco (não é overlay
   translúcido).
2. Anima `opacity 0 → 1` e `translateY(-8px) → 0` em 400 ms.
3. O `<body>` recebe `overflow: hidden` e o scroll é travado. Guarde o
   `scrollY` antes e restaure ao fechar — sem isso o iOS volta para o topo.
4. O foco vai para o **botão de fechar**, não para o campo de busca: abrir o
   teclado virtual sem o usuário pedir é hostil.
5. `aria-expanded` do hambúrguer passa a `true`; o painel é
   `role="dialog" aria-modal="true"` com `aria-label="Menu"`.

**Enquanto aberto:**

- Foco preso dentro do painel (focus trap), do botão de fechar ao último link
  utilitário e de volta.
- `Esc` fecha.
- Toque fora não se aplica — o painel cobre a tela inteira.
- Itens: altura de toque ~54px (`padding-block: 13px` sobre 27px de
  line-height), filete hairline entre eles, item da seção atual em roxo.

**Fechamento** — botão ×, `Esc`, ou navegação para outra rota:

1. `opacity 1 → 0` em 400 ms; o painel desmonta ao fim.
2. Scroll destravado e `scrollY` restaurado.
3. Foco volta para o hambúrguer.
4. `aria-expanded` volta a `false`.

Com `prefers-reduced-motion`, o painel aparece e some sem transição.

## 3. Estados de hover, foco e pressionado

Foco de teclado é **sempre** o mesmo, em todo elemento interativo:

```css
:focus-visible {
  outline: 2px solid var(--dov-roxo);
  outline-offset: 2px;
}
```

Nunca remover o outline sem substituto e nunca deixar o anel azul padrão. Use
`:focus-visible` (não `:focus`), para o anel não aparecer em clique de mouse.

### Cartão de notícia

O alvo clicável é o `<a>` inteiro (`.cartao__link`), não só o título — uma área
de clique, um item na navegação por teclado.

| Camada | Repouso | Hover / focus-visible |
| --- | --- | --- |
| Título | `--dov-texto` | `--dov-roxo` (150 ms) |
| Imagem | `scale(1)` | `scale(1.03)` (250 ms) — contida por `overflow: hidden` na moldura |
| Moldura da imagem | sem sombra | `box-shadow: 0 3px 0 var(--dov-limao)` (250 ms) |
| Resumo e meta | inalterados | inalterados |

O hover do cartão **não** move o bloco: sem `translateY`, sem sombra ao redor.
Cartões com fundo branco sobre off-white (relacionados, agenda) são a exceção:
ganham `--dov-sombra` no hover e nada mais.

### Links

- **Menu principal:** cor → roxo, filete inferior de 2px transparente → limão,
  150 ms. O item ativo já tem filete roxo e não muda no hover.
- **Link no corpo do artigo:** sublinhado limão de 2px com offset de 3px em
  repouso; no hover o sublinhado vira roxo e o texto clareia de
  `--dov-roxo-800` para `--dov-roxo`.
- **Link de texto (`.link-texto`):** roxo com filete limão; no hover o texto vai
  para `--dov-roxo-600` e o filete para roxo.
- **Links do rodapé:** branco → `--dov-menta`.

### Botões

| Variante | Repouso | Hover | Pressionado |
| --- | --- | --- | --- |
| Primário | `--dov-roxo` | `--dov-roxo-600` | `--dov-roxo-800` |
| Contorno | transparente, borda roxa | fundo `--dov-roxo-100` | fundo `--dov-roxo-200` |
| Claro (sobre escuro) | branco | `--dov-lilas` | `--dov-lilas` + texto `--dov-roxo-800` |
| Verde (newsletter) | `--dov-verde` | `--dov-verde-600` | `--dov-verde-700` |
| Ícone | transparente | fundo `--dov-roxo-100` | fundo `--dov-roxo-200` |

Todas as transições em 150 ms. `:disabled` → `opacity: .45` e
`cursor: not-allowed`, sem mudar a cor.

**Botão em carregamento** (envio de newsletter, busca): mantém a largura,
troca o rótulo por um spinner de 16px em `currentColor` girando em 700 ms
linear, e recebe `aria-busy="true"` e `disabled`. Nunca encolher o botão nem
deixar o rótulo sumir sem substituto.

### Chips e filtros

| Estado | Borda | Fundo | Texto |
| --- | --- | --- | --- |
| Inativo | `--dov-divisor` | transparente | `--dov-texto` |
| Hover | `--dov-roxo` | transparente | `--dov-roxo` |
| Ativo | `--dov-roxo` | `--dov-roxo` | branco |
| Sugestão (hero, buscas relacionadas) | `--dov-roxo-200` | branco | `--dov-roxo` |

Filtro ativo carrega `aria-current="true"`. Ao trocar de filtro sem recarregar
a página, anuncie a nova contagem em uma região `role="status"`
(ver §7).

## 4. Rolagem horizontal dos chips (mobile)

Classe `.chips-rolagem`.

- `overflow-x: auto`, `scroll-snap-type: x proximity`, cada chip com
  `scroll-snap-align: start` e `flex: none`.
- Barra de rolagem escondida (`scrollbar-width: none` +
  `::-webkit-scrollbar { display: none }`).
- **Padding de sangria:** a tira usa a margem de 20px como `padding-inline`, e
  o último chip precisa de `scroll-padding-inline-end: 20px` para não colar na
  borda ao fim do arrasto.
- **Afordância de corte:** o último chip visível deve ficar parcialmente
  cortado na borda direita — é o que diz ao usuário que há mais. Não centralize
  a tira nem use `justify-content: center`.
- Ao carregar a página com um filtro ativo, role a tira para deixá-lo visível
  (`el.scrollLeft = chipAtivo.offsetLeft - 20`). **Não** use `scrollIntoView`.
- No desktop os mesmos chips quebram em várias linhas (`flex-wrap: wrap`), sem
  rolagem.
- Setas laterais: não. A tira é arrastável e tem corte visível.

## 5. Sugestões da barra de busca

Padrão combobox. Marcação de referência em
`00-fundamentos-componentes.html` (`.sugestoes`).

**Quando abrir**

- A partir de **3 caracteres**, com **250 ms de debounce**.
- Fecha com: menos de 3 caracteres, `Esc`, clique fora, blur, ou seleção.
- Máximo de **8 sugestões**, misturando matérias e verbetes; verbetes primeiro
  quando o termo bate exatamente com um verbete.

**Aparência**

- Painel ancorado ao campo, `z-index: 300` (`--dov-z-sugestoes`), largura igual
  à do campo, `border-radius: --dov-raio-grande`, borda hairline, fundo branco,
  `--dov-sombra`.
- Entrada: `opacity 0 → 1` + `translateY(-4px) → 0` em 320 ms.
- Item: `padding: 14px 26px`, 15px, com o tipo do resultado à direita em 13px
  `--dov-texto-meta`.
- Item em foco (mouse ou teclado): fundo `--dov-roxo-100`, texto `--dov-roxo`.
- O trecho que casa com o termo digitado vai em `<mark>`
  (fundo `--dov-roxo-200`, texto `--dov-roxo-800`) — igual à página de
  resultados.

**Teclado**

| Tecla | Ação |
| --- | --- |
| ↓ / ↑ | Move entre as sugestões, circulando |
| Enter | Abre a sugestão em foco; sem foco, submete a busca |
| Esc | Fecha o painel e mantém o texto digitado |
| Tab | Fecha o painel e segue o fluxo normal de foco |

**Acessibilidade** — `role="combobox"`, `aria-expanded`, `aria-controls` e
`aria-activedescendant` no `<input>`; `role="listbox"` no painel e
`role="option"` nos itens.

**Estados**

- *Carregando:* mantenha o painel anterior visível e ponha `aria-busy="true"`
  no listbox. Não pisque uma lista vazia entre uma resposta e outra.
- *Sem sugestão:* uma linha, não clicável — “Nenhuma sugestão. Pressione Enter
  para buscar em todo o portal.”
- *Erro:* uma linha em `--dov-texto-meta` — “Não foi possível sugerir agora.” O
  Enter continua funcionando.

## 6. Navegação sticky do índice A–Z

Classe `.letras` (desktop) / `.letras-mobile`.

- `position: sticky; top: 0; z-index: 100` (`--dov-z-sticky`), fundo branco,
  hairline inferior e `--dov-sombra-pequena`.
- **Ela gruda abaixo do cabeçalho reduzido.** No desktop use
  `top: var(--dov-altura-cabecalho-reduzido)` (68px) quando o cabeçalho estiver
  sticky; no mobile, `top: 0`.
- **Letra ativa** — acompanhe as seções com `IntersectionObserver`
  (`rootMargin: "-30% 0px -60% 0px"`) e marque a letra da seção que estiver na
  faixa. A letra ativa recebe fundo roxo, texto branco e `aria-current="true"`.
- Ao clicar, role até a âncora com `scroll-margin-top` igual à altura da barra
  sticky + 16px na seção de destino. Atualize o hash da URL sem empilhar
  histórico (`history.replaceState`).
- **Letras sem verbete** são `<span>`, não `<a>`: cor `--dov-texto-desabilitado`,
  `aria-disabled="true"`, fora da ordem de tabulação, sem hover.
- No mobile a tira quebra em duas linhas de 13 letras — não rola
  horizontalmente. Alvos de 36px.
- A barra é `<nav aria-label="Índice alfabético">` com lista.

## 7. Estados vazios, de carregamento e de erro

### Carregamento

Nunca spinner de página inteira. **Skeleton** com a forma do conteúdo:

- Bloco cinza `--dov-neutro-200`, mesmo `border-radius` do elemento real.
- Pulso: `opacity .6 → 1 → .6` em 1,4 s `ease-in-out`, infinito. Sem gradiente
  varrendo.
- Contagens: 6 cartões na categoria, 3 nos relacionados, 8 nas sugestões.
- O contêiner recebe `aria-busy="true"`; o texto de status vai em
  `role="status"` — “Carregando matérias…”.
- **Duração mínima de 300 ms** se o skeleton chegou a aparecer, para não
  piscar.
- Paginação: o botão “Próxima” vira estado de carregamento (§3) e a lista
  mantém a altura anterior até a nova chegar.

### Vazios

Todos com o mesmo esqueleto: título em Cormorant, uma frase de orientação em
`--dov-texto-suave`, atalhos em chips e um botão primário. Nunca uma tela só
com “nada encontrado”.

| Situação | Título | Orientação | Saídas |
| --- | --- | --- | --- |
| Busca sem resultado (tela 15) | Nada encontrado para *“termo”* | Confira a grafia ou tente palavras mais simples — “uva”, “espumante”, “Serra Gaúcha”. | Chips: Almanaque A–Z · Harmonize · Viaje. Botão: Ver as últimas publicações |
| Categoria vazia | Ainda não publicamos em *Categoria* | Estamos preparando as primeiras matérias desta editoria. | Botão: Ver as últimas publicações |
| Filtro sem resultado | Nenhuma matéria com esse filtro | Tente outro tema ou volte para *Tudo*. | Botão secundário: Limpar filtro |
| Letra do Almanaque sem verbete | Não deve acontecer | A letra fica cinza e sem link (§6) | — |
| Agenda sem eventos | Sem eventos marcados por enquanto | Assine a newsletter para saber quando a agenda abrir. | Campo de newsletter |

O texto do estado vazio vai em `role="status"` para ser anunciado quando
substituir uma lista que tinha resultados.

### Erros

| Situação | Tratamento |
| --- | --- |
| 404 | Tela 16. Título “Essa garrafa não está na adega”, botão primário para a home e secundário para o Almanaque. |
| 500 / falha de servidor | Mesmo layout do 404, numeral `500`, título “Algo saiu errado por aqui”, texto “Já estamos verificando. Tente de novo em alguns instantes.”, botão primário “Recarregar a página”. |
| Falha ao carregar uma lista (categoria, relacionados) | Não derrube a página. No lugar da lista: uma linha de texto em `--dov-texto-suave` e um botão de contorno “Tentar de novo”. O resto da página continua utilizável. |
| Falha na busca | Mantém o cabeçalho da busca e o campo preenchidos; troca a lista por “Não foi possível buscar agora.” + “Tentar de novo”. |
| Offline | Faixa fixa no rodapé da janela, fundo `--dov-marinho`, texto branco 14px: “Você está sem conexão.” Some sozinha ao reconectar. |

**Erro de formulário** (newsletter, contato):

- Borda do campo `2px solid #C0392B`, mensagem abaixo em 13px da mesma cor,
  ligada por `aria-describedby`, e `aria-invalid="true"`.
- Validar **no blur**, nunca a cada tecla; revalidar a cada tecla depois que o
  campo já errou uma vez.
- Sucesso: o formulário é substituído pela confirmação no mesmo espaço —
  “Pronto. Confira sua caixa de entrada para confirmar.” em `--dov-verde`, com
  `role="status"`. Não usar `alert()` nem toast.

---

## 8. Detalhes fáceis de perder

- **Cor da seleção de texto** já vem dos tokens: fundo `--dov-roxo-200`, texto
  `--dov-roxo-900`.
- **Alvo de toque mínimo de 48 × 48** no mobile — vale para os ícones do
  cabeçalho, os chips e os itens de paginação (44px é o mínimo absoluto, só na
  paginação).
- **`scroll-margin-top`** em todo alvo de âncora (índice do artigo, letras do
  Almanaque), senão o cabeçalho sticky cobre o título.
- **Números tabulares** em datas, contagens, paginação e letras —
  `font-variant-numeric: tabular-nums`, já aplicado nas classes.
- **`text-wrap: pretty`** em todos os títulos, para não deixar palavra órfã.
- **Blobs são decorativos:** `alt=""` e `aria-hidden="true"`, sempre dentro de
  um contêiner com `overflow: hidden`.
- **Um `<h1>` por página** — na categoria é o nome da categoria, na matéria o
  título, no verbete o termo.
- **Imagem do hero** sem lazy-load e com prioridade alta; todo o resto
  preguiçoso.
