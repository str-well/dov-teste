# Contrato da API — WordPress headless

Base: `https://wp.descubraovinho.com.br/wp-json/wp/v2`

Tudo é público em leitura. Não há autenticação no front. CORS liberado só para
`https://descubraovinho.com.br`.

O código que produz esta API está em `wordpress/dov-headless.php` — versionado aqui,
instalado em produção como mu-plugin.

---

## Endpoints

| Recurso | Rota | Observação |
|---|---|---|
| Matérias | `/posts` | tipo nativo |
| Categorias | `/categories` | as 7 editorias |
| Tags | `/tags` | temas dos chips de filtro |
| Verbetes | `/verbetes` | CPT `verbete` |
| Eventos | `/eventos` | CPT `evento` |
| Páginas | `/pages` | Quem Somos, Contato |
| Autores | `/users` | minibio e retrato em `meta` |

Parâmetros úteis: `per_page` (máx. 100), `page`, `categories`, `tags`, `slug`,
`search`, `orderby`, `order`, `_fields`, `_embed`.

Paginação vem nos headers `X-WP-Total` e `X-WP-TotalPages` — necessários para o
componente de paginação.

---

## Campos personalizados

Todos ficam sob a chave `meta`. Prefixo `dov_`.

### Matéria (`/posts`)

```json
"meta": {
  "dov_credito_foto": "O Vale dos Vinhedos visto da estrada do Alto Feliz, às 7h40. Foto: Ana Ferraz",
  "dov_verbetes_relacionados": [30, 24],
  "dov_seo_titulo": "",
  "dov_seo_descricao": "",
  "dov_tempo_leitura": 1
}
```

- `dov_verbetes_relacionados` — IDs de verbete, alimenta a caixa "Do Almanaque"
- `dov_seo_titulo` / `dov_seo_descricao` — vazios significam "usar título e resumo"
- `dov_tempo_leitura` — calculado na gravação, em minutos, mínimo 1

### Verbete (`/verbetes`)

```json
"meta": {
  "dov_definicao_curta": "O conjunto de solo, clima, relevo e mão humana que faz um vinho ser daquele lugar e de nenhum outro.",
  "dov_etimologia": "do francês terre, terra",
  "dov_pronuncia": "terruár",
  "dov_na_pratica": "Quando um rótulo diz \"vinhedo único\", está dizendo que não quis diluir o terroir misturando parcelas.",
  "dov_relacionados": [23, 24, 33, 26]
}
```

- `dov_definicao_curta` — usada nos cards do índice A–Z e nos resultados de busca
- `dov_etimologia` e `dov_pronuncia` — muitas vezes vazios; a linha inteira deve
  desaparecer quando ambos estiverem vazios
- `dov_na_pratica` — caixa destacada, opcional
- **A letra do índice A–Z é derivada do título no front.** Não existe campo para ela.
  Normalizar acento antes de agrupar (`Á` cai em `A`)

### Evento (`/eventos`)

```json
"meta": {
  "dov_data_inicio": "2026-09-18",
  "dov_data_fim": "2026-09-20",
  "dov_local": "São Paulo",
  "dov_link": ""
}
```

`dov_data_fim` vazio significa evento de um dia. `dov_local` pode ser "online".

### Autor (`/users`)

`dov_minibio` (string) e `dov_retrato_url` (string, URL da imagem 240×240).
Ambos ainda vazios.

---

## Campo `dov_imagens`

Adicionado às respostas de `posts`, `verbetes` e `eventos`. Entrega as URLs de todos
os tamanhos nomeados **na própria resposta**, evitando uma segunda requisição a
`/media` por post.

```json
"dov_imagens": {
  "alt": "Vinhedo ao amanhecer",
  "dov_hero":     { "url": "...", "w": 1920, "h": 1080 },
  "dov_destaque": { "url": "...", "w": 1600, "h": 1067 },
  "dov_card_4x3": { "url": "...", "w": 1200, "h": 900 },
  "dov_corpo":    { "url": "...", "w": 1200, "h": 800 },
  "dov_card":     { "url": "...", "w": 800,  "h": 533 },
  "dov_retrato":  { "url": "...", "w": 240,  "h": 240 }
}
```

**Retorna `null` quando não há imagem destacada — que é o caso de todo o conteúdo
hoje.** Tratar o estado vazio desde o início.

---

## Armadilhas

**Entidades HTML.** `title.rendered`, `excerpt.rendered` e `name` de termos vêm com
entidades codificadas: `Saúde &#038; Ciência`. Decodificar na camada de dados.

**`excerpt.rendered` vem envolvido em `<p>`.** Para usar como texto puro em cards,
remover a tag.

**`content.rendered` é HTML do editor de blocos.** Vem com classes `wp-block-*`.
Estilizar via um wrapper com escopo, não tentar normalizar no servidor.

**Datas.** `date` é local (São Paulo), `date_gmt` é UTC. Usar `date` para exibição.

**`_embed`** traz autor, imagem e termos numa requisição, mas infla a resposta.
Preferir `_fields` explícito e, quando precisar de termos, buscar a lista de
categorias e tags uma vez e cachear.

---

## Inventário do conteúdo de teste

### Categorias — os slugs são contrato de rota

| Nome | Slug | Matérias |
|---|---|---|
| Descubra | `descubra` | 2 |
| Curiosidades | `curiosidades` | 2 |
| Harmonize | `harmonize` | 3 |
| Mercado | `mercado` | 3 |
| Saúde & Ciência | `saude-e-ciencia` | 2 |
| Viaje | `viaje` | 6 |
| Programe-se | `programe-se` | 2 |

### Tags

`brasil` `argentina` `chile` `portugal` `italia` `enoturismo` `serra-gaucha`
`roteiros-de-3-dias` `onde-dormir` `espumantes` `tannat` `vinho-e-queijo`
`vale-dos-vinhedos` `taninos` `altitude` `vindima`

### Matérias

20 publicadas, datadas entre 07/06/2026 e 02/08/2026, sem horários duplicados.
A mais recente é `serra-gaucha-em-tres-dias-o-roteiro-sem-pressa` — é a matéria de
capa nos mockups, e a única com corpo de texto real (do designer), incluindo H2,
citação com autor, lista e link para verbete.

As outras 19 têm o corpo marcado
`[Texto de exemplo para desenvolvimento — substituir por conteúdo editorial.]`.
Três têm título explicitamente "Matéria de exemplo — …", criadas só para as
editorias com menos copy terem duas matérias e a paginação renderizar.

### Verbetes

22 publicados. Letras cobertas: A, B, C, D, E, M, S, T, V.
**K, Q, W, X, Y, Z estão vazias de propósito** — é o que permite testar o estado
cinza sem link no índice A–Z.

O mais completo é `terroir` (id 30): tem etimologia, pronúncia, "Na prática",
4 relacionados e corpo de texto real. É o melhor caso para desenvolver o template.

### Eventos

3, com datas em setembro e outubro de 2026 (as do mockup, em abril, já passaram e a
agenda não renderizaria).

### Páginas

`quem-somos` — título longo, com o texto completo da prancha
`contato` — mínima, um parágrafo

---

## Revalidação

O mu-plugin chama `POST /api/revalidate?secret=…&path=…` no
`transition_post_status`, com trava de 10 segundos por post e requisição
não bloqueante.

Caminhos invalidados por tipo:

| Tipo | Caminhos |
|---|---|
| Matéria | `/`, `/{categoria}`, `/{categoria}/{slug}` |
| Verbete | `/`, `/almanaque`, `/almanaque/{slug}` |
| Evento | `/`, `/programe-se` |
| Página | `/`, `/{slug}` |

A rota do front precisa aceitar esses caminhos e responder rápido. Manter um
fallback por tempo (`revalidate: 300`) nas listagens, para o caso de o hook falhar
silenciosamente.
