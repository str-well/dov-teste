# Descubra o Vinho (DOV) — contexto do projeto

Portal editorial de vinho, em português do Brasil. WordPress headless como backend,
Next.js como frontend. Cliente real, projeto em produção.

**Este repositório é o front.** O WordPress é criado no painel da Hostinger e vive só
como backend de API — não há código dele aqui.

O plano completo está em `docs/PLANO-IMPLEMENTACAO.md`, e o registro da validação de
infraestrutura em `docs/FASE-0-TESTE-HOSPEDAGEM.md`. Este arquivo é o resumo das
decisões e do que já foi validado — leia antes de sugerir alternativas de arquitetura.

---

## Arquitetura

```
Cloudflare (free) — DNS e CDN
├── dominio.com        Next.js 15, Node.js Web App na Hostinger, ISR em disco
└── wp.dominio.com     WordPress + JetEngine, headless, mesmo plano Hostinger
```

Os dois rodam no **mesmo plano Hostinger Cloud**, já contratado. Custo adicional do
projeto: zero. O plano comporta até 10 apps web.

## Stack

- Next.js 15 · App Router · TypeScript
- Tailwind CSS + shadcn/ui
- Cormorant Garamond + DM Sans via `next/font`, self-hosted
- Fuse.js para a busca do Almanaque (JSON estático gerado no build)
- Resend para e-mail transacional
- `output: 'standalone'` — formato exigido pela Hostinger

## Estado atual

**Fase 0 (validação da infraestrutura) — concluída**, com um projeto descartável:

| Item | Resultado |
|---|---|
| `next build` no servidor Hostinger | ✅ 1m0s, sem estourar memória |
| Deploy automático no `git push` | ✅ |
| Node | ✅ v22.18.0 |
| ISR revalidando a cada 60s | ✅ |
| HTTP de saída do servidor | ✅ |
| Consumo | ✅ RSS 109 MB, CPU 7% |
| Reinício automático do processo | ⏳ pendente — conferir PID em `/api/health` |

O único item pendente é o do reinício — e é o único que ainda pode derrubar a
arquitetura. Cada deploy zera o `uptime`, então uma observação em andamento se perde a
cada `git push`.

**Próximo passo:** Fase 1 — instalar o WordPress novo em `wp.dominio.com`.
Não existe site anterior; não há migração, search-replace nem redirects.

O portal em si ainda não foi codado. O que existe no repositório é o app que validou a
infraestrutura: home provisória em `/`, painel de diagnóstico em `/diagnostico`,
`/api/health` e `/api/revalidate` — as duas últimas já são as de produção. O site está
com `noindex` no `layout.tsx` até o lançamento.

---

## Decisões fechadas — não reabrir

Estas opções já foram avaliadas e descartadas com motivo. Não sugerir de novo sem
que algo tenha mudado:

| Descartado | Por quê |
|---|---|
| **Vercel** | Hobby proíbe uso comercial; Pro tem cobrança variável por uso |
| **Netlify** | Funciona, mas a Hostinger já está paga e faz o mesmo |
| **Cloudflare Workers como host** | Exigiria OpenNext + KV; desnecessário com processo Node de verdade |
| **DigitalOcean / VPS** | Custo extra e manutenção de sysadmin sem ganho |
| **Payload CMS** | Avaliado e descartado — complexidade e custo de infra |
| **Elementor no front** | Sai da entrega; segue só como editor interno, se o cliente usar |
| **Plugins de terceiros** | Usar JetEngine/JetSmartFilters da licença Crocoblock existente antes de instalar qualquer coisa nova |

**Regra que sustenta a saída de emergência:** nada de código específico de host,
nenhuma dependência `@vercel/*`. Usar `next/image` e `revalidatePath` padrão. Se a
hospedagem na Hostinger se mostrar frágil, o mesmo repositório sobe no Cloudflare
free com o adaptador OpenNext, sem reescrever nada.

---

## Preferências de trabalho

- **Não adicionar serviços pagos.** O orçamento é a Hostinger e a licença Crocoblock,
  e nada além disso.
- **Minimizar trabalho de terminal e manutenção de infraestrutura contínua.**
- Escrever código no IDE é o objetivo do projeto — foi o motivo de sair do
  drag-and-drop. Não sugerir voltar para construtor visual.
- Responder em **português do Brasil**.

---

## Modelo de conteúdo (WordPress)

Tudo precisa de `show_in_rest: true`, **incluindo cada campo do JetEngine
individualmente** — é a causa número um de campo sumido na API.

- `post` (nativo) — matérias. Categoria = as 7 editorias. Tags = temas dos chips de filtro.
- `verbete` (CPT) — Almanaque. Definição curta, texto, etimologia, caixa "Na prática",
  relação com verbetes vizinhos. A letra do índice é derivada do título, não é campo.
- `evento` (CPT) — agenda do Programe-se. Data início/fim, cidade ou "online", link.
- Páginas nativas: Quem Somos, Contato.

## Rotas

```
/                       home
/quem-somos  /contato
/busca?q=               noindex
/almanaque              índice A–Z
/almanaque/[termo]      verbete
/[categoria]            7 editorias, template único
/[categoria]/[slug]     matéria
/api/revalidate         POST, protegida por secret
/api/contato            POST, Resend
/api/newsletter         POST, Resend
/api/health             diagnóstico, alvo do monitor de uptime
/diagnostico            painel de infraestrutura, noindex e fora do sitemap
```

As 7 editorias: `descubra`, `curiosidades`, `harmonize`, `mercado`, `saude-e-ciencia`,
`viaje`, `programe-se`.

---

## Design system

Handoff completo do designer: 17 telas, `dov-tokens.css`, SVGs e mockups em HTML.
**Os hex do plano foram lidos por amostragem de imagem em baixa resolução — usar
sempre os valores do `dov-tokens.css`, não os do markdown.**

Resumo dos papéis: roxo primário (marca, CTAs), roxo secundário (hover, blobs),
lilás claro (bordas, filetes), off-white (fundo de respiro), azul-marinho (faixa do
Almanaque e rodapé), verde escuro (acento), verde-limão (filete de hover),
verde-menta (blob, tag).

- Cormorant Garamond nos títulos, **nunca em bold** — máximo peso 500
- DM Sans no corpo, kickers e dados
- Um H1 por página
- Números tabulares em datas, letras do Almanaque e paginação
- Grade: 12 colunas · conteúdo 1200 · gutter 32 · margem 120 (ref. 1440)
- Toque mínimo 48×48 no mobile
- Verde-limão nunca com texto branco

### Imagens

Servidas do WordPress via Cloudflare, com `unoptimized` — os tamanhos são fixos e
gerados no WP, não otimizados em runtime.

| Uso | Proporção | Dimensão | Peso |
|---|---|---|---|
| Hero da home | 16:9 | 1920×1080 | ≤200 kB |
| Destaque da matéria | 3:2 | 1600×1067 | ≤160 kB |
| Card | 3:2 | 800×533 | ≤70 kB |
| Card em destaque | 4:3 | 1200×900 | ≤120 kB |
| Corpo do texto | 3:2 ou 4:5 | 1200 largura | ≤120 kB |
| Retrato / autor | 1:1 | 240×240 | ≤20 kB |

Todas as imagens do projeto ainda são placeholder — a fotografia real é o maior
risco não técnico.

---

## Ordem de construção dos templates

Do mais complexo para o mais simples, para os componentes nascerem testados no caso
difícil:

1. Matéria — `/[categoria]/[slug]`
2. Arquivo de categoria — `/[categoria]`
3. Verbete — `/almanaque/[termo]`
4. Índice A–Z — `/almanaque`
5. Home
6. Quem Somos, busca, sem resultados, 404

## Convenções de código

- Toda chamada ao WordPress passa por **um único módulo de dados** com funções
  tipadas. Tipos derivados da resposta real da API, não inventados.
- Segredos só nas variáveis de ambiente do painel da Hostinger. O `.env.local` não
  sobe no deploy e não vai para o Git.
- Revalidação: hook `save_post` no WordPress chamando `/api/revalidate`, com trava
  contra revisão automática e contra loop. Fallback por tempo (`revalidate: 300`)
  nas listagens.
