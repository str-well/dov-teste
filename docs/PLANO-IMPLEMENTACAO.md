# Descubra o Vinho — Plano de Implementação

Portal editorial de vinho. WordPress headless como backend, Next.js como frontend,
tudo no plano Hostinger Cloud já contratado. Custo adicional: zero.

`v5 · 03/08/2026` — Fases 0 e 1 concluídas; Fase 2 com a camada de dados e os
componentes globais em pé. Ver `../CLAUDE.md` para o resumo de decisões,
`BACKEND.md` para o contrato da API e `DESIGN.md` para o pacote do designer.

---

## Sumário

1. [Arquitetura](#1-arquitetura)
2. [Stack](#2-stack)
3. [Fase 0 — Validação da infraestrutura](#3-fase-0--validação-da-infraestrutura) ✅
4. [Fase 1 — WordPress do zero](#4-fase-1--wordpress-do-zero) ✅
5. [Fase 2 — Fundações do front](#5-fase-2--fundações-do-front) ◐
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

## 5. Fase 2 — Fundações do front ← EM ANDAMENTO

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
- [ ] **Painel de sugestões da busca** — §5 da especificação: combobox com
      `downshift`, 3 caracteres, 250 ms de debounce, `<mark>` no trecho que casa.
      Precisa de uma rota que devolva as sugestões
- [ ] Rolagem da tira de chips no mobile — §4: `scrollLeft` do chip ativo ao carregar
- [ ] Blobs como componentes SVG — no máximo um por seção, e só em hero, busca e
      chamada do Almanaque. Hoje só o do menu mobile está em uso

**Escala tipográfica fora do Tailwind, de propósito.** Retipá-la em utilitários é
onde o designer avisa que a fidelidade escorre; tipografia herda o CSS do mockup,
e o Tailwind cuida de grade, espaçamento e responsividade.

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

- [ ] Script de build gerando `public/almanaque.json` — `indiceDoAlmanaque()` em
      `lib/wp` já devolve o payload enxuto
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
