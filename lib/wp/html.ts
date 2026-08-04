/**
 * Decodificação de entidades HTML e conversão para texto simples.
 *
 * Armadilha nº 1 do projeto: a API devolve `title.rendered`, `excerpt.rendered`
 * e o `name` de termos com entidades codificadas — "Saúde & Ciência" chega como
 * `Saúde &amp; Ciência` ou `Saúde &#038; Ciência`, dependendo do endpoint.
 * A decodificação acontece aqui, uma única vez, na camada de dados. Nenhum
 * componente deve decodificar nada.
 *
 * O que **não** passa por aqui: `content.rendered`. Aquele campo é HTML do
 * editor de blocos e vai para o DOM via `dangerouslySetInnerHTML` — decodificar
 * antes transformaria entidades legítimas do texto em marcação.
 */

/**
 * Entidades nomeadas que o WordPress efetivamente emite em campos de texto.
 * Como a resposta é UTF-8, letras acentuadas chegam cruas — a lista só precisa
 * cobrir pontuação, símbolos e os caracteres reservados do HTML.
 */
const NOMEADAS: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  sbquo: '‚',
  bdquo: '„',
  laquo: '«',
  raquo: '»',
  lsaquo: '‹',
  rsaquo: '›',
  bull: '•',
  middot: '·',
  deg: '°',
  copy: '©',
  reg: '®',
  trade: '™',
  euro: '€',
  pound: '£',
  cent: '¢',
  sup2: '²',
  sup3: '³',
  frac12: '½',
  frac14: '¼',
  times: '×',
  divide: '÷',
  minus: '−',
  plusmn: '±',
  prime: '′',
  Prime: '″',
  dagger: '†',
  sect: '§',
  para: '¶',
  shy: '\u00ad',
  ensp: '\u2002',
  emsp: '\u2003',
  thinsp: '\u2009',
  zwnj: '\u200c',
  zwj: '\u200d',
};

const ENTIDADE = /&(#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]{1,31});/g;

function doPontoDeCodigo(codigo: number): string | null {
  // Substitutos (surrogates) e valores fora do plano Unicode não são texto
  // válido — devolver null preserva a entidade original em vez de gerar "�".
  if (!Number.isFinite(codigo) || codigo < 1 || codigo > 0x10ffff) return null;
  if (codigo >= 0xd800 && codigo <= 0xdfff) return null;

  return String.fromCodePoint(codigo);
}

/**
 * Decodifica entidades HTML **uma única vez**.
 *
 * Uma passada, não um laço até estabilizar: `&#038;` é o `&` já codificado uma
 * vez pelo WordPress, e decodificar de novo mudaria o significado do texto —
 * `&amp;lt;b&amp;gt;` viraria marcação onde o autor escreveu os sinais.
 */
export function decodificarEntidades(texto: string): string {
  if (!texto || !texto.includes('&')) return texto;

  return texto.replace(ENTIDADE, (original, corpo: string) => {
    if (corpo.charCodeAt(0) === 35 /* # */) {
      const hex = corpo[1] === 'x' || corpo[1] === 'X';
      const codigo = parseInt(hex ? corpo.slice(2) : corpo.slice(1), hex ? 16 : 10);

      return doPontoDeCodigo(codigo) ?? original;
    }

    return NOMEADAS[corpo] ?? original;
  });
}

/** Remove tags HTML sem tentar interpretar o documento. */
function removerTags(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, ' ')
    .replace(/<[^>]*>/g, '');
}

/**
 * Converte um campo `rendered` em texto simples, pronto para um card ou uma
 * meta tag.
 *
 * Resolve três coisas de uma vez: `excerpt.rendered` vem envolvido em `<p>`, o
 * WordPress anexa `[…]` quando trunca automaticamente, e as entidades ainda
 * precisam ser decodificadas.
 */
export function paraTextoSimples(html: string | null | undefined): string {
  if (!html) return '';

  return decodificarEntidades(removerTags(html))
    .replace(/\s+/g, ' ')
    .replace(/\s*\[(…|\.\.\.)\]\s*$/, '…')
    .trim();
}

/**
 * Primeira letra de um título, para o índice A–Z do Almanaque.
 *
 * Não existe campo para a letra na API — ela é derivada aqui. O acento é
 * normalizado antes de agrupar, para "Á" cair em "A"; o que não for letra
 * de A a Z vai para "#".
 */
export function letraInicial(titulo: string): string {
  const primeira = titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .charAt(0)
    .toUpperCase();

  return /^[A-Z]$/.test(primeira) ? primeira : '#';
}
