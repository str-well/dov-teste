# Descubra o Vinho — Plano de Implementação

Portal editorial de vinho. WordPress headless como backend, Next.js como frontend,
tudo hospedado no plano Hostinger Cloud já contratado.

**Status desta versão:** revisada após a confirmação do suporte Hostinger de que o
plano Cloud suporta Node.js Web App. Isso elimina a necessidade de hospedagem externa
paga e simplifica bastante o deploy.

---

## 1. Arquitetura

```
                        ┌──────────────────────────┐
                        │   Cloudflare (free)      │
                        │   DNS · CDN · cache      │
                        └────────┬─────────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
     dominio.com                            wp.dominio.com
     Next.js (Node App)  ──── REST API ────► WordPress + JetEngine
     ISR em disco                            admin · uploads · imagens
              │
              └── ambos no mesmo plano Hostinger Cloud
```

**Decisões fechadas**

| Item | Decisão |
|---|---|
| Hospedagem do front | Node.js Web App no Hostinger Cloud (hPanel → Websites → Add Website → Deploy Web App) |
| Hospedagem do backend | WordPress no subdomínio `wp.` do mesmo plano |
| CDN / DNS | Cloudflare free (permite uso comercial) |
| Renderização | ISR nativo do Next — sem OpenNext, sem KV, sem wrangler |
| Imagens | Servidas do WordPress via Cloudflare, tamanhos fixos do design system, `unoptimized` |
| Busca do Almanaque | JSON estático no build + Fuse.js no cliente |
| Busca de matérias | REST API do WordPress com `revalidate: 60` + debounce de 300 ms |
| E-mail transacional | Resend (contato e newsletter) |
| Custo adicional | R$ 0 |

**O que saiu do plano anterior:** `@opennextjs/cloudflare`, KV namespace, configuração
de `wrangler`, Cloudflare Workers como host. Com processo Node rodando de verdade, o
cache de ISR fica em disco no próprio servidor e tudo funciona como na documentação
oficial do Next.

---

## 2. Stack

**Backend**
- WordPress + JetEngine (Crocoblock) em modo headless
- REST API: `/wp-json/wp/v2/` para posts, categorias e mídia; endpoints do JetEngine para os verbetes do Almanaque
- Elementor sai da entrega do front — permanece apenas como editor interno, se o cliente usar
- LiteSpeed Cache com cache de REST API habilitado

**Frontend**
- Next.js 15 · App Router · TypeScript
- Tailwind CSS + shadcn/ui
- Cormorant Garamond + DM Sans via `next/font` (self-hosted, sem chamada ao Google)
- SEO com `generateMetadata` nativo
- Fuse.js para a busca do Almanaque
- `output: 'standalone'` para o deploy

---

## 3. Fase 0 — Confirmar antes de codar

Três pontos que o suporte não respondeu e que mudam decisões de implementação:

- [ ] **Memória disponível para o build.** `next build` costuma exigir ~2 GB.
      Se estourar: buildar no GitHub Actions e enviar apenas o resultado (`standalone`).
- [ ] **Reinício automático do processo.** Existe gerenciador (PM2, Passenger) que
      levante a aplicação depois de uma queda ou reboot? Sem isso, o site fica fora
      do ar até alguém perceber — inaceitável para site de cliente.
- [ ] **Deploy automático.** O push no GitHub dispara build, ou é necessário clicar
      no painel? Define o dia a dia de trabalho.
- [ ] **Versão do Node.js** disponível (Next 15 pede Node 18.18+).

Confirmar também, no hPanel, o caminho exato do fluxo de deploy — a interface muda
com frequência e as instruções do suporte podem estar desatualizadas.

---

## 4. Fase 1 — Preparar o WordPress

- [ ] **Mover o WordPress para `wp.dominio.com`**
  - Criar o subdomínio no hPanel
  - Atualizar *WordPress Address* e *Site Address* nas configurações
  - Rodar search-replace nas URLs do banco (Better Search Replace ou WP-CLI)
  - Testar upload de mídia e login no admin depois da mudança
- [ ] **Registrar os CPTs e campos do JetEngine com `show_in_rest: true`**
  → é o passo que mais gente esquece; sem ele os verbetes não aparecem na API
- [ ] **CORS**: liberar `dominio.com` nos headers da REST API
- [ ] **Tamanhos de imagem** registrados em `functions.php`, todos em WebP:

| Uso | Proporção | Dimensão | Peso alvo |
|---|---|---|---|
| Hero da home | 16:9 | 1920×1080 | ≤ 200 kB |
| Destaque da matéria | 3:2 | 1600×1067 | ≤ 160 kB |
| Card de notícia | 3:2 | 800×533 | ≤ 70 kB |
| Card em destaque | 4:3 | 1200×900 | ≤ 120 kB |
| Imagem no corpo do texto | 3:2 ou 4:5 | 1200 de largura | ≤ 120 kB |
| Retrato / autor | 1:1 | 240×240 | ≤ 20 kB |

- [ ] **LiteSpeed Cache** com cache de REST API ligado
- [ ] **Cloudflare** na frente do subdomínio de imagens, com regra de cache agressiva
- [ ] Desativar tudo que só serve ao front antigo (plugins de SEO de página, sliders, etc.)

**Atenção ao compartilhamento de recursos:** WordPress e Next passam a dividir CPU e
RAM do mesmo plano. O cache do LiteSpeed deixa de ser refinamento e passa a ser
requisito.

---

## 5. Fase 2 — Fundações do front

- [ ] Projeto Next + TypeScript + Tailwind, com os tokens do design system (anexo A)
- [ ] Escala tipográfica desktop e mobile configurada no Tailwind
- [ ] Grade: 12 colunas · conteúdo 1200 · gutter 32 · margem 120 (desktop 1440)
- [ ] Blobs como componentes SVG — no máximo um por seção, e apenas em hero, busca
      e chamada do Almanaque
- [ ] **Camada de dados**: um único módulo com funções tipadas de fetch ao WordPress
      (`getPosts`, `getPostBySlug`, `getCategory`, `getVerbetes`, `search`), com os
      tipos derivados da resposta real da API — não inventados
- [ ] **Componentes globais**
  - Cabeçalho desktop: fixo no scroll, 92 px encolhendo para 68 px, estado ativo com
    filete roxo 2 px, hover com filete verde-limão (transição 150 ms)
  - Cabeçalho mobile: menu overlay em tela cheia, itens em Cormorant, busca visível
    no topo do menu, Almanaque como único item com botão cheio
  - Rodapé (idêntico em todas as telas)
  - Barra de busca: altura 72 px, raio 999 px, borda lilás 1 px; foco com borda roxa
    2 px e anel de acessibilidade
  - Card de notícia nas três variações: padrão, hover (título roxo, filete sob a
    imagem, foto 1,03× em 250 ms) e compacto para listas laterais
  - Paginação, chips de filtro, tags
- [ ] Área de toque mínima de 48×48 em tudo que é clicável no mobile

---

## 6. Fase 3 — Templates, nesta ordem

A ordem não é estética: começa pelo template com mais peças, para que os componentes
nasçam já testados no caso mais difícil.

1. **Matéria** — `/[categoria]/[slug]`
   Sumário "Neste texto", citação destacada, imagem no corpo com legenda e crédito,
   caixa "Do Almanaque" na sidebar, newsletter, tags, relacionados
2. **Arquivo de categoria** — `/[categoria]`
   Serve as 7 editorias com um template só. Chips de filtro (rolagem horizontal no
   mobile), ordenação, paginação
3. **Verbete do Almanaque** — `/almanaque/[termo]`
   URL própria por termo, caixa "Na prática", verbetes relacionados, matérias que
   usam o termo, navegação anterior/próximo
4. **Índice A–Z** — `/almanaque`
   Navegação alfabética sticky no scroll; letras sem verbete em cinza e sem link
5. **Home**
   Hero de busca, matéria de capa, últimas publicações, bloco Viaje, faixa do
   Almanaque, Harmonize + Mercado, agenda
6. **Quem Somos**, **busca**, **busca sem resultados**, **404**

Geração do JSON do Almanaque no build: script que consulta a API do JetEngine e grava
`public/almanaque.json` (≈80 kB para 418 verbetes).

---

## 7. Fase 4 — Deploy e revalidação

- [ ] `next.config.js` com `output: 'standalone'` e o domínio de imagens em `remotePatterns`
- [ ] Variáveis de ambiente cadastradas no hPanel — não no `.env.local`, que não sobe:
  - `WORDPRESS_API_URL`
  - `REVALIDATE_SECRET`
  - `RESEND_API_KEY`
- [ ] Deploy Web App no hPanel, conectando o repositório do GitHub
- [ ] Domínio principal apontado para a aplicação
- [ ] **Rota `/api/revalidate`** protegida por secret, chamando `revalidatePath`
- [ ] **Hook no WordPress** (`save_post`) chamando essa rota — com trava para não
      disparar em revisão automática nem entrar em loop
- [ ] **Teste real**: publicar uma matéria no WP e cronometrar até ela aparecer no front

---

## 8. Fase 5 — Antes de entregar

- [ ] Lighthouse nos quatro templates principais (matéria, categoria, verbete, home)
- [ ] `sitemap.xml` gerado dinamicamente, incluindo os 418 verbetes
- [ ] `robots.txt` com a rota de busca em `noindex` e crawl-delay
- [ ] Redirects 301 das URLs antigas para as novas rotas
- [ ] Formulário de contato e newsletter testados de ponta a ponta
- [ ] Teste de acessibilidade: contraste (a paleta já foi validada em AAA), navegação
      por teclado, foco visível, `alt` em todas as imagens
- [ ] Backup completo antes da virada de DNS
- [ ] Documentar para o cliente: novo endereço do admin, como publicar, quanto tempo
      leva para aparecer no site

---

## 9. Riscos e planos B

| Risco | Sinal | Plano B |
|---|---|---|
| Build estoura a memória do plano | `next build` morre sem erro claro | Buildar no GitHub Actions, subir só o `standalone` |
| Processo Node cai e não volta | Site fora do ar sem aviso | PM2 se disponível; monitor externo (UptimeRobot free); último recurso: mover front para Cloudflare free |
| WordPress e Next disputando recursos | Lentidão nos dois ao mesmo tempo | Cache do LiteSpeed mais agressivo; imagens 100% via Cloudflare |
| REST API do JetEngine limitada | Campos não aparecem na resposta | Endpoint customizado em `functions.php` |
| Cliente publicando e nada aparecer | Conteúdo novo invisível | Verificar o hook de revalidação; fallback com `revalidate: 300` por tempo |

**A saída de emergência existe e é gratuita:** se a hospedagem do Node no Cloud se
mostrar frágil na prática, o mesmo repositório sobe no Cloudflare free com o adaptador
OpenNext. Por isso: nada de código específico de host, nenhuma dependência `@vercel/*`,
`next/image` e `revalidatePath` padrão.

---

## Anexo A — Design tokens

**Cores** — valores lidos por amostragem da prancha em baixa resolução.
**Substituir pelos hex exatos do arquivo original antes de codar.**

| Token | Valor aprox. | Uso |
|---|---|---|
| `roxo-primario` | `#6B1775` | Marca, CTAs, links, categoria ativa |
| `roxo-secundario` | `#9155A4` | Hover de links, blobs, gradações |
| `lilas-claro` | `#CDB2D2` | Bordas, filetes, blobs, placeholders |
| `off-white` | `#F3EFEA` | Fundo de respiro entre seções |
| `azul-marinho` | `#212D45` | Faixa do Almanaque e rodapé |
| `verde-escuro` | `#009559` | Acento de destaque, ícones |
| `verde-limao` | `#9BBA36` | Filete de hover, detalhes finos |
| `verde-menta` | `#74C29A` | Blob secundário, fundo de tag |
| `branco` / `preto` | `#FFFFFF` / `#000000` | Fundo de página, preto só nas versões do logo |

Regra de contraste validada: verde-limão nunca com texto branco — usar sobre marinho.

**Tipografia**

| Papel | Fonte | Desktop | Mobile (≤767) |
|---|---|---|---|
| Display / H1 hero | Cormorant 400 | 64 / 68 | 38 / 42 |
| H1 matéria | Cormorant 500 | 48 / 52 | 32 / 36 |
| H2 seção | Cormorant 500 | 38 / 42 | 27 / 31 |
| H3 / título de card | Cormorant 500 | 24 / 28 | 20 / 24 |
| Kicker / categoria | DM Sans 500 | 12 (tracking largo) | 11 / 13 |
| Lead / olho | DM Sans 400 | 21 / 32 | 18 / 28 |
| Corpo | DM Sans 400 | 18 / 30 | 17 / 29 |
| Meta / data | DM Sans 400 | 13 | 11 / 13 |

Regras: um único H1 por página; Cormorant nunca em bold (máximo 500, e apenas em
títulos pequenos); números sempre tabulares em datas, letras do Almanaque e paginação.

**Breakpoints**

| Faixa | Margem | Colunas | Gutter |
|---|---|---|---|
| Desktop (ref. 1440) | 120 | 12 de 68 · conteúdo 1200 | 32 |
| Tablet 768–1024 | 48 | cards em 2 colunas · menu vira hambúrguer a partir de 1024 | 24 |
| Mobile 375–390 | 20 | 1 | 32 vertical |

Grade de cards: 3 colunas (4+4+4) em listagem, 2 colunas (6+6) em destaques,
8+4 na matéria com sidebar.

---

## Anexo B — Checklist de rotas

```
/                               home
/quem-somos
/contato
/busca?q=                       noindex
/almanaque                      índice A–Z
/almanaque/[termo]              418 verbetes
/descubra                       ┐
/curiosidades                   │
/harmonize                      │ mesmo template
/mercado                        │ de arquivo
/saude-e-ciencia                │
/viaje                          │
/programe-se                    ┘
/[categoria]/[slug]             matéria
/api/revalidate                 POST, protegida por secret
/api/contato                    POST, Resend
/api/newsletter                 POST, Resend
/sitemap.xml
/robots.txt
404
```