# Almanaque — importação dos verbetes do cliente

Seis documentos recebidos em 23/09/2026, convertidos em seis lotes JSON.
**126 verbetes, 124 a importar, 2 retidos** aguardando decisão do cliente.

| Lote | Tema | Verbetes |
|---|---|---|
| `lote-01-uvas-e-vinhos` | Uvas e vinhos | 40 |
| `lote-02-estilos` | Estilos de vinho | 21 (+2 retidos) |
| `lote-03-paises` | Países e regiões | 18 |
| `lote-04-producao` | Produção | 19 |
| `lote-05-harmonizacao` | Harmonização | 11 |
| `lote-06-denominacoes` | Denominações e classificações | 15 |

Com os 17 verbetes de teste que permanecem, o Almanaque fica com **141**.

---

## Onde cada coisa vai no repositório

```
almanaque/*.json               os lotes — fonte de verdade do conteúdo
almanaque/LEIA-ME.md           este arquivo
scripts/importar-almanaque.mjs o importador
wordpress/dov-headless.php     mu-plugin v2.2.0
```

## Como foi feita a conversão

- **Referências** descartadas, como o cliente pediu
- **Definição completa** → corpo do verbete
- **Primeira frase da definição** → `definicao_curta` (cards do índice e busca).
  Regra mecânica: nenhum texto do cliente foi reescrito
- **Curiosidade** → campo novo `dov_curiosidade`
- **Regiões produtoras** (só países) → lista no corpo, sob "Regiões produtoras"
- **Itálico** do cliente (`*screwcap*`) → `<em>` no corpo, texto puro nos campos
- **Títulos compostos** do doc de estilos, que vinham aninhados ("Vinho Tinto" →
  "Leve"), viraram títulos completos ("Vinho Tinto Leve")
- **Ordenação:** os 22 títulos que começam com "Vinho" receberam `ordenacao`
  ("Natural, vinho"). A letra V cai de 27 para 6 verbetes
- **Tipo:** cada verbete classificado em uma de seis categorias. O doc 1 misturava
  uvas e vinhos — Champagne, Chianti, Lambrusco, Prosecco, Rosé, Spritz, Vermouth,
  Vinho do Porto e Vinho Laranja foram para "Vinhos e estilos"

### Cinco verbetes de teste são atualizados no lugar

Mantêm ID e slug — as matérias apontam para verbetes por ID, e a da Serra Gaúcha tem
link para `/almanaque/denominacao-de-origem`. Etimologia, pronúncia, "Na prática" e
relacionados que já existiam **são preservados**.

| Slug mantido | Título antigo | Título novo |
|---|---|---|
| `alvarinho` | Alvarinho | Albariño (Alvarinho) |
| `tannat` | Tannat | Tannat |
| `vindima` | Vindima | Colheita (ou Vindima) |
| `assemblage` | Assemblage | Corte (ou Assemblage) |
| `denominacao-de-origem` | Denominação de origem | DO (Denominação de Origem) |

---

## Passo a passo

### 1. Subir o mu-plugin v2.2.0

Substituir `wp-content/mu-plugins/dov-headless.php` pelo arquivo de
`wordpress/`. Passou em `php -l`. Mantenha o wp-admin aberto em outra aba enquanto
sobe, para reverter rápido se algo der errado.

O que ele acrescenta:

- campos `dov_curiosidade` e `dov_ordenacao` no verbete
- taxonomia `verbete_tipo`, na REST em `/wp/v2/verbete_tipos`
- revalidação quando editoria, tag ou tipo de verbete muda — antes só havia no save
  de post
- modo lote: gravações REST com `?dov_lote=1` não disparam revalidação a cada item

Conferir: `https://wp.descubraovinho.com.br/wp-json/wp/v2/verbete_tipos` deve
devolver `[]`, não 404.

### 2. Criar uma senha de aplicativo

WordPress → Usuários → Perfil → **Senhas de aplicativo**. Nome sugerido:
"importador-almanaque". Copie a senha gerada — ela só aparece uma vez.

Não é a senha de login, e pode ser revogada a qualquer momento sem afetar nada.

### 3. Variáveis no `.env.local`

```
WORDPRESS_API_URL=https://wp.descubraovinho.com.br/wp-json/wp/v2
WP_IMPORT_USER=seu-usuario
WP_IMPORT_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
FRONT_URL=https://descubraovinho.com.br
REVALIDATE_SECRET=o-mesmo-da-producao
```

`FRONT_URL` e `REVALIDATE_SECRET` são opcionais — servem para o script revalidar o
front no final. Sem eles, o front atualiza sozinho pelo fallback de 5 minutos.

### 4. Simular

```bash
node --env-file=.env.local scripts/importar-almanaque.mjs
```

Não grava nada. Lista cada verbete como `criar` ou `atualizar`, e mostra o título
antigo quando muda. **Confira que só os 5 da tabela acima aparecem como
`atualizar`.** Se aparecer qualquer outro, pare e investigue.

### 5. Aplicar

```bash
node --env-file=.env.local scripts/importar-almanaque.mjs --aplicar
```

Leva alguns minutos — há uma pausa de 150 ms entre gravações, por gentileza com o
plano compartilhado. Rodar de novo é seguro: casa por slug e atualiza.

### 6. Depois

- Revogar a senha de aplicativo, se não for importar mais lotes em breve
- Se `/almanaque` não refletir a importação: o CDN da Hostinger pode estar servindo
  a versão anterior. hPanel → **Limpar cache**

---

## Problemas conhecidos

**401 com usuário e senha corretos.** Alguns servidores descartam o cabeçalho
`Authorization` antes de chegar ao PHP. Correção no `.htaccess` do WordPress, acima
da seção do WordPress:

```
SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1
```

**404 em `/verbete_tipos`.** O mu-plugin v2.2.0 não está no ar. O script para antes
de gravar qualquer coisa.

---

## Retidos — aguardando o cliente

Dois termos aparecem em dois documentos com textos diferentes. Foi importada a versão
do doc 1, mais detalhada; a do doc 2 está no JSON com `"importar": false`.

| Importado (doc 1) | Retido (doc 2) |
|---|---|
| Rosé | Vinho Rosé |
| Vinho Laranja (Orange Wine) | Vinho Laranja (ou Âmbar) |

Para trocar: inverter o `importar` e rodar de novo.

## Para revisão editorial

Importados como vieram, sem correção. Ajustar no JSON e reimportar:

- **Lambrusco se contradiz**: a definição chama de vinho tinto; a curiosidade diz
  que "não é um vinho, e sim uma família de uvas"
- **Alemanha**: "inclinações de até 68 graus" — provavelmente 68%, não graus
- **Rega (Irrigação)**: diz que a irrigação é proibida em Bordeaux e Rioja. A
  Espanha libera desde os anos 1990 e a França admite em casos excepcionais
- **Tannat**: a curiosidade associa o vinho a benefícios à saúde cardiovascular
- **Digitação**: "massa mais acentuada" (Vinho Branco Encorpado, deveria ser
  "acidez"); "tanico" (Taninos e Proteína/Gordura, deveria ser "tânico");
  "Desengaçe" (deveria ser "Desengace")
- **Página Quem Somos**: o texto diz "mais de 400 verbetes". Com a importação o
  Almanaque tem 141. Está no conteúdo da página no WordPress
