# Descubra o Vinho

Portal editorial de vinho. Este repositório é o **front**: Next.js 15 com App Router,
hospedado como Node.js Web App no plano Hostinger Cloud.

O **backend** é um WordPress headless em `wp.dominio.com`, criado no painel da
Hostinger, consumido apenas por REST API. Os dois rodam no mesmo plano.

| Documento | Para quê |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Contexto do projeto, decisões fechadas, convenções |
| [docs/PLANO-IMPLEMENTACAO.md](docs/PLANO-IMPLEMENTACAO.md) | Plano completo, fase por fase |
| [docs/FASE-0-TESTE-HOSPEDAGEM.md](docs/FASE-0-TESTE-HOSPEDAGEM.md) | O que a infraestrutura já provou, e como verificar de novo |

## Estado

Infraestrutura validada — build, deploy automático, ISR e revalidação sob demanda
funcionam no plano Cloud. Falta confirmar o reinício automático do processo
([detalhes](docs/FASE-0-TESTE-HOSPEDAGEM.md#o-item-pendente)).

O portal ainda não foi codado. Próximo passo do plano: **Fase 1** — instalar o
WordPress novo em `wp.dominio.com`. Não há site anterior, então não há migração,
search-replace nem redirects.

O site está com `noindex` no `layout.tsx` até o lançamento.

## Rodar localmente

```bash
npm install
```

Copie `.env.example` para `.env.local` e preencha:

| Variável | Para quê |
|---|---|
| `WORDPRESS_API_URL` | REST API do WordPress, sem barra no final |
| `REVALIDATE_SECRET` | string longa e aleatória; a mesma no hook do WordPress |

```bash
npm run dev
```

Em produção essas variáveis vão no painel da Hostinger — o `.env.local` não sobe no
deploy e não vai para o Git.

## Estrutura

```
app/
  layout.tsx
  globals.css
  page.tsx                 home provisória
  diagnostico/page.tsx     painel de infraestrutura (ISR, WordPress, consumo)
  api/health/route.ts      node, uptime, pid, memória — alvo do monitor de uptime
  api/revalidate/route.ts  POST protegido por secret — destino do hook save_post
docs/
next.config.js             output: 'standalone', exigido pela Hostinger
```

## Deploy

hPanel → Websites → Add Website → Deploy Web App → GitHub.

| | |
|---|---|
| Build command | `npm run build` |
| Start command | `node .next/standalone/server.js` |

O `output: 'standalone'` do [next.config.js](next.config.js) existe justamente para
gerar esse `server.js`.

> Enquanto o reinício automático não for confirmado, lembre que cada deploy zera o
> `uptime` em `/api/health` e invalida uma observação em andamento.
