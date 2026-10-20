/**
 * Versão dos estáticos de marca — logos e blobs.
 *
 * **Isto existe porque `headers()` do Next não alcança `public/` em produção.**
 * Medido nos cabeçalhos: a resposta de um SVG não traz `X-Powered-By: Next.js`
 * nem `x-nextjs-cache`, e o `x-hcdn-upstream-rt` fica em 0,002s contra 0,059s de
 * uma rota HTML. Ou seja, **o servidor web serve o arquivo direto do disco** e o
 * processo Node nem é consultado. Com `next start` local o Node serve, o
 * cabeçalho aparece, e a diferença passa despercebida — foi assim que a primeira
 * tentativa de correção pareceu funcionar e não funcionou.
 *
 * Sem `Cache-Control`, o navegador calcula frescor por heurística. E arquivo em
 * `public/` mantém o caminho exato, sem hash de conteúdo, ao contrário do JS e do
 * CSS. Resultado: a correção de cor do logo subiu e o header continuou mostrando
 * o antigo, porque o navegador nem pediu o arquivo.
 *
 * Mudar a URL é o que resta, e é o que de fato invalida cache em qualquer camada
 * — navegador, CDN e proxy. `BUILD_TIME` vem do `next.config.js`, carimbado a
 * cada build, então **não há nada para lembrar de incrementar**: trocar um SVG e
 * fazer deploy já muda a URL.
 *
 * O custo é baixar os estáticos de novo a cada deploy. São três blobs de 0,2 KB e
 * dois logos de 15 KB — menos de 35 KB, e só para quem volta ao site entre um
 * deploy e outro.
 */
/**
 * `2026-10-20T15:30:11.556Z` vira `20261020T153011`.
 *
 * Sem os dois-pontos e os traços, que viram `%3A` e sujam a URL em toda página.
 * Continua legível de propósito — dá para saber de qual build é a cópia só de
 * olhar o HTML, coisa que um hash opaco não daria.
 */
const VERSAO = (process.env.BUILD_TIME ?? 'dev').replace(/[-:]/g, '').slice(0, 15);

/**
 * Acrescenta a versão a um caminho de `public/`.
 *
 * Usar em **todo** `src` de `/logos/` e `/blobs/`. Esquecer num lugar devolve o
 * problema só naquele arquivo, que é o tipo de inconsistência difícil de notar —
 * o header atualiza e o ícone do card não, por exemplo.
 */
export function comVersao(caminho: string): string {
  return `${caminho}?v=${encodeURIComponent(VERSAO)}`;
}
