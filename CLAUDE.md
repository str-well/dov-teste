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

**Fase 2 — fundações do front: concluída.**

- **Camada de dados** — `lib/wp/`, entrada única em `lib/wp/index.ts`.
  ~25 funções tipadas, verificadas contra a API de produção. Detalhe abaixo.
- **Fundações visuais** — Tailwind v4 com `@theme` no `app/globals.css`,
  `design/dov-tokens.css` importado, fontes por `next/font`.
- **Componentes globais** — em `components/`, CSS em `app/componentes.css`.
  Cabeçalho nos dois estados, cabeçalho mobile, menu em tela cheia com Radix,
  rodapé, cartão nas 3 variações, imagem com estado vazio, paginação, botões,
  chips e etiquetas. Prancha viva em **`/componentes`**, para comparar com o
  HTML do designer. O banner de consentimento entrou depois, na seção 22 —
  é o único componente sem prancha.

- **Busca com sugestões** — `components/busca-com-sugestoes.tsx`, combobox com
  `downshift` servido por `GET /api/sugestoes`. Tira de chips com rolagem em
  `components/chips-rolagem.tsx`.
- **Páginas institucionais** — a casca em `components/pagina-institucional.tsx`,
  já usada pelas duas páginas legais. Serve Quem Somos e Contato na Fase 3.

**As três decisões que travavam os componentes foram fechadas** — menu em 1280,
sidebar sticky, `navigator.share`. Detalhe em `docs/DESIGN.md`.

**Fase 3 — templates: em andamento.**

- **Matéria** (`/[categoria]/[slug]`) — pronta. As 20 matérias são pré-geradas no
  build, e matéria publicada depois aparece na primeira visita sem rebuild. A URL
  canônica é a da categoria principal; chegar pela categoria secundária
  redireciona, para não haver conteúdo duplicado.
- **Arquivo de categoria** (`/[categoria]`) — pronto. Serve as 7 editorias, com
  filtro por tag, ordenação que funciona sem JavaScript, paginação e os dois
  estados vazios da §7. **Atenção:** esta rota captura `/quem-somos` e
  `/contato`, que hoje caem no 404 dela. Quando o template institucional entrar,
  as duas precisam de rota estática própria.

- **Verbete** (`/almanaque/[termo]`) — pronto. Os 22 verbetes pré-gerados, com
  a linha `classe · etimologia · pronúncia` compondo com o que existir e
  desaparecendo quando os três faltam, caixa "Na prática", relacionados na ordem
  editorial, matérias que citam o termo e anterior/próximo alfabético.

- **Índice A–Z** (`/almanaque`) — pronto. Tira de letras sticky com as vazias em
  cinza e fora da tabulação, blocos por letra, e busca com Fuse.js que filtra na
  hora e tolera erro de digitação. **Sem o `public/almanaque.json`** do plano: a
  lista vai nas props, e o arquivo estático fica para quando o Almanaque crescer.

- **Home** (`/`) — pronta. Hero de busca com o combobox, matéria de capa, últimas,
  bloco de editoria, chamada do Almanaque, duas editorias lado a lado e agenda.
  A curadoria (`HOME_EDITORIA_DESTAQUE`, `HOME_EDITORIAS_DUPLAS`) é constante em
  `lib/site.ts`, por slug — a API não sabe qual editoria merece a home.

- **Institucionais** — prontas. `/quem-somos` e `/contato` são **rotas estáticas**,
  e é isso que as tira do 404 da rota de categoria. Quem Somos mostra a coluna da
  foto só quando existe imagem — `dov_imagens` já vale para `page`, mas nenhuma
  página tem foto ainda. `/busca` com filtro por tipo,
  realce em `<mark>` e os dois estados vazios da §7. `not-found.tsx` e `error.tsx`
  dividem o layout da tela 16.

- **Agenda** — `/agenda` e `/agenda/[slug]`, prontas. **Rota fora do `Anexo C`**,
  acrescentada por decisão sua: o CPT `evento` tinha corpo de texto e nenhum lugar
  para aparecer, então o cartão só era clicável quando havia `dov_link` externo —
  e nenhum dos três eventos tem, ou seja, **nenhum cartão era clicável**. Agora o
  destino é sempre a página do evento, e o link externo virou botão dentro dela.
  O índice separa "Próximos eventos" de "Já aconteceram" e tem o estado vazio da
  §7 quando não há futuros. Cartão único em `components/item-da-agenda.tsx`,
  compartilhado com a home. **Não confundir `/agenda` com `/programe-se`**, que é
  o arquivo de *matérias* da editoria de mesmo nome.

**Fase 3 concluída.** Todas as rotas do `Anexo C` respondem, menos as de
formulário. **Fase 4 é o próximo passo:** deploy e revalidação.

### Analytics e consentimento

Google Analytics 4, escolhido por você, em `components/consentimento.tsx`.

**A regra: nada de GA antes do "aceitar".** Não é modo de consentimento com ping
anônimo — é ausência de script. Enquanto não há decisão, o site não pede nada ao
Google e não escreve cookie de medição nenhum. Verificado no navegador: zero
requisição a `googletagmanager` e `document.cookie` vazio antes do clique.

- **Sem `NEXT_PUBLIC_GA_ID` nada aparece** — nem banner, nem script, nem o botão
  do rodapé. É o estado local e o da build atual.
- **A decisão fica no `localStorage`**, em `dov:consentimento:v1`, não em cookie:
  cookie de consentimento é ele mesmo um cookie e precisaria de cláusula. O `v1`
  existe para o dia em que a lista de finalidades mudar — subir para `v2` faz
  todo mundo decidir de novo, que é o comportamento certo.
- **Revogar recarrega a página.** Desmontar a tag não descarrega o `gtag` que já
  está em memória, então a recusa só valeria na página seguinte. O reload também
  vem depois de expirar os `_ga*` — parar de carregar o script não apaga o
  identificador, que ficaria dois anos esperando um novo "aceitar".
- **"Preferências de cookies" no rodapé** reabre o banner. A LGPD exige que
  revogar seja tão fácil quanto consentir, e o banner não volta sozinho depois da
  primeira decisão.
- **O texto do banner é curto e genérico, por decisão sua** — "este site utiliza
  cookies", sem nomear ferramenta nem medição. Quem carrega o dever de informar
  passa a ser o link para a política: **ele não é ornamento.** Tirar o link deixa
  o consentimento sem informação, que é o único jeito de esse texto curto não se
  sustentar.
- **Sem prancha.** O banner é posterior ao pacote do designer. Montado só com
  tokens e com os botões da seção 3 do `componentes.css` — `--primario` e
  `--contorno`, mesmo tamanho e mesmo peso, porque recusar não pode ser mais
  difícil que aceitar. No mobile é grade de duas colunas iguais.
- **`app/politica-de-privacidade/page.tsx` é o par textual deste componente.**
  A página afirmava por escrito que o site não usava analytics. Se um dos dois
  mudar sem o outro, a política vira declaração falsa. **Mexer nos dois no mesmo
  commit.**

### Pendências que precisam de decisão sua

| O que | Por quê |
|---|---|
| Trecho da busca | A prancha mostra recorte do corpo em volta do termo; a API não devolve. Exigiria endpoint próprio no mu-plugin. **Adiado por você** — "não precisa agora" |
| "Mais lidas" e "mais buscados" | Exigem contagem de acesso. O GA4 já está no código, mas o número só existe depois de semanas de histórico — e traria o front a depender de uma API do Google em runtime |
| Tira de letras abaixo de 352px | Duas linhas de 13 letras dão 24,6px por célula em 360px (passa) e 21,5px em 320px (reprova o mínimo de 24px). O limiar é `13×24 + 40 = 352px` de viewport. Só três linhas resolveriam |

- `lib/wp` ganhou `Fuse.js` como dependência, usada só no índice do Almanaque.

Único refinamento pendente da Fase 2: os blobs decorativos só entraram no menu
mobile. Hero, busca e chamada do Almanaque vão querer o seu quando os templates
chegarem — no máximo um por seção.

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
| **Google Consent Mode v2** | Manda o script subir com consentimento negado e enviar ping sem cookie antes da escolha. Continua sendo requisição ao Google e coleta antes do "sim" — mais difícil de defender do que não carregar nada, e sem ganho para um portal editorial que não faz remarketing. |
| **`@next/third-parties/google`** | O `<GoogleAnalytics>` de lá é essencialmente as duas tags que já estão no `consentimento.tsx`, e o valor do arquivo está justamente em **quando** elas montam. Uma dependência para embrulhar 4 linhas que precisam ficar visíveis. |
| **Animação de entrada no banner** | O banner é controle funcional, não decoração. Animação que não avança deixa o aviso inteiro fora da tela e sobra um retângulo fixo invisível interceptando toque no rodapé — e o navegador embutido do editor congela o relógio de animação, então isso não é hipótese. 250ms de deslize não paga o risco. |
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

As duas seguintes vieram do template de matéria.

14. **O editor de blocos não gera `id` nos títulos.** O sumário "Neste texto"
    precisa de âncora, e sem `id` não há para onde apontar. `prepararArtigo()`
    (`lib/artigo.ts`) acrescenta `id` onde falta e devolve a lista de títulos.
    É a única intervenção no HTML do WordPress, e é intencionalmente mínima —
    `wp-block-*` fica intacto.

15. **Seletor de filho direto some com o wrapper do `dangerouslySetInnerHTML`.**
    O CSS do designer usa `.artigo > p` e `.artigo > h2`, mas o HTML injetado
    vira **neto** do `.artigo`, não filho. O sintoma é silencioso: os títulos
    saem em tamanho de corpo e os parágrafos sem espaçamento. Os seletores miram
    `.artigo__texto`, que é o wrapper. Não trocar por descendente: `.artigo p`
    pegaria também o parágrafo dentro da citação, que tem tipografia própria.

16. **A tira de letras do A–Z não cabe em `flex-wrap`.** 26 itens de 40px com
    6px de vão pedem 1190px; a faixa de conteúdo tem 1185px quando há barra de
    rolagem. A prancha é um artboard de 1440 **sem barra**, então lá cabia, e o
    "Z" caía sozinho na segunda linha na vida real. É grade de 26 colunas.
    Vale a lição geral: medida que fecha justinho na prancha não fecha no
    navegador, porque a barra de rolagem come 15px.

17. **`aspect-ratio` num item de grade `1fr` infla a coluna.** `1fr` é
    `minmax(auto, 1fr)`, então o mínimo do conteúdo entra na conta. A mídia da
    capa da home tem `height: 100%` e o estado vazio traz `aspect-ratio: 16/9`:
    esticado a 520px de altura, ele **exige** 924px de largura, e a capa saía
    500/924 em vez de meio a meio. `aspect-ratio: auto` no filho resolve, e vale
    igual para a foto de verdade, que tem proporção intrínseca.

---

## Variáveis de ambiente

Cadastradas no painel da Hostinger, nunca no repositório:

```
WORDPRESS_API_URL=https://wp.descubraovinho.com.br/wp-json/wp/v2
REVALIDATE_SECRET=<segredo compartilhado com o wp-config.php>
RESEND_API_KEY=<pendente>
NEXT_PUBLIC_GA_ID=<pendente — ID de medição do GA4, formato G-XXXXXXXXXX>
```

O `.env.local` não sobe no deploy.

**`NEXT_PUBLIC_GA_ID` é a única variável com `NEXT_PUBLIC_`, e é de propósito:**
o consentimento e o `gtag` rodam no navegador, então o ID precisa ir no pacote do
cliente. Não é segredo — sai no HTML de qualquer site que use GA. Enquanto ela
não existir, **o banner e o script não aparecem**, e é assim que o ambiente local
e a build atual ficam limpos.

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
- Constantes de marca, navegação e ordem das editorias em `lib/site.ts`. A
  estrutura de `REDES` aceita `url: null`, e o que for `null` não é renderizado —
  faltar um ícone no rodapé é melhor que entregar link morto.
- **`/politica-de-privacidade` e `/termos-de-uso` são rascunho.** Rotas do Next,
  não páginas do WordPress. As lacunas aparecem em `<mark>` no texto — razão
  social, CNPJ, encarregado de dados, prazo de retenção, declaração de
  publicidade e comarca. Enquanto houver um `<mark>` visível, a página não está
  pronta para publicar. Falta revisão jurídica.
- **Nada de aviso de obra na tela.** Pendência de projeto mora no código e nos
  documentos, não num banner que o leitor lê. Havia três (`aviso-rascunho`) e
  foram removidos.
- **Os endereços de Instagram e YouTube em `lib/site.ts` não foram confirmados.**
  São o handle da marca, e `instagram.com/descubraovinho` pode ser de outra
  pessoa. Conferir com o cliente antes do lançamento.

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

**Não existe tamanho 4:5**, que a prancha institucional pede. Foto em retrato usa
`dov_corpo`, de largura fixa e altura livre — ele preserva a proporção do arquivo
enviado, então quem sobe a foto de Quem Somos define a altura da coluna.

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
- **Todo fetch tem `next: { revalidate: 300 }`**, sem exceção e sem `no-store`.
  As taxonomias já ficaram em 3600 e voltaram para 300: o cache de fetch do Next
  é indexado por URL e compartilhado entre páginas, então 3600 poupava 11
  requisições por hora — e em troca deixava o menu com editoria renomeada errada
  por até uma hora, porque o mu-plugin revalida caminho no save de post e não
  mexe em termo.
- Tipos de item completo (`MateriaCompleta`, `VerbeteCompleto`) só vêm das
  consultas de item único — um card não consegue depender do corpo do texto.
- `sugestoes()` devolve item pronto, com `href` montado, porque quem consome é o
  cliente pela rota `/api/sugestoes` e não deve resolver categoria nem rota.

### Rotas de API

| Rota | Papel |
|---|---|
| `/api/revalidate` | Chamada pelo mu-plugin no `transition_post_status` |
| `/api/sugestoes` | Sugestões do combobox. `GET ?q=`, mínimo 3 caracteres, `s-maxage=300` |
| `/api/health` | Versão do Node, uptime e `pid`. Alvo do monitor externo |
