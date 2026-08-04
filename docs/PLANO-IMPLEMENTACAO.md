# Descubra o Vinho — Plano de Implementação

Portal editorial de vinho. WordPress headless como backend, Next.js como frontend,
tudo no plano Hostinger Cloud já contratado. Custo adicional: zero.

`v10 · 03/08/2026` — Fases 0, 1 e 2 concluídas. **Fase 3 em andamento:** matéria,
arquivo de categoria, verbete e índice A–Z prontos. Faltam a home e as
institucionais.
Ver `../CLAUDE.md` para o resumo de decisões, `BACKEND.md` para o contrato da API
e `DESIGN.md` para o pacote do designer.

---

## Sumário

1. [Arquitetura](#1-arquitetura)
2. [Stack](#2-stack)
3. [Fase 0 — Validação da infraestrutura](#3-fase-0--validação-da-infraestrutura) ✅
4. [Fase 1 — WordPress do zero](#4-fase-1--wordpress-do-zero) ✅
5. [Fase 2 — Fundações do front](#5-fase-2--fundações-do-front) ✅
6. [Fase 3 — Templates](#6-fase-3--templates) ←
7. [Fase 4 — Deploy e revalidação](#7-fase-4--deploy-e-revalidação)
8. [Fase 5 — Antes de entregar](#8-fase-5--antes-de-entregar)
9. [Riscos e planos B](#9-riscos-e-planos-b)
10. [Anexo A — Design tokens](#anexo-a--design-tokens)
11. [Anexo B — Modelo de conteúdo](#anexo-b--modelo-de-conteúdo)
12. [Anexo C — Rotas](#anexo-c--rotas)

---

## 1. Arquitetura

```
                     ┌───────────────────────────┐
                     │    Cloudflare (free)      │
                     │    DNS · CDN · cache      │
                     └─────────┬─────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
    dominio.com                           wp.dominio.com
    Next.js · Node App                    WordPress + mu-plugin próprio
    ISR em disco                          admin · REST API · uploads
            │                                     │
            └──── mesmo plano Hostinger Cloud ────┘
                     (1 de 10 apps web)
```

| Decisão | Escolha |
|---|---|
| Front | Node.js Web App no Hostinger Cloud |
| Backend | WordPress novo em `wp.dominio.com`, mesmo plano |
| DNS / CDN | Cloudflare free |
| Renderização | ISR nativo do Next |
| Imagens | Do WordPress via Cloudflare, tamanhos fixos, `unoptimized` |
| Busca do Almanaque | JSON estático no build + Fuse.js no cliente |
| Busca de matérias | REST API com `revalidate: 60` + debounce de 300 ms |
| E-mail | Resend |

---

## 2. Stack

**Backend**
WordPress headless · **mu-plugin próprio** (`wordpress/dov-headless.php`) · REST API
em `/wp-json/wp/v2/`.
Nenhum plugin de terceiro. Elementor não participa da entrega do front.

**Frontend**
Next.js 15 · App Router · TypeScript · **Tailwind CSS v4** (configuração em CSS, sem
`tailwind.config`) · Radix (Dialog e combobox, só os primitivos) · `downshift` ·
Cormorant Garamond + DM Sans via `next/font` (self-hosted) · Fuse.js ·
`generateMetadata` nativo · `output: 'standalone'`.

---

## 3. Fase 0 — Validação da infraestrutura

Feita com um projeto descartável antes de escrever qualquer linha do portal.

| Verificação | Resultado |
|---|---|
| `next build` no servidor | ✅ Concluído em 1m0s, sem estourar memória |
| Deploy no `git push` | ✅ Implantação automática ligada |
| Versão do Node | ✅ v22.18.0 |
| ISR revalidando | ✅ Parado nas recargas, avança sozinho após 60s |
| HTTP de saída | ✅ Liberado |
| Consumo do app | ✅ RSS 109 MB · CPU 7% |
| Backups | ✅ Diários, inclusos |
| CDN da Hostinger | ✅ Ativo |
| Capacidade | ✅ 10 apps web no plano |
| Estabilidade do processo | ✅ 11h+ sem queda |

**Único item aberto.** Anotar o `pid` em `/api/health` e conferir no dia seguinte:

- PID igual → processo estável
- PID diferente → caiu e voltou sozinho, há gerenciador de processo (aceitável)
- Site fora do ar → sem reinício automático, **bloqueador para site de cliente**

Com SSH, dá para antecipar: `kill <PID>` e recarregar o site alguns segundos depois.

---

## 4. Fase 1 — WordPress do zero ✅ CONCLUÍDA

Não há site anterior. Isso elimina search-replace no banco, redirects de URLs antigas
e troca de endereço de admin. Instala-se direto no lugar definitivo.

### 4.1 Instalação

- [x] Criar o subdomínio `wp.dominio.com` no hPanel
- [x] Instalar WordPress nele (hPanel → Add Website → WordPress)
- [x] Usuário administrador com login **não óbvio** — nada de `admin`
- [x] Idioma pt-BR, fuso `America/Sao_Paulo`, formato de data brasileiro
- [x] Permalinks em `/%postname%/`
- [x] SSL ativo e forçado

### 4.2 Higiene inicial

- [x] Remover temas e plugins que vêm por padrão (Hello Dolly, Akismet se não usar,
      temas Twenty*)
- [x] Tema: um único tema leve ativo. O front do WordPress não será visto por
      ninguém — opcionalmente, redirecionar todo o front do WP para `dominio.com`
- [x] Desativar comentários globalmente
- [x] Desativar XML-RPC
- [x] Desabilitar edição de arquivos pelo painel: `define('DISALLOW_FILE_EDIT', true);`
- [x] Nenhum endpoint protegido: a leitura é toda pública. Sem Application Password

### 4.3 Plugins

**Nenhum.** O que estava previsto aqui foi todo substituído — ver a tabela de
decisões fechadas no `CLAUDE.md`:

| Previsto | O que ficou no lugar |
|---|---|
| JetEngine | `wordpress/dov-headless.php`: CPTs, campos, tamanhos de imagem, CORS e revalidação. A licença expirou, e o mu-plugin faz o necessário em 626 linhas |
| LiteSpeed Cache (REST) | O ISR do Next **é** o cache. Cachear a REST API cria corrida com a revalidação: o webhook dispara no save, o Next busca antes do purge e recebe conteúdo velho, sem erro visível |
| Relevanssi | O `search` nativo da REST API resolve. `lib/wp` já cruza matérias e verbetes numa consulta |
| Conversor WebP | `add_image_size` no mu-plugin gera os tamanhos nomeados |

Cada plugin é peso no mesmo plano que hospeda o front. Zero é o número certo.

### 4.4 Modelo de conteúdo

Registrar tudo com **`show_in_rest: true`** — é o passo que mais gente esquece, e sem
ele nada aparece na API. Detalhamento no [Anexo B](#anexo-b--modelo-de-conteúdo).

- [x] `post` nativo para matérias
- [x] Categorias: as 7 editorias
- [x] Tags: os temas dos chips de filtro
- [x] CPT `verbete` — Almanaque, com campos e relação de verbetes vizinhos
- [x] CPT `evento` — agenda do Programe-se
- [x] Páginas nativas: Quem Somos, Contato
- [x] Campos de autor: retrato 1:1 e minibio
- [x] Conferir cada endpoint no navegador antes de seguir

### 4.5 Imagens

- [x] Tamanhos registrados no mu-plugin (`add_image_size`), com os nomes `dov_*`:

| Uso | Proporção | Dimensão | Peso alvo |
|---|---|---|---|
| Hero da home | 16:9 | 1920×1080 | ≤ 200 kB |
| Destaque da matéria | 3:2 | 1600×1067 | ≤ 160 kB |
| Card de notícia | 3:2 | 800×533 | ≤ 70 kB |
| Card em destaque | 4:3 | 1200×900 | ≤ 120 kB |
| Imagem no corpo | 3:2 ou 4:5 | 1200 de largura | ≤ 120 kB |
| Retrato / autor | 1:1 | 240×240 | ≤ 20 kB |

- [x] Desativar os tamanhos padrão do WordPress que não serão usados
- [ ] Cloudflare na frente de `wp.descubraovinho.com.br` com cache agressivo em
      `/wp-content/uploads` — hoje o Cloudflare é **só DNS**. A avaliar depois do lançamento

### 4.6 API e performance

- [x] CORS liberando `dominio.com` nos headers da REST API
- [x] **Sem cache de REST API.** Era o plano, e foi descartado: cria corrida com a
      revalidação. Quem economiza consulta é o ISR, mais o `_fields` explícito e o
      `cache()` por render em `lib/wp`
- [x] Bloquear indexação do subdomínio: `noindex` no `wp.`
- [x] Testar tempo de resposta dos endpoints principais

### 4.7 Conteúdo mínimo para desenvolver

- [x] **20 matérias** distribuídas nas 7 editorias, com olho, tags e autor —
      **sem foto**: nenhum conteúdo tem imagem destacada ainda, e é por isso que
      todo componente de imagem nasceu com estado vazio
- [x] **22 verbetes**, cobrindo A B C D E M S T V. **K, Q, W, X, Y e Z ficaram
      vazias de propósito** — é o que permite testar a letra em cinza e sem link
- [x] 3 eventos na agenda, em setembro e outubro de 2026
- [x] Quem Somos e Contato preenchidas

Sem isso, os templates são construídos contra dados falsos e quebram na virada.

---

## 5. Fase 2 — Fundações do front ✅ CONCLUÍDA

- [x] Projeto Next + TypeScript + **Tailwind v4**, com `design/dov-tokens.css`
      importado e exposto pelo `@theme` do `app/globals.css`.
      **Não existe `tailwind.config`** — a configuração é o CSS
- [x] Grade: 12 colunas · conteúdo 1200 · gutter 32 · margem 120 (ref. 1440)
- [x] **Camada de dados** — `lib/wp/`, entrada única em `index.ts`, ~25 funções
      tipadas, tipos derivados da resposta real da API. Verificada contra
      produção. Ver `CLAUDE.md`
- [x] **Componentes globais** — cabeçalho nos dois estados, cabeçalho mobile,
      menu em tela cheia, rodapé, cartão nas 3 variações, imagem com estado
      vazio, paginação, botões, chips, etiquetas. Prancha viva em `/componentes`
- [x] Barra de busca — o `<form>` GET, que funciona sem JavaScript
- [x] Área de toque mínima de 48×48 no mobile, nos ícones do cabeçalho e nos chips
- [x] `prefers-reduced-motion` respeitado — já vem dos tokens
- [x] **Painel de sugestões da busca** — combobox com `downshift` em
      `components/busca-com-sugestoes.tsx`, servido por `GET /api/sugestoes`.
      3 caracteres, 250 ms de debounce, no máximo 8 itens **intercalando** matéria
      e verbete, acerto exato de verbete no topo, `<mark>` no trecho que casa,
      setas circulando, `Esc` mantendo o texto, e os três estados (carregando,
      vazio, erro). Sem JavaScript o campo continua submetendo para `/busca`
- [x] Rolagem da tira de chips no mobile — `components/chips-rolagem.tsx`, com
      `scrollLeft` e não `scrollIntoView`, que rolaria o documento inteiro
- [ ] Blobs como componentes SVG — no máximo um por seção, e só em hero, busca e
      chamada do Almanaque. Hoje só o do menu mobile está em uso

**Escala tipográfica fora do Tailwind, de propósito.** Retipá-la em utilitários é
onde o designer avisa que a fidelidade escorre; tipografia herda o CSS do mockup,
e o Tailwind cuida de grade, espaçamento e responsividade.

---

## 6. Fase 3 — Templates ← EM ANDAMENTO

A ordem começa pelo template mais complexo, para que os componentes nasçam testados
no caso difícil.

| # | Template | Rota | Peças específicas |
|---|---|---|---|
| 1 ✅ | Matéria | `/[categoria]/[slug]` | sumário "Neste texto", citação, imagem com legenda e crédito, caixa "Do Almanaque", newsletter, tags, relacionados |
| 2 ✅ | Arquivo de categoria | `/[categoria]` | serve as 7 editorias; chips com rolagem horizontal no mobile, ordenação, paginação |
| 3 ✅ | Verbete | `/almanaque/[termo]` | etimologia, caixa "Na prática", verbetes relacionados, matérias que usam o termo, anterior/próximo |
| 4 ✅ | Índice A–Z | `/almanaque` | navegação alfabética sticky; letras sem verbete em cinza e sem link |
| 5 | Home | `/` | hero de busca, matéria de capa, últimas, bloco Viaje, faixa do Almanaque, Harmonize + Mercado, agenda |
| 6 | Institucionais | vários | Quem Somos, busca, busca sem resultados, 404 |

### Notas do índice A–Z

- **A tira de letras é grade, não `flex-wrap`.** 26 itens de 40px com 6px de vão
  pedem 1190px, e a faixa de conteúdo tem 1185px quando existe barra de rolagem —
  a prancha é um artboard de 1440 sem barra, então lá cabia. Na vida real o "Z"
  caía sozinho numa segunda linha por 5px. Com grade de 26 colunas a tira é
  sempre uma linha.
- **No mobile são duas linhas de 13, com vão zero.** A §6 pede duas linhas *e*
  alvos de 36px, e as duas coisas não cabem: com 4px de vão a célula fica com
  22px de largura, abaixo do mínimo de 24×24 do WCAG 2.5.8. Sem vão dá 25,8px em
  tela de 375px, e a altura de 36px é preservada. **Em telas de 360px ou menos
  nem isso alcança 24px** — aí só três linhas resolveriam, e é uma pergunta para
  o designer.
- **A tira gruda abaixo do cabeçalho reduzido** (68px) no desktop e no topo no
  mobile, onde o cabeçalho rola com a página. A âncora das seções desconta
  cabeçalho + tira + 16px: 160px no desktop, 116px no mobile.
- **Percorrer o alfabeto não empilha histórico.** `history.replaceState`, como a
  §6 manda: sem isso o botão voltar precisaria de 26 toques para sair da página.
- **A busca filtra o índice na hora, e é tolerante a erro.** `batonage` encontra
  "Bâtonnage" — é por isso que vale o Fuse.js em vez de um `includes`. Sem
  JavaScript o campo leva para a busca geral. As letras da tira acompanham o
  filtro: buscar "espuman" deixa só B e E clicáveis.

### Notas do verbete

- **Não existe campo de classe gramatical.** A prancha abre a linha com
  "substantivo masculino", e os campos do verbete no mu-plugin são definição
  curta, etimologia, pronúncia, "na prática" e relacionados. A linha é montada
  com o que existe. Se a classe gramatical importar, é um campo novo — decisão do
  cliente.
- **A linha desaparece inteira** quando etimologia e pronúncia estão as duas
  vazias, como manda o `BACKEND.md` — o que é o caso da maioria dos 22 verbetes.
  Com só uma das duas, ela aparece com o que tem: `brut` mostra apenas a pronúncia.
- **A busca da lateral aponta para a busca geral.** A prancha diz "Buscar outro
  verbete", e uma busca restrita ao Almanaque é a do índice A–Z com Fuse.js. Até
  ela existir, o texto da caixa foi ajustado para não prometer um escopo que não
  há.
- **"Matérias que usam o termo" fica no mobile**, ao contrário da prancha
  `10-verbete-mobile`, que a descarta. É o elo do Almanaque de volta para as
  matérias. Costuma vir vazia: `terroir` não aparece escrito em nenhuma matéria,
  e a caixa então não é renderizada.
- **`/almanaque` ainda dá 404.** As migalhas do verbete e o link da letra
  apontam para lá, e ficam mortos até o índice A–Z entrar. É o próximo template
  justamente por isso.

### Notas do arquivo de categoria

- **"Mais lidas" saiu da ordenação.** A prancha oferece essa opção, e ela exige
  contagem de visualização — não há analytics nem plugin de contador, por decisão
  de não instalar nada. Ficaram "Mais recentes", "Mais antigas" e "Título A–Z",
  que a API entrega com `orderby`. Se o cliente quiser "Mais lidas", é preciso
  decidir de onde vem o número.
- **As tags do filtro são só as usadas naquela editoria.** A API não cruza
  taxonomias, então `tagsDaCategoria()` levanta as tags das matérias da
  categoria. Sem isso a tira mostraria as 16 tags do site e a maioria daria lista
  vazia — o filtro prometeria resultado inexistente.
- **A ordenação funciona sem JavaScript.** É um `<form method="get">` com um botão
  "Aplicar" visível só para leitor de tela e teclado. Com JavaScript, trocar a
  opção navega na hora.
- **`/quem-somos` e `/contato` passam por esta rota.** Hoje caem no `notFound()`,
  o mesmo 404 de antes. Quando o template institucional entrar (item 6), as duas
  precisam de rota estática própria, que vence a dinâmica por precedência. As
  páginas legais já são estáticas e não passam por aqui.
- **Fora de alcance é 404, não estado vazio.** `?pagina=99` numa editoria com
  conteúdo é URL digitada errada; `?tag=inexistente` também. Estado vazio é para
  editoria sem matéria e para filtro que não casa.

### Notas do template de matéria

- **URL canônica.** Uma matéria em duas editorias seria alcançável por duas URLs,
  e o buscador leria como conteúdo duplicado. A rota usa a categoria principal;
  chegar pela secundária redireciona para ela. Categoria que a matéria não tem
  dá 404. *Este caminho não foi exercitado: nenhuma matéria de teste está em
  mais de uma editoria.*
- **Sumário "Neste texto".** Depende de `id` nos títulos, que o editor de blocos
  não gera — `prepararArtigo()` os acrescenta. Ver a armadilha 14 do `CLAUDE.md`.
- **Divergência deliberada da prancha mobile.** `06-materia-mobile` descarta a
  lateral inteira. Sumário e newsletter saem no mobile como na prancha, mas
  **"Do Almanaque" e compartilhar ficam**: o primeiro é o elo entre matéria e
  Almanaque, e o segundo é onde o `navigator.share` justamente funciona.
- **Sem foto de destaque a moldura não aparece.** Nenhuma matéria tem imagem
  hoje; uma moldura vazia de 1600×1067 no topo seria um buraco, não estado vazio.

- [x] **Busca do Almanaque, sem o `public/almanaque.json`.** O arquivo exigiria um
      passo de build próprio, e o projeto tem como preferência minimizar
      infraestrutura. A lista vai nas props do componente cliente: com 22 verbetes
      são ~3 kB, na única página que precisa dela. **Perto dos 418 verbetes
      prometidos (~80 kB) vale voltar para o arquivo estático**, que o navegador
      cacheia independente do HTML. `indiceDoAlmanaque()` em `lib/wp` continua
      disponível para esse dia
      (≈80 kB para 418 verbetes)

---

## 7. Fase 4 — Deploy e revalidação

Simplificada: com processo Node de verdade, o ISR funciona como na documentação
oficial. Sem OpenNext, sem KV, sem wrangler.

- [ ] `next.config.js` com `output: 'standalone'` e o domínio de imagens em
      `remotePatterns`
- [ ] Variáveis no painel da Hostinger — nunca no repositório:
      `WORDPRESS_API_URL`, `REVALIDATE_SECRET`, `RESEND_API_KEY`
- [ ] Rota `/api/revalidate` protegida por secret, chamando `revalidatePath`
- [ ] Hook `save_post` no WordPress chamando a rota, com trava contra revisão
      automática e contra loop
- [ ] Fallback por tempo (`revalidate: 300`) nas páginas de listagem, caso o hook falhe
- [ ] Teste real: publicar uma matéria e cronometrar até aparecer

---

## 8. Fase 5 — Antes de entregar

- [ ] Lighthouse nos quatro templates principais
- [ ] `sitemap.xml` dinâmico, incluindo os verbetes
- [ ] `robots.txt` com a busca em `noindex` e crawl-delay
- [ ] Formulário de contato e newsletter testados de ponta a ponta
- [ ] Acessibilidade: contraste (paleta já validada em AAA), navegação por teclado,
      foco visível, `alt` em todas as imagens
- [ ] **Fotografia real no lugar dos placeholders** — maior risco não técnico do projeto
- [ ] **Cores do logo conferidas contra os arquivos oficiais da marca**
- [ ] **Revisão jurídica da política de privacidade e dos termos de uso.** Os dois
      são rascunho, e trazem pendências marcadas em `<mark>` que aparecem na tela
      de propósito: razão social e CNPJ, encarregado de dados, prazo de retenção
      das mensagens de contato, declaração de publicidade e comarca do foro.
      **Enquanto houver um `<mark>` na página, ela não está pronta para publicar**
- [ ] **Confirmar os perfis de Instagram e YouTube com o cliente.** Os endereços
      em `lib/site.ts` são o handle da marca, não confirmados — podem pertencer a
      outra pessoa, e o rodapé apontaria para um terceiro
- [ ] Remover as rotas internas `/diagnostico` e `/componentes`
- [ ] Tirar o `robots: { index: false }` do `app/layout.tsx`
- [ ] Monitor externo de uptime (UptimeRobot free) apontado para `/api/health`
- [ ] Domínio apontado, Cloudflare configurado
- [ ] Documentar para o cliente: onde publicar, quanto tempo leva para aparecer

---

## 9. Riscos e planos B

| Risco | Sinal | Plano B |
|---|---|---|
| Processo Node cai e não volta | Site fora do ar sem aviso | Monitor externo; se recorrente, mover front para Cloudflare free |
| WordPress e Next disputando recursos | Lentidão simultânea nos dois | Aumentar o `revalidate`; imagens 100% via Cloudflare |
| Campo novo não aparece na API | Ausente no JSON, sem erro | Conferir `custom-fields` em `supports` e a lista `CAMPOS` de `lib/wp/consultas.ts` |
| Publicação não reflete no site | Conteúdo novo invisível | Conferir o hook; fallback por tempo já previsto |
| Busca da home mais ampla que o combinado | Precisa cruzar CPTs | `buscar()` já consulta matérias e verbetes juntos |
| Fotografia não chega a tempo | Placeholders na véspera | Definir com o cliente uma data-limite, não a data de lançamento |

**Saída de emergência, gratuita:** o mesmo repositório sobe no Cloudflare free com o
adaptador OpenNext. Por isso: nada de código específico de host, nenhuma dependência
`@vercel/*`, `next/image` e `revalidatePath` padrão.

---

## Anexo A — Design tokens

> **Este anexo não é fonte de valor.** A fonte única é `design/dov-tokens.css`,
> que chegou com o pacote do designer e está importado no `app/globals.css`.
>
> A tabela de cores que ficava aqui vinha de amostragem de imagem em baixa
> resolução, e **5 dos 8 hex estavam errados** — `#6B1775` no lugar de `#681775`,
> `#F3EFEA` no lugar de `#F3E8E8`, `#9BBA36` no lugar de `#95BA34`, `#212D45` no
> lugar de `#202D42`, `#9155A4` no lugar de `#9158A4`. Foi removida em vez de
> corrigida: duas cópias do mesmo valor divergem de novo, e essa já é a
> armadilha nº 5 do `CLAUDE.md`.
>
> O `@theme` do Tailwind não deixa mais o erro passar: a paleta padrão está
> zerada, então só compila utilitário que aponte para um token de verdade.

O que consultar, e onde:

| Assunto | Onde |
|---|---|
| Cor, tipografia, espaçamento, movimento, camadas | `design/dov-tokens.css` |
| Como os tokens entram no Tailwind | `app/globals.css`, bloco `@theme` |
| Componentes globais em CSS | `app/componentes.css` |
| Mapa tela → template, decisões, o que já está em pé | `docs/DESIGN.md` |
| Comportamento que os mockups não mostram | `design/ESPECIFICACAO-DE-INTERACAO.md` |

Regra de contraste que vale repetir: **verde-limão nunca com texto branco** —
usar sobre marinho.

**Um H1 por página.** Cormorant nunca em bold — máximo 500. Números tabulares em
datas, letras do Almanaque e paginação.

**Breakpoints** — três faixas, e uma quarta fronteira só para o cabeçalho:

| Faixa | Margem | Colunas | Gutter |
|---|---|---|---|
| Desktop (ref. 1440) | 120 | 12 de 68 · conteúdo 1200 | 32 |
| Tablet 768–1024 | 48 | cards em 2 colunas | 24 |
| Mobile ≤ 767 | 20 | 1 | 32 vertical |

A escala tipográfica vira em **767**. O menu vira hambúrguer em **1280**, não em
1024: abaixo disso as 7 editorias mais Almanaque e busca não caberiam na linha.
São dois limites diferentes — `desktop:` é tipografia, `menu:` é cabeçalho.

Cards: 3 colunas (4+4+4) em listagem, 2 (6+6) em destaques, 8+4 na matéria com sidebar.

---

## Anexo B — Modelo de conteúdo

**`post` — matérias** (tipo nativo)
Categoria (7 editorias) · tags (temas dos chips) · imagem destacada · resumo/olho ·
autor · tempo de leitura · verbetes relacionados (relação com `verbete`)

**`verbete` — Almanaque** (CPT)
Definição curta (usada em cards e resultados de busca) · texto completo ·
etimologia e pronúncia · caixa "Na prática" · verbetes vizinhos (relação) ·
a letra do índice é derivada do título, não é campo

**`evento` — Programe-se** (CPT)
Data de início e fim · cidade ou "online" · descrição curta · link externo

**Autor** (usuário do WP)
Retrato 1:1 · minibio

Tudo com `show_in_rest: true`. **E o CPT precisa declarar `custom-fields` em
`supports`** — sem isso o `meta` grava no banco e desaparece da resposta, sem erro.

---

## Anexo C — Rotas

```
/                          home
/quem-somos
/contato
/busca?q=                  noindex
/almanaque                 índice A–Z
/almanaque/[termo]         verbetes
/descubra                  ┐
/curiosidades              │
/harmonize                 │  mesmo template
/mercado                   │  de arquivo
/saude-e-ciencia           │
/viaje                     │
/programe-se               ┘
/[categoria]/[slug]        matéria
/api/revalidate            POST, protegida por secret
/api/contato               POST, Resend
/api/newsletter            POST, Resend
/api/health                diagnóstico, útil para o monitor de uptime
/sitemap.xml
/robots.txt
404
```
