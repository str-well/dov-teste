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
| Tipos de verbete | `/verbete_tipos` | taxonomia `verbete_tipo`, desde a v2.2.0 |

Parâmetros úteis: `per_page` (máx. 100), `page`, `categories`, `tags`, `slug`,
`search`, `orderby`, `order`, `_fields`, `_embed`.

Paginação vem nos headers `X-WP-Total` e `X-WP-TotalPages` — necessários para o
componente de paginação **e para qualquer coleção que precise vir inteira.**

⚠️ **`per_page` trava em 100, e o que passa disso volta cortado sem sinal
nenhum:** status 200, lista bem-formada, e os itens além do centésimo
simplesmente não existem para quem chamou. Com 141 verbetes, o Almanaque passou
a depender disso — `buscarTudo()` em `lib/wp/http.ts` percorre as páginas pelo
`X-WP-TotalPages`, em sequência e não em paralelo, porque o plano é
compartilhado. Pedir uma página além da última responde **400**, não lista
vazia, então o total tem de vir do header e nunca de tentativa e erro.

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
  "dov_classe_gramatical": "substantivo masculino",
  "dov_ordenacao": "Natural, vinho",
  "dov_definicao_curta": "O conjunto de solo, clima, relevo e mão humana que faz um vinho ser daquele lugar e de nenhum outro.",
  "dov_etimologia": "do francês terre, terra",
  "dov_pronuncia": "terruár",
  "dov_na_pratica": "Quando um rótulo diz \"vinhedo único\", está dizendo que não quis diluir o terroir misturando parcelas.",
  "dov_curiosidade": "É o método de produção de espumantes mais antigo do mundo, antecedendo o método tradicional em séculos.",
  "dov_relacionados": [23, 24, 33, 26]
}
```

- `dov_classe_gramatical` — "substantivo masculino"; abre a linha sob o título
- `dov_definicao_curta` — usada nos cards do índice A–Z e nos resultados de busca.
  **32 das 124 definições importadas passam de 180 caracteres**, e a maior tem 240:
  o card do índice corta em 2 linhas e a caixa "Do Almanaque" em 3, com `line-clamp`
- `dov_etimologia` e `dov_pronuncia` — muitas vezes vazios; a linha inteira deve
  desaparecer quando ambos estiverem vazios
- `dov_na_pratica` — caixa destacada, opcional
- `dov_curiosidade` — segunda caixa destacada, mesmo componente com o rótulo
  "Curiosidade". **Independente da anterior:** um verbete pode ter as duas, e a
  ordem é "Na prática" primeiro
- `dov_ordenacao` — **governa letra e posição no índice A–Z sem mudar o título
  exibido.** Vazio na maioria; quem não tem ordena pelo título. Existe porque 22
  títulos começam com "Vinho": sem ele a letra V teria 27 verbetes e as outras
  ficariam vazias. Com ele, V fica com 6 e "Vinho Natural" cai em N
- **A letra do índice A–Z é derivada no front**, de `dov_ordenacao` quando
  preenchido e do título quando não. Não existe campo para ela. Acento é
  normalizado antes de agrupar (`Á` cai em `A`, `Albariño` cai em A)
- **Letra, ordem e anterior/próximo saem da mesma chave.** Separá-las poria
  "Vinho Natural" sob o N mas ordenado entre os V

#### Tipo de verbete (`/verbete_tipos`)

Taxonomia `verbete_tipo`, hierárquica, seis termos: uvas, vinhos e estilos, países
e regiões, produção, harmonização, denominações.

**Capturada no WordPress e ainda não consumida pelo front.** Não está em nenhuma
prancha do designer, e criar navegação por tipo é decisão de produto, não de
implementação — por isso ela não entra no `_fields` das consultas de verbete: não
se paga payload por dado que ninguém lê. Foi registrada agora porque classificar
141 verbetes depois custaria muito mais caro que classificar na importação.

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

**Coleção acima de 100 volta cortada em silêncio.** `per_page` trava em 100 e não
há erro: a resposta é 200 com uma lista bem-formada e mais curta do que a verdade.
Toda coleção que precise vir inteira tem de percorrer as páginas pelo
`X-WP-TotalPages` — é o que `buscarTudo()` faz. Pedir página além da última
responde 400, então não dá para descobrir o fim por tentativa.

**`meta` não é ordenável.** `orderby` cobre data, título, id e contagem, não campo
personalizado. O índice A–Z ordena por `dov_ordenacao`, então a ordenação acontece
em JavaScript — o que **só é correto porque a lista vem inteira**. Ordenar um
pedaço paginado daria uma ordem plausível e errada.

**`_embed`** traz autor, imagem e termos numa requisição, mas infla a resposta.
Preferir `_fields` explícito e, quando precisar de termos, buscar a lista de
categorias e tags uma vez e cachear.

---

## Escrita — namespace `dov/v1`

O único lugar em que o front **grava** no WordPress. Fora daqui tudo é leitura.

| Rota | Papel |
|---|---|
| `POST /dov/v1/assinantes` | Cria o assinante da newsletter. Idempotente: e-mail repetido devolve `ja_assinava: true` e o token existente |
| `POST /dov/v1/assinantes/cancelar` | Cancela pelo token. Marca como rascunho, não apaga |

Autenticadas por `DOV_ASSINANTES_SECRET` no cabeçalho `X-Dov-Segredo`, comparado
com `hash_equals`. **Segredo separado do de revalidação**, que viaja em query
string e portanto entra em log de servidor e de proxy.

Namespace próprio em vez de `wp/v2` com senha de aplicativo: a senha daria ao
portador tudo que o usuário pode fazer no WordPress; aqui o segredo abre duas
operações e nada mais.

O CPT `assinante` tem **`show_in_rest => false`** — é o único do projeto que tem.
Com `true`, a lista inteira de e-mails ficaria pública em
`/wp-json/wp/v2/assinantes`.

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

**22 de teste até a importação do cliente; 141 depois dela** — 124 novos mais 17
de teste que permanecem. Cinco dos de teste são atualizados no lugar, mantendo id
e slug, porque matérias apontam para verbete por id e a da Serra Gaúcha linka
`/almanaque/denominacao-de-origem` no corpo.

Passar de 100 é o que torna a paginação obrigatória em toda busca de verbete.
Ver o aviso em **Endpoints**.

As letras vazias deixam de ser as mesmas: com 141 verbetes só sobram algumas, e o
estado cinza sem link do índice A–Z passa a ser exercitado por menos delas. Vale
conferir quais depois da importação, em vez de confiar na lista antiga.

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
| Evento | `/`, `/agenda`, `/agenda/{slug}` |
| Página | `/`, `/{slug}` |

Desde a v2.2.0 **mudança de termo também revalida**, o que antes não acontecia:
renomear uma editoria deixava o nome antigo no menu até o fallback de 5 minutos.
Editoria e tag invalidam a home e todos os arquivos de editoria — não há como
saber quais páginas exibiam o valor antigo. Tipo de verbete invalida só
`/almanaque`.

**Modo lote:** gravação REST autenticada com `?dov_lote=1` não dispara
revalidação. Sem isso, importar 124 verbetes geraria ~370 chamadas saindo do
WordPress num plano compartilhado com outros 6 sites. O importador revalida uma
vez, no final.

A rota do front precisa aceitar esses caminhos e responder rápido. Manter um
fallback por tempo (`revalidate: 300`) nas listagens, para o caso de o hook falhar
silenciosamente.
