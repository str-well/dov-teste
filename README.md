# Teste de hospedagem — Descubra o Vinho

Projeto descartável. Único objetivo: provar que o plano Hostinger Cloud roda Next.js
com ISR **antes** de começar o portal de verdade.

Se este teste passar, a arquitetura do plano está confirmada. Se falhar, você descobriu
agora — com um projeto de 6 arquivos — e não daqui a três semanas com o portal meio
construído.

Build já validado localmente: compila limpo e a home fica com `revalidate: 60`.

---

## O que subir

```
app/
  layout.tsx
  globals.css
  page.tsx              painel de diagnóstico
  api/health/route.ts   versão do Node, uptime, memória
  api/revalidate/route.ts  ensaio do webhook do WordPress
next.config.js          output: 'standalone'
package.json
tsconfig.json
.env.example
```

## Passo a passo

**1. Suba para o GitHub**

```bash
git init
git add .
git commit -m "teste de hospedagem"
git branch -M main
git remote add origin git@github.com:SEU-USUARIO/dov-teste.git
git push -u origin main
```

**2. Crie um subdomínio de teste** no hPanel — algo como `teste.seudominio.com`.
Não use o domínio principal.

**3. Deploy Web App**

hPanel → Websites → Add Website → Deploy Web App → GitHub. Aponte para o repositório
e para o subdomínio criado.

Build command: `npm run build`
Start command: `node .next/standalone/server.js`

> Se o painel oferecer outro formato de start, siga o dele — o `output: 'standalone'`
> existe justamente para gerar esse `server.js`.

**4. Cadastre as variáveis de ambiente no painel** (não no `.env.local`, que não sobe):

| Variável | Valor |
|---|---|
| `WORDPRESS_API_URL` | `https://SEU-WP-ATUAL/wp-json/wp/v2` |
| `REVALIDATE_SECRET` | uma string longa e aleatória |

Pode apontar para o WordPress onde ele já está hoje. A migração para `wp.` vem depois.

**5. Abra o subdomínio.** O painel de diagnóstico se explica sozinho.

---

## Como ler os resultados

### O build

| O que aconteceu | Leitura |
|---|---|
| Terminou normalmente | Memória suficiente. Siga. |
| Morreu sem mensagem clara, ou "killed" | Falta de memória. Passe o build para o GitHub Actions e envie só o resultado. |
| Erro de versão do Node | Ajuste a versão no painel — Next 15 pede 18.18 ou superior. |

### O ISR (seção 1 da página)

Recarregue a home várias vezes seguidas e observe o "Página gerada em":

| Comportamento | Significa |
|---|---|
| Fica parado, avança sozinho após 60s | **ISR funcionando.** É o que se quer. |
| Avança a cada recarga | A página está dinâmica, não em cache. Confira se o `revalidate` está sendo respeitado. |
| Nunca avança | O cache não está sendo regravado — provável falta de permissão de escrita na pasta `.next/cache`. |

### O processo (`/api/health`)

Anote `node`, `uptime_segundos` e `pid`. **Volte no dia seguinte** e compare:

| O que mudou | Significa |
|---|---|
| Uptime cresceu, PID igual | Processo estável. Melhor cenário. |
| Uptime zerou, PID diferente | Caiu e foi reiniciado sozinho — existe gerenciador de processo. Aceitável. |
| Site fora do ar | Não há reinício automático. **Isso é bloqueador para site de cliente.** |

### A revalidação sob demanda

```bash
curl -X POST "https://teste.seudominio.com/api/revalidate?secret=SEU_SEGREDO&path=/"
```

Deve responder `{"ok":true,...}` e o horário da home deve atualizar na recarga seguinte.
É exatamente o mecanismo que o hook do WordPress vai usar em produção.

### O teste final

Publique um post no WordPress e cronometre até ele aparecer na seção 2. Máximo de
60 segundos.

---

## Depois

Passou tudo: apague este subdomínio e comece a Fase 1 do plano (mover o WordPress
para `wp.`).

Falhou o build por memória: resolvível, é só mudar onde o build roda.

Falhou o reinício automático: não force. O mesmo código sobe no Cloudflare free com
o adaptador OpenNext, sem custo. Foi para isso que o plano guardou essa saída.
