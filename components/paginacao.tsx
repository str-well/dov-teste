import Link from 'next/link';

import { IconeSetaDireita, IconeSetaEsquerda } from './icones';

type Props = {
  pagina: number;
  totalPaginas: number;
  /** Monta a URL de uma página. A página decide se usa query ou segmento. */
  href: (pagina: number) => string;
  /** Rótulo do `<nav>`, para quando há mais de uma paginação na tela. */
  rotulo?: string;
};

/**
 * Paginação.
 *
 * Sempre com primeira e última página visíveis, a atual e uma vizinha de cada
 * lado, e reticências no lugar do que foi omitido. Com 3 páginas ou menos, sai
 * a lista inteira e nenhuma reticência.
 *
 * Os números são tabulares — sem isso a régua dança ao trocar de página.
 */
export function Paginacao({ pagina, totalPaginas, href, rotulo = 'Paginação' }: Props) {
  // Uma página só não é navegação, é ruído.
  if (totalPaginas <= 1) return null;

  const atual = Math.min(Math.max(1, pagina), totalPaginas);

  return (
    <nav className="paginacao" aria-label={rotulo}>
      {atual > 1 && (
        <Link className="paginacao__anterior" href={href(atual - 1)} rel="prev">
          <IconeSetaEsquerda />
          Anterior
        </Link>
      )}

      {paginasVisiveis(atual, totalPaginas).map((item, indice) =>
        item === null ? (
          <span
            // O índice é a chave porque duas reticências não têm identidade
            // própria — são o mesmo "há mais páginas aqui".
            key={`salto-${indice}`}
            className="paginacao__reticencias"
            aria-hidden="true"
          >
            …
          </span>
        ) : item === atual ? (
          <span key={item} className="paginacao__item paginacao__item--ativo" aria-current="page">
            {item}
          </span>
        ) : (
          <Link key={item} className="paginacao__item" href={href(item)}>
            <span className="visualmente-oculto">Página </span>
            {item}
          </Link>
        ),
      )}

      {atual < totalPaginas && (
        <Link className="paginacao__proxima" href={href(atual + 1)} rel="next">
          Próxima
          <IconeSetaDireita />
        </Link>
      )}
    </nav>
  );
}

/** `null` é uma reticência. */
function paginasVisiveis(atual: number, total: number): Array<number | null> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const numeros = new Set([1, total, atual, atual - 1, atual + 1]);
  const ordenados = [...numeros].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

  const saida: Array<number | null> = [];

  ordenados.forEach((numero, indice) => {
    const anterior = ordenados[indice - 1];

    if (anterior !== undefined && numero - anterior > 1) {
      // Buraco de uma página só: mostra o número em vez da reticência, que
      // ocupa o mesmo espaço e não leva a lugar nenhum.
      saida.push(numero - anterior === 2 ? anterior + 1 : null);
    }

    saida.push(numero);
  });

  return saida;
}
