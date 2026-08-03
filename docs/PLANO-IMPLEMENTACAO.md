# Descubra o Vinho — Plano de Implementação

Portal editorial de vinho. WordPress headless como backend, Next.js como frontend,
tudo no plano Hostinger Cloud já contratado. Custo adicional: zero.

`v4 · 03/08/2026` — o repositório do teste virou o front do projeto; Fase 0 detalhada
em documento próprio, Fase 2 partindo do projeto que já existe.
`v3 · 02/08/2026` — revisada após o teste de hospedagem passar e com a Fase 1
reescrita para instalação nova (não há WordPress a migrar).

---

## Sumário

1. [Arquitetura](#1-arquitetura)
2. [Stack](#2-stack)
3. [Fase 0 — Validação da infraestrutura](#3-fase-0--validação-da-infraestrutura) ✅
4. [Fase 1 — WordPress do zero](#4-fase-1--wordpress-do-zero)
5. [Fase 2 — Fundações do front](#5-fase-2--fundações-do-front)
6. [Fase 3 — Templates](#6-fase-3--templates)
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
    Next.js · Node App                    WordPress + JetEngine
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
WordPress headless · JetEngine (Crocoblock) · LiteSpeed Cache · REST API em
`/wp-json/wp/v2/` e endpoints do JetEngine.
Elementor não participa da entrega do front.

**Frontend**
Next.js 15 · App Router · TypeScript · Tailwind CSS · shadcn/ui ·
Cormorant Garamond + DM Sans via `next/font` (self-hosted) · Fuse.js ·
`generateMetadata` nativo · `output: 'standalone'`.

---

## 3. Fase 0 — Validação da infraestrutura

Feita com um projeto descartável antes de escrever qualquer linha do portal — o app de
diagnóstico que está na raiz deste repositório (ver o [README](../README.md)).

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
| **Reinício automático** | ⏳ **Pendente** |

**Único item aberto.** Anotar o `pid` em `/api/health` e conferir no dia seguinte:

- PID igual → processo estável
- PID diferente → caiu e voltou sozinho, há gerenciador de processo (aceitável)
- Site fora do ar → sem reinício automático, **bloqueador para site de cliente**

Com SSH, dá para antecipar: `kill <PID>` e recarregar o site alguns segundos depois.

### 3.1 O que o teste deixou pronto

O app do teste não foi descartado: **este repositório é o front**. O painel de
diagnóstico foi para `/diagnostico`, `/` recebeu uma home provisória, e as duas rotas
de API já são as de produção — `/api/revalidate` é o destino do hook `save_post` da
[Fase 4](#7-fase-4--deploy-e-revalidação), `/api/health` é o alvo do monitor de uptime
e o lugar onde o `pid` do item pendente acima é conferido.

Registro completo em [FASE-0-TESTE-HOSPEDAGEM.md](FASE-0-TESTE-HOSPEDAGEM.md).

O caminho de deploy no hPanel já foi percorrido e não precisa ser redescoberto:

| | |
|---|---|
| Caminho no painel | Websites → Add Website → Deploy Web App → GitHub |
| Build command | `npm run build` |
| Start command | `node .next/standalone/server.js` |

Sobre o subdomínio de teste: ele pode ser apagado assim que o item do reinício
automático for encerrado. Enquanto isso, serve de ambiente de observação — e vale
lembrar que **cada deploy zera o `uptime`**, invalidando uma leitura em andamento.

---

## 4. Fase 1 — WordPress do zero

Não há site anterior. Isso elimina search-replace no banco, redirects de URLs antigas
e troca de endereço de admin. Instala-se direto no lugar definitivo.

### 4.1 Instalação

- [ ] Criar o subdomínio `wp.dominio.com` no hPanel
- [ ] Instalar WordPress nele (hPanel → Add Website → WordPress)
- [ ] Usuário administrador com login **não óbvio** — nada de `admin`
- [ ] Idioma pt-BR, fuso `America/Sao_Paulo`, formato de data brasileiro
- [ ] Permalinks em `/%postname%/`
- [ ] SSL ativo e forçado

### 4.2 Higiene inicial

- [ ] Remover temas e plugins que vêm por padrão (Hello Dolly, Akismet se não usar,
      temas Twenty*)
- [ ] Tema: um único tema leve ativo. O front do WordPress não será visto por
      ninguém — opcionalmente, redirecionar todo o front do WP para `dominio.com`
- [ ] Desativar comentários globalmente
- [ ] Desativar XML-RPC
- [ ] Desabilitar edição de arquivos pelo painel: `define('DISALLOW_FILE_EDIT', true);`
- [ ] Criar **Application Password** para o Next consumir endpoints protegidos, se
      houver

### 4.3 Plugins

| Plugin | Para quê | Custo |
|---|---|---|
| JetEngine | CPTs, campos, relações | licença já existente |
| LiteSpeed Cache | cache de página e de REST API | free |
| Relevanssi | busca cruzando matérias e verbetes | free |
| Conversor WebP | geração automática dos formatos | free |

Nada além disso sem motivo forte. Cada plugin é peso no mesmo plano que hospeda o front.

### 4.4 Modelo de conteúdo

Registrar tudo com **`show_in_rest: true`** — é o passo que mais gente esquece, e sem
ele nada aparece na API. Detalhamento no [Anexo B](#anexo-b--modelo-de-conteúdo).

- [ ] `post` nativo para matérias
- [ ] Categorias: as 7 editorias
- [ ] Tags: os temas dos chips de filtro
- [ ] CPT `verbete` — Almanaque, com campos e relação de verbetes vizinhos
- [ ] CPT `evento` — agenda do Programe-se
- [ ] Páginas nativas: Quem Somos, Contato
- [ ] Campos de autor: retrato 1:1 e minibio
- [ ] Conferir cada endpoint no navegador antes de seguir

### 4.5 Imagens

- [ ] Registrar os tamanhos em `functions.php`, todos exportados em WebP:

| Uso | Proporção | Dimensão | Peso alvo |
|---|---|---|---|
| Hero da home | 16:9 | 1920×1080 | ≤ 200 kB |
| Destaque da matéria | 3:2 | 1600×1067 | ≤ 160 kB |
| Card de notícia | 3:2 | 800×533 | ≤ 70 kB |
| Card em destaque | 4:3 | 1200×900 | ≤ 120 kB |
| Imagem no corpo | 3:2 ou 4:5 | 1200 de largura | ≤ 120 kB |
| Retrato / autor | 1:1 | 240×240 | ≤ 20 kB |

- [ ] Desativar os tamanhos padrão do WordPress que não serão usados
- [ ] Cloudflare na frente de `wp.dominio.com` com cache agressivo em `/wp-content/uploads`

### 4.6 API e performance

- [ ] CORS liberando `dominio.com` nos headers da REST API
- [ ] LiteSpeed Cache com **cache de REST API ligado** — deixa de ser refinamento e
      passa a ser requisito, já que WordPress e Next dividem CPU e RAM
- [ ] Bloquear indexação do subdomínio: `noindex` no `wp.`
- [ ] Testar tempo de resposta dos endpoints principais

### 4.7 Conteúdo mínimo para desenvolver

- [ ] 2 matérias por editoria (14 no total), com foto, olho, tags e autor
- [ ] 30 verbetes cobrindo letras variadas, incluindo alguma sem verbete para testar
      o estado cinza no índice A–Z
- [ ] 3 eventos na agenda
- [ ] Quem Somos e Contato preenchidas

Sem isso, os templates são construídos contra dados falsos e quebram na virada.

---

## 5. Fase 2 — Fundações do front

O projeto Next + TypeScript já existe (veio da Fase 0). Aqui ele deixa de ser um app de
diagnóstico e passa a ser o portal.

- [ ] Trazer o handoff do designer para o repositório (`dov-tokens.css`, SVGs, mockups)
- [ ] Adicionar Tailwind + shadcn/ui, com os tokens gerados a partir do
      `dov-tokens.css` — papel de cada cor no [Anexo A](#anexo-a--design-tokens)
- [ ] Substituir o `app/globals.css` do diagnóstico (CSS monospace provisório) pelo
      do design system, e trocar a home provisória pela real na [Fase 3](#6-fase-3--templates)
- [ ] Escala tipográfica desktop e mobile no `tailwind.config`
- [ ] Grade: 12 colunas · conteúdo 1200 · gutter 32 · margem 120 (ref. 1440)
- [ ] Blobs como componentes SVG — no máximo um por seção, e só em hero, busca e
      chamada do Almanaque
- [ ] **Camada de dados**: um módulo único com funções tipadas (`getPosts`,
      `getPostBySlug`, `getCategory`, `getVerbetes`, `getEventos`, `search`), com
      tipos derivados da resposta real da API — não inventados
- [ ] **Componentes globais**
  - Cabeçalho desktop: fixo no scroll, 92 px encolhendo para 68 px; ativo com filete
    roxo 2 px; hover com filete verde-limão, transição 150 ms
  - Cabeçalho mobile: overlay em tela cheia, itens em Cormorant, busca no topo,
    Almanaque como único item com botão cheio
  - Rodapé, idêntico em todas as telas
  - Barra de busca: 72 px de altura, raio 999 px, borda lilás 1 px; foco com borda
    roxa 2 px e anel visível
  - Card de notícia: padrão, hover (título roxo, filete sob a imagem, foto 1,03× em
    250 ms) e compacto para listas laterais
  - Paginação, chips de filtro, tags
- [ ] Área de toque mínima de 48×48 no mobile
- [ ] `prefers-reduced-motion` respeitado nas transições

---

## 6. Fase 3 — Templates

A ordem começa pelo template mais complexo, para que os componentes nasçam testados
no caso difícil.

| # | Template | Rota | Peças específicas |
|---|---|---|---|
| 1 | Matéria | `/[categoria]/[slug]` | sumário "Neste texto", citação, imagem com legenda e crédito, caixa "Do Almanaque", newsletter, tags, relacionados |
| 2 | Arquivo de categoria | `/[categoria]` | serve as 7 editorias; chips com rolagem horizontal no mobile, ordenação, paginação |
| 3 | Verbete | `/almanaque/[termo]` | etimologia, caixa "Na prática", verbetes relacionados, matérias que usam o termo, anterior/próximo |
| 4 | Índice A–Z | `/almanaque` | navegação alfabética sticky; letras sem verbete em cinza e sem link |
| 5 | Home | `/` | hero de busca, matéria de capa, últimas, bloco Viaje, faixa do Almanaque, Harmonize + Mercado, agenda |
| 6 | Institucionais | vários | Quem Somos, busca, busca sem resultados, 404 |

- [ ] Script de build gerando `public/almanaque.json` a partir da API do JetEngine
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

- [ ] **Remover o `noindex` do `app/layout.tsx`** — está lá desde a Fase 0; esquecer
      disso é lançar um site invisível para o Google
- [ ] `npm audit` revisado e Next na última patch da linha 15 — o projeto começou em
      15.1.6, que tem CVE, e foi para 15.5.22
- [ ] `/diagnostico` fora do sitemap e com `noindex` próprio
- [ ] Lighthouse nos quatro templates principais
- [ ] `sitemap.xml` dinâmico, incluindo os verbetes
- [ ] `robots.txt` com a busca em `noindex` e crawl-delay
- [ ] Formulário de contato e newsletter testados de ponta a ponta
- [ ] Acessibilidade: contraste (paleta já validada em AAA), navegação por teclado,
      foco visível, `alt` em todas as imagens
- [ ] **Fotografia real no lugar dos placeholders** — maior risco não técnico do projeto
- [ ] **Cores do logo conferidas contra os arquivos oficiais da marca**
- [ ] Monitor externo de uptime (UptimeRobot free) apontado para `/api/health`
- [ ] Domínio apontado, Cloudflare configurado
- [ ] Documentar para o cliente: onde publicar, quanto tempo leva para aparecer

---

## 9. Riscos e planos B

| Risco | Sinal | Plano B |
|---|---|---|
| Processo Node cai e não volta | Site fora do ar sem aviso | Monitor externo; se recorrente, mover front para Cloudflare free |
| WordPress e Next disputando recursos | Lentidão simultânea nos dois | LiteSpeed mais agressivo; imagens 100% via Cloudflare |
| REST API do JetEngine limitada | Campos ausentes na resposta | Endpoint customizado em `functions.php` |
| Publicação não reflete no site | Conteúdo novo invisível | Conferir o hook; fallback por tempo já previsto |
| Busca da home mais ampla que o combinado | Precisa cruzar CPTs | Relevanssi (free), já previsto |
| Fotografia não chega a tempo | Placeholders na véspera | Definir com o cliente uma data-limite, não a data de lançamento |

**Saída de emergência, gratuita:** o mesmo repositório sobe no Cloudflare free com o
adaptador OpenNext. Por isso: nada de código específico de host, nenhuma dependência
`@vercel/*`, `next/image` e `revalidatePath` padrão.

---

## Anexo A — Design tokens

**Cores** — os hex abaixo foram lidos por amostragem de imagem em baixa resolução e
servem só para entender o papel de cada cor. **A fonte da verdade é o `dov-tokens.css`
do handoff do designer** — que ainda não está neste repositório. Trazer para cá antes
de começar a Fase 2, e gerar os tokens do Tailwind a partir dele, não desta tabela.

| Token | Aprox. | Uso |
|---|---|---|
| `roxo-primario` | `#6B1775` | marca, CTAs, links, categoria ativa |
| `roxo-secundario` | `#9155A4` | hover de links, blobs, gradações |
| `lilas-claro` | `#CDB2D2` | bordas, filetes, blobs, placeholders |
| `off-white` | `#F3EFEA` | fundo de respiro entre seções |
| `azul-marinho` | `#212D45` | faixa do Almanaque e rodapé |
| `verde-escuro` | `#009559` | acento de destaque, ícones |
| `verde-limao` | `#9BBA36` | filete de hover, detalhes finos |
| `verde-menta` | `#74C29A` | blob secundário, fundo de tag |

Regra de contraste: verde-limão nunca com texto branco — usar sobre marinho.

**Tipografia**

| Papel | Fonte | Desktop | Mobile ≤767 |
|---|---|---|---|
| Display / H1 hero | Cormorant 400 | 64 / 68 | 38 / 42 |
| H1 matéria | Cormorant 500 | 48 / 52 | 32 / 36 |
| H2 seção | Cormorant 500 | 38 / 42 | 27 / 31 |
| H3 / card | Cormorant 500 | 24 / 28 | 20 / 24 |
| Kicker | DM Sans 500 | 12, tracking largo | 11 / 13 |
| Lead | DM Sans 400 | 21 / 32 | 18 / 28 |
| Corpo | DM Sans 400 | 18 / 30 | 17 / 29 |
| Meta / data | DM Sans 400 | 13 | 11 / 13 |

Um H1 por página. Cormorant nunca em bold — máximo 500, e só em títulos pequenos.
Números tabulares em datas, letras do Almanaque e paginação.

**Breakpoints**

| Faixa | Margem | Colunas | Gutter |
|---|---|---|---|
| Desktop (ref. 1440) | 120 | 12 de 68 · conteúdo 1200 | 32 |
| Tablet 768–1024 | 48 | cards em 2 colunas · menu vira hambúrguer em 1024 | 24 |
| Mobile 375–390 | 20 | 1 | 32 vertical |

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

Tudo com `show_in_rest: true`, incluindo os campos do JetEngine — que precisam ser
marcados individualmente.

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
/api/health                diagnóstico, alvo do monitor de uptime
/diagnostico               painel de infraestrutura, noindex e fora do sitemap
/sitemap.xml
/robots.txt
404
```
