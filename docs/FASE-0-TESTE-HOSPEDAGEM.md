# Fase 0 — Teste de hospedagem

Registro do que foi verificado antes de escrever o portal, e como verificar de novo.

O objetivo era provar que o plano Hostinger Cloud roda Next.js com ISR **antes** de
três semanas de trabalho em cima de uma suposição. O app de diagnóstico usado no teste
não foi descartado: virou o próprio front, com o painel movido para `/diagnostico`.

## Resultado

| Verificação | Resultado |
|---|---|
| `next build` no servidor | ✅ 1m0s, sem estourar memória |
| Deploy automático no `git push` | ✅ |
| Versão do Node | ✅ v22.18.0 |
| ISR revalidando a cada 60s | ✅ parado nas recargas, avança sozinho |
| HTTP de saída do servidor | ✅ |
| Consumo do app | ✅ RSS 109 MB · CPU 7% |
| Backups | ✅ diários, inclusos |
| CDN da Hostinger | ✅ ativo |
| Capacidade | ✅ 10 apps web no plano |
| **Reinício automático do processo** | ⏳ **pendente** |

Configuração que funcionou, para não redescobrir:

| | |
|---|---|
| Caminho no painel | Websites → Add Website → Deploy Web App → GitHub |
| Build command | `npm run build` |
| Start command | `node .next/standalone/server.js` |

## O item pendente

Único em aberto, e o único com poder de veto sobre a arquitetura: se o processo Node
cair e não voltar, o site fica fora do ar até alguém perceber — inaceitável para site
de cliente.

Anote `pid` e `uptime_segundos` em `/api/health` e compare depois:

| O que mudou | Significa |
|---|---|
| Uptime cresceu, PID igual | Processo estável. Melhor cenário. |
| Uptime zerou, PID diferente | Caiu e voltou sozinho — existe gerenciador de processo. Aceitável. |
| Site fora do ar | Sem reinício automático. **Bloqueador.** |

Com SSH, dá para não esperar um dia: `kill <PID>` e recarregar o site alguns segundos
depois. Se voltar, está resolvido.

**Atenção:** um deploy novo reinicia o processo e zera o `uptime`. Enquanto este item
estiver aberto, uma observação em andamento é perdida a cada `git push`. Feche o item
antes, ou refaça a leitura depois de subir.

Falhando: não force. O mesmo repositório sobe no Cloudflare free com o adaptador
OpenNext, sem custo. Foi para isso que o plano guardou essa saída.

## Como refazer as verificações

**Build** — se morrer sem mensagem clara ou com "killed", é memória: passe o build para
o GitHub Actions e suba só o `standalone`. Erro de versão do Node se resolve no painel
(Next 15 pede 18.18+).

**ISR** — abra `/diagnostico` e recarregue várias vezes seguidas, observando o "Página
gerada em". Deve ficar parado e avançar sozinho depois de 60 s. Avançando a cada
recarga, a página está dinâmica, não em cache. Nunca avançando, o cache não está sendo
gravado — provável falta de permissão de escrita em `.next/cache`.

**Revalidação sob demanda** — é o mecanismo que o hook `save_post` vai usar:

```bash
curl -X POST "https://SEU-DOMINIO/api/revalidate?secret=SEU_SEGREDO&path=/diagnostico"
```

Deve responder `{"ok":true,...}` e o horário deve atualizar na recarga seguinte.

**Ponta a ponta** — publique um post no WordPress e cronometre até ele aparecer na
seção 2 do `/diagnostico`. Máximo de 60 segundos.
