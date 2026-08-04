import { SITE } from '@/lib/site';

type Props = {
  className: string;
  /** Versão branca, para fundo roxo, marinho ou foto escura. */
  branco?: boolean;
  /** `true` quando o logo é decorativo porque já existe outro link para a home. */
  decorativo?: boolean;
};

/**
 * O lockup horizontal.
 *
 * `<img>` e não `next/image`: o dimensionamento é por **altura** com
 * `aspect-ratio` (900 × 418), e o `next/image` insere `width`/`height` no
 * elemento, que brigam com isso. Também não há o que otimizar num SVG — o
 * `next/image` existe aqui para as fotos do WordPress.
 *
 * As dimensões vão nos atributos de todo modo, para o navegador reservar o
 * espaço antes do SVG chegar. Sem elas o logo colapsa em 300×150 dentro do flex.
 */
export function Logo({ className, branco = false, decorativo = false }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={`/logos/dov-logo-horizontal-${branco ? 'branco' : 'colorido'}.svg`}
      alt={decorativo ? '' : SITE.nome}
      aria-hidden={decorativo || undefined}
      width={900}
      height={418}
    />
  );
}
