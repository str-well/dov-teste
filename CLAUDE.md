# Descubra o Vinho (DOV) — contexto do projeto

Portal editorial de vinho, em português do Brasil. WordPress headless como backend,
Next.js como frontend. Cliente real, projeto em produção.

Leia também, antes de codar:
- `docs/DESIGN.md` — como usar o pacote do designer e o mapa tela → template
- `docs/BACKEND.md` — contrato da API do WordPress
- `docs/PLANO-IMPLEMENTACAO.md` — plano completo das 5 fases

---

## Arquitetura

```
Cloudflare — apenas DNS por enquanto (CDN a avaliar depois do lançamento)
├── descubraovinho.com.br      Next.js 15, Node.js Web App na Hostinger, ISR em disco
└── wp.descubraovinho.com.br   WordPress headless, mesmo plano Hostinger
```

Os dois rodam no mesmo plano Hostinger Cloud Professional, junto com **6 outros
sites de clientes**. Recursos são compartilhados — evitar consultas desnecessárias
ao WordPress não é otimização prematura, é requisito.

Custo adicional do projeto: zero.

## Stack

- Next.js 15 · App Router · TypeScript · `output: 'standalone'`
- Tailwind CSS **v4** — a configuração é o `@theme` do `app/globals.css`.
  **Não existe `tailwind.config`**; não criar um.
- **Radix só nos dois primitivos** que a especificação de interação exige:
  `@radix-ui/react-dialog` no menu mobile e `downshift` no combobox da busca.
  Não instalar o shadcn inteiro — ele traz componentes já estilizados, e o
  estilo já vem do designer.
- Cormorant Garamond + DM Sans via `next/font`, self-hosted
- Fuse.js para a busca do Almanaque (JSON estático gerado no build)
- Resend para e-mail transacional

## Estado atual

**Fase 0 — validação da infraestrutura: concluída.**
Build no servidor em 1m0s · deploy automático no `git push` · Node v22.18.0 ·
ISR revalidando a 60s · RSS ~102 MB · uptime estável por 11h+ sem queda.

**Fase 1 — WordPress: concluída.**
Instalado em `wp.`, fuso São Paulo, permalinks `/%postname%/`, mu-plugin ativo,
7 categorias, 16 tags, 20 matérias, 22 verbetes, 3 eventos, 2 páginas.
Conexão do front com a API validada em 226 ms.

**Fase 2 — fundações do front: quase toda pronta.**

- **Camada de dados** — `lib/wp/`, entrada única em `lib/wp/index.ts`.
  ~25 funções tipadas, verificadas contra a API de produção. Detalhe abaixo.
- **Fundações visuais** — Tailwind v4 com `@theme` no `app/globals.css`,
  `design/dov-tokens.css` importado, fontes por `next/font`.
- **Componentes globais** — em `components/`, CSS em `app/componentes.css`.
  Cabeçalho nos dois estados, cabeçalho mobile, menu em tela cheia com Radix,
  rodapé, cartão nas 3 variações, imagem com estado vazio, paginação, botões,
  chips e etiquetas. Prancha viva em **`/componentes`**, para comparar com o
  HTML do designer.

**Falta da Fase 2:** o painel de sugestões da busca (§5 da especificação, com
`downshift` já instalado — precisa de uma rota que devolva sugestões) e o ajuste
de rolagem da tira de chips no mobile (§4).

**As três decisões que travavam os componentes foram fechadas** — menu em 1280,
sidebar sticky, `navigator.share`. Detalhe em `docs/DESIGN.md`.

**Depois:** os templates de página, na ordem abaixo. Nenhum foi codado ainda; o
repositório tem a home de placeholder, `/componentes` e `/diagnostico`.

---

## Decisões fechadas — não reabrir

| Descartado | Por quê |
|---|---|
| **Vercel** | Hobby proíbe uso comercial; Pro tem cobrança variável por uso |
| **Netlify** | Funciona, mas a Hostinger já está paga e faz o mesmo |
| **Cloudflare Workers como host** | Exigiria OpenNext + KV; desnecessário com processo Node de verdade |
| **DigitalOcean / VPS** | Custo extra e manutenção de sysadmin sem ganho |
| **Payload CMS** | Complexidade e custo de infra |
| **JetEngine** | Licença expirada; substituído por mu-plugin próprio |
| **ACF** | Desnecessário; as caixas de campo estão no mu-plugin |
| **Elementor no front** | Fora da entrega |
| **Cache de REST API no LiteSpeed** | Cria corrida com a revalidação: o webhook dispara no save, o Next busca antes do purge e recebe conteúdo velho, sem erro visível. O ISR já é o cache real. |
| **Tailwind v3 com `tailwind.config.ts`** | Exigiria reescrever cada token na config, criando a mesma duplicação de valores que já custou 6 hex errados. O `@theme` do v4 consome as variáveis CSS direto. Custo aceito: v4 pede Chrome 111+ / Safari 16.4+. |
| **Copiar os tokens para o `globals.css`** | Mesmo motivo: duas cópias divergem. O arquivo do designer é importado. |
| **Escala tipográfica como utilitário Tailwind** | É onde o designer avisa que a fidelidade escorre. Tipografia herda o CSS do mockup; Tailwind faz grade, espaçamento e responsividade. |
| **shadcn/ui completo** | Traz componentes já estilizados, e o estilo vem do designer. Só os primitivos: Radix Dialog e `downshift`. |
| **`cmdk` no combobox da busca** | É paleta de comandos: filtra a própria lista em memória. A §5 pede busca no servidor com debounce e `<mark>` no trecho que casa — `downshift` é agnóstico a async. |
| **Lib de compartilhamento** | `navigator.share` é API nativa. Reserva no desktop: copiar-link e WhatsApp, cujos ícones já existem no pacote. |
| **`next/image` para logo e blobs** | O dimensionamento é por altura com `aspect-ratio`, e o `next/image` insere `width`/`height` que brigam com isso. Não há o que otimizar num SVG. `next/image` é para as fotos do WordPress. |

**Regra que sustenta a saída de emergência:** nada de código específico de host,
nenhuma dependência `@vercel/*`. `next/image` e `revalidatePath` padrão. Se a
hospedagem na Hostinger se mostrar frágil, o mesmo repo sobe no Cloudflare free
com OpenNext, sem reescrever nada.

---

## Preferências de trabalho

- **Não adicionar serviços pagos nem plugins.** O orçamento é a Hostinger e nada mais.
- Minimizar trabalho de terminal e manutenção de infraestrutura contínua.
- Escrever código no IDE é o objetivo do projeto — não sugerir construtor visual.
- **Responder em português do Brasil.**

---

## Armadilhas já descobertas

Cada uma dessas custou tempo. Não repetir.

1. **Entidades HTML.** A API devolve `title.rendered` com entidades codificadas —
   "Saúde & Ciência" chega como `Saúde &#038; Ciência`. Vale para título de matéria,
   nome de categoria, nome de verbete e resumo. **Decodificar uma vez na camada de
   dados**, nunca componente por componente.

2. **`meta` só aparece na API se o CPT declarar `custom-fields` em `supports`.**
   Já corrigido no mu-plugin. Se um campo novo não aparecer no JSON, é a primeira
   coisa a checar — o campo grava no banco e some silenciosamente na resposta.

3. **`dov_imagens` retorna `null` quando o post não tem imagem destacada.**
   Hoje **nenhum** conteúdo tem imagem. Todo componente que consome imagem precisa
   de estado vazio desde o primeiro dia, não como refinamento posterior.

4. **`dov_tempo_leitura` está 1 em todas as matérias**, porque os corpos são curtos.
   Não é bug; corrige sozinho quando o conteúdo real entrar.

5. **Os hex em documentos markdown deste repo são aproximados.** Foram lidos por
   amostragem de imagem antes de o pacote do designer chegar, e 6 de 8 estavam
   errados. Usar exclusivamente `design/dov-tokens.css`.

6. **Slugs de categoria são contrato.** O template de arquivo é único e resolve pela
   URL. `saude-e-ciencia` — com o "e" — é o slug real. Errar dá 404 sem explicação.

As quatro seguintes vieram da inspeção da API real ao escrever `lib/wp/`. Já
estão resolvidas dentro do módulo — só importam para quem for mexer nele.

7. **`orderby=include` é obrigatório nos relacionados.** Sem ele a API devolve
   por data, não na ordem pedida: `include=24,30` volta `[30, 24]`. A ordem do
   `<select multiple>` do editor é escolha editorial e precisa sobreviver.

8. **`?slug=inexistente` responde 200 com `[]`**, nunca 404. Quem tratar só o
   status vai renderizar página vazia em vez de chamar `notFound()`.

9. **`?page=` além da última responde 400**, não lista vazia — código
   `rest_post_invalid_page_number`. Uma URL digitada errada virava erro 500.

10. **`dov_imagens` pode omitir um tamanho específico** mesmo quando não é
    `null`: o mu-plugin só inclui a chave se `wp_get_attachment_image_src`
    devolver algo, e ele falha quando o original é menor que o tamanho pedido.
    O estado vazio tem dois níveis, não um — usar `imagem()`, que trata os dois.

As três seguintes vieram de construir os componentes globais.

11. **A camada do `@import` dos tokens não é opcional.** `dov-tokens.css` traz
    `a { color: … }`, `button { font: inherit }` e `h1…h6 { … }`. CSS sem camada
    vence qualquer `@layer`, então importar os tokens sem `layer(base)` faz o
    reset derrotar o CSS dos componentes — e `.botao--primario` sai com texto
    marinho em vez de branco, "Com ícone" fica roxo sobre roxo. A ordem correta
    é `base` (preflight + reset) < `components` < `utilities` < sem camada.

12. **Datas: formatar a partir de `dataUtc`, nunca de `data`.** O `data` é o
    horário de São Paulo mas vem **sem** fuso, e o servidor da Hostinger roda em
    UTC — uma matéria publicada 00:30 apareceria com a data do dia anterior, sem
    erro nenhum. Toda formatação está em `lib/formato.ts` e parte do `date_gmt`.

13. **A ordem das editorias não vem da API.** Ordenar termos exige plugin; sem
    ele o `orderby` só oferece nome, id e contagem — e alfabética poria
    "Curiosidades" antes de "Descubra", que é a editoria âncora nas pranchas. A
    ordem editorial está em `ORDEM_EDITORIAS` (`lib/site.ts`), **por slug**, com
    alfabética de reserva para quem não estiver na lista.

---

## Variáveis de ambiente

Cadastradas no painel da Hostinger, nunca no repositório:

```
WORDPRESS_API_URL=https://wp.descubraovinho.com.br/wp-json/wp/v2
REVALIDATE_SECRET=<segredo compartilhado com o wp-config.php>
RESEND_API_KEY=<pendente>
```

O `.env.local` não sobe no deploy.

---

## Ordem de construção dos templates

Do mais complexo para o mais simples, para os componentes nascerem testados no caso
difícil:

1. **Matéria** — `/[categoria]/[slug]` — sumário "Neste texto", citação, imagem com
   legenda e crédito, caixa "Do Almanaque", newsletter, tags, relacionados
2. **Arquivo de categoria** — `/[categoria]` — serve as 7 editorias; chips com
   rolagem horizontal no mobile, ordenação, paginação
3. **Verbete** — `/almanaque/[termo]` — etimologia, caixa "Na prática", relacionados,
   matérias que usam o termo, anterior/próximo
4. **Índice A–Z** — `/almanaque` — navegação sticky; letras sem verbete em cinza e
   sem link (K, Q, W, X, Y, Z estão vazias de propósito, para testar esse estado)
5. **Home**
6. **Quem Somos**, busca, busca sem resultados, 404

---

## Design system

O pacote do designer está em `design/` e **é a fonte de verdade do visual**:
17 pares HTML/CSS, `dov-tokens.css`, SVGs, favicons e a especificação de interação.
Detalhes de uso e o mapa tela → template estão em **`docs/DESIGN.md`** — ler antes
de construir qualquer componente.

### Como está montado

`app/globals.css` importa `design/dov-tokens.css` — **não copia**. Divergir é
impossível: existe um arquivo só, e é o do designer. Se ele sair do lugar, o
build quebra alto, que é o comportamento desejado.

O `@theme` zera cada namespace com `initial` antes de preencher. **`bg-slate-500`,
`rounded-xl`, `md:p-4` e `font-sans` não compilam** — a regra "nenhum valor novo"
é aplicada pela ferramenta, não pela memória de quem coda.

- `--spacing: var(--dov-esp-1)` — a escala toda é múltipla de 4, então a
  numeração padrão do Tailwind alcança cada passo: `p-6`→24px, `mt-10`→40px,
  `gap-30`→120px
- Três faixas, não cinco: `tablet:` 768px e `desktop:` 1025px, os limites que
  estão nos cabeçalhos das seções 5 e 6 dos tokens. Falta o breakpoint do menu
  desktop (~1280px), que é decisão em aberto.
- Cores, raios, sombras e larguras máximas viram utilitário com os nomes dos
  tokens: `bg-roxo`, `text-texto-meta`, `rounded-pilula`, `max-w-conteudo`
- A escala tipográfica **não** está no `@theme`, de propósito
- `app/diagnostico/diagnostico.css` é o estilo da ferramenta interna, carregado
  só naquela rota. Não é design system.
- **`app/componentes.css` tem os componentes globais**, extraídos da tela 00 —
  uma vez, não uma por tela. Duas regras ao mexer nele: nenhum valor novo, e um
  componente responsivo em vez de um par desktop/mobile. As poucas exceções
  estão marcadas com `[ESPEC]` e vêm da especificação de interação, que é
  normativa e vence as pranchas quando divergem.
- **`/componentes` é a prancha viva.** Os mesmos componentes com dados reais,
  para comparar com `design/telas/00-fundamentos-componentes.html`. Sai antes do
  lançamento, junto com a `/diagnostico`.
- Constantes de marca, navegação e ordem das editorias em `lib/site.ts`.
  Perfis de rede e páginas legais estão vazios ali de propósito: enquanto
  estiverem, os links não são renderizados — melhor faltar um ícone no rodapé do
  que entregar link morto num site de cliente.

Resumo do que não pode ser esquecido:

- **`design/dov-tokens.css` é a única fonte de valores.** Os CSS das telas não têm
  um hex cru. Nenhum número novo deve ser inventado.
- Portar **sem redesenhar**. Tipografia e componentes visuais herdam o CSS do
  mockup; Tailwind cuida de grade, espaçamento e responsividade.
- **Começar pela tela `00-fundamentos-componentes`** — ela contém todo componente
  global (cabeçalho nos dois estados, menu mobile, busca, card nas 3 variações,
  botões, chips, paginação, rodapé).
- Cormorant Garamond e DM Sans via `next/font`, self-hosted. **Cormorant nunca em
  bold** — 500 é o máximo.
- Logos: dimensionar por altura, sempre com `aspect-ratio` (`900/418` no horizontal,
  `630/900` no ícone). Sem isso o logo colapsa em layout flex.
- Um H1 por página. Números tabulares em datas, letras do A–Z e paginação.
- Toque mínimo 48×48 no mobile. `prefers-reduced-motion` já tratado nos tokens.
- Datas, "418 verbetes", "128 matérias" e "Ana Ferraz" nos mockups são fictícios —
  vêm da API, nunca chumbados.

**Três decisões em aberto** que afetam componentes (detalhe em `docs/DESIGN.md`):
breakpoint do menu desktop, sidebar sticky ou estática, e o botão de Instagram que
não funciona na web.

### Imagens

Servidas do WordPress com `unoptimized` — tamanhos fixos gerados no WP, não
otimizados em runtime.

| Uso | Nome do tamanho | Proporção | Dimensão |
|---|---|---|---|
| Hero da home | `dov_hero` | 16:9 | 1920×1080 |
| Destaque da matéria | `dov_destaque` | 3:2 | 1600×1067 |
| Card em destaque | `dov_card_4x3` | 4:3 | 1200×900 |
| Corpo do texto | `dov_corpo` | livre | 1200 de largura |
| Card padrão | `dov_card` | 3:2 | 800×533 |
| Retrato / autor | `dov_retrato` | 1:1 | 240×240 |

## Convenções de código

- **Toda chamada ao WordPress passa por `lib/wp/`**, com entrada única em
  `lib/wp/index.ts`. Importar `./http`, `./consultas` ou `./mapeadores` direto de
  um componente fura a regra — se falta algo, exportar no `index.ts`.
- A decodificação de entidades HTML mora nesse módulo, em `html.ts`, e roda uma
  vez na camada de dados. **Nunca componente por componente.**
- Segredos só nas variáveis de ambiente do painel.
- Revalidação: o mu-plugin chama `/api/revalidate` no `transition_post_status`,
  com trava de 10s por post. Fallback por tempo (`revalidate: 300`) nas listagens.

### `lib/wp/` — o que o módulo garante

Nada disso precisa ser lembrado componente por componente:

| Arquivo | Papel |
|---|---|
| `index.ts` | A única porta pública |
| `consultas.ts` | As funções de consulta; `_fields` sempre explícito |
| `http.ts` | O único `fetch` no WordPress; headers de paginação e erros |
| `mapeadores.ts` | Bruto → domínio; é onde a decodificação acontece |
| `html.ts` | Decodificador de entidades, texto simples, `letraInicial` |
| `tipos.ts` | `Bruto*` (a API real) e o domínio, em português |
| `config.ts` | URL base e os segundos de ISR |

- Entidades já decodificadas em título, resumo, nome de termo e texto do `meta`.
  **Exceto `conteudoHtml`**, que é HTML de verdade e sai cru de propósito —
  decodificar transformaria entidades do texto em marcação.
- Ausência é `null` ou lista vazia. `ErroWordPress` é só falha de verdade, para
  o `error.tsx`; "não encontrado" é `null`, para o `notFound()`.
- `total` e `totalPaginas` vindos dos headers, para a paginação.
- Categorias, tags e autores passam por `cache()` do React: um render que pede a
  lista de categorias em 20 cards faz **uma** requisição.
- Tipos de item completo (`MateriaCompleta`, `VerbeteCompleto`) só vêm das
  consultas de item único — um card não consegue depender do corpo do texto.
