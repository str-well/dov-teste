/**
 * Preparação do corpo do artigo para render.
 *
 * Fica fora de `lib/wp/` de propósito: `lib/wp` busca e mapeia, isto aqui
 * prepara HTML para a tela. O corpo continua saindo cru da camada de dados.
 *
 * **Por que mexer no HTML do WordPress, se a regra é não normalizar no servidor:**
 * o sumário "Neste texto" precisa de âncora, e o editor de blocos **não gera
 * `id` nos títulos**. Sem `id` não há para onde o link do sumário apontar.
 * A intervenção é a mínima possível — acrescentar `id` onde falta e listar os
 * títulos. Nada de reescrever classe, tag ou estrutura: `wp-block-*` fica
 * intacto, e o estilo continua vindo de um wrapper com escopo.
 */

export type ItemDoSumario = {
  id: string;
  texto: string;
  /** 2 ou 3. O sumário mostra só os de nível 2; o 3 fica disponível. */
  nivel: 2 | 3;
};

export type Artigo = {
  /** O mesmo HTML, com `id` nos títulos que não tinham. */
  html: string;
  sumario: ItemDoSumario[];
};

const TITULOS = /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi;
const ID_EXISTENTE = /\bid\s*=\s*["']([^"']+)["']/i;
const COMBINANTES = /[\u0300-\u036f]/g;

/**
 * Gera um `id` estável a partir do texto do título.
 *
 * Estável importa: o `id` entra na URL quando alguém compartilha o link de uma
 * seção. Se ele mudasse a cada build, o link morreria.
 */
function paraId(texto: string): string {
  const base = texto
    .normalize('NFD')
    .replace(COMBINANTES, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return base === '' ? 'secao' : base;
}

/** Tira tags e decodifica o mínimo, para ter o texto do título. */
function textoDoTitulo(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Acrescenta `id` aos títulos e devolve o sumário.
 *
 * Títulos que já vierem com `id` — porque alguém editou o bloco no WordPress —
 * mantêm o dele. Repetição de texto ganha sufixo numérico, senão duas seções
 * com o mesmo nome disputariam a mesma âncora.
 */
export function prepararArtigo(html: string): Artigo {
  if (!html) return { html: '', sumario: [] };

  const sumario: ItemDoSumario[] = [];
  const usados = new Set<string>();

  const processado = html.replace(TITULOS, (inteiro, tag: string, atributos: string, interno: string) => {
    const texto = textoDoTitulo(interno);

    if (texto === '') return inteiro;

    const jaTem = atributos.match(ID_EXISTENTE)?.[1];

    let id = jaTem ?? paraId(texto);

    if (!jaTem) {
      let sufixo = 2;
      const raiz = id;

      while (usados.has(id)) {
        id = `${raiz}-${sufixo}`;
        sufixo += 1;
      }
    }

    usados.add(id);
    sumario.push({ id, texto, nivel: tag.toLowerCase() === 'h2' ? 2 : 3 });

    return jaTem ? inteiro : `<${tag}${atributos} id="${id}">${interno}</${tag}>`;
  });

  return { html: processado, sumario };
}
