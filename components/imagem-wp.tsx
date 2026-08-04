import Image from 'next/image';

import { imagem, type Imagens, type NomeTamanho } from '@/lib/wp';

type Props = {
  imagens: Imagens | null;
  /** Tamanhos em ordem de preferência. O primeiro que existir é usado. */
  preferencia: NomeTamanho[];
  /** Texto alternativo de reserva, quando o WordPress não tem `alt` na mídia. */
  alt?: string;
  /** `true` só no hero e no destaque da matéria: desliga o lazy-load. */
  prioridade?: boolean;
  /** Proporção do estado vazio. Deve casar com a da moldura. */
  proporcao?: '16x9' | '3x2' | '4x3' | '1x1';
};

/**
 * Imagem do WordPress, com o estado vazio embutido.
 *
 * Existe porque a ausência de imagem não é exceção neste projeto: `dov_imagens`
 * volta `null` e **nenhum** conteúdo tem imagem destacada hoje. Se cada
 * componente decidisse por conta, metade esqueceria.
 *
 * O `null` tem dois níveis, e os dois passam por aqui: o post pode não ter
 * imagem, **ou** ter imagem e não ter o tamanho pedido — o mu-plugin omite a
 * chave quando o arquivo original é menor que o tamanho solicitado.
 *
 * `unoptimized` é global no `next.config.js`: os tamanhos já saem prontos do
 * WordPress e reprocessá-los gastaria CPU do mesmo plano que roda o WordPress.
 */
export function ImagemWp({
  imagens,
  preferencia,
  alt,
  prioridade = false,
  proporcao = '3x2',
}: Props) {
  const escolhida = imagem(imagens, ...preferencia);

  if (!escolhida) {
    return <SemImagem proporcao={proporcao} />;
  }

  return (
    <Image
      src={escolhida.url}
      // O `alt` da mídia no WordPress vence; o de reserva costuma ser o título.
      alt={escolhida.alt || alt || ''}
      width={escolhida.largura}
      height={escolhida.altura}
      priority={prioridade}
      // Tudo que não é prioritário é preguiçoso. [ESPEC] §8
      loading={prioridade ? undefined : 'lazy'}
    />
  );
}

/**
 * O estado vazio: o cacho da marca sobre roxo-100, na mesma proporção e com o
 * mesmo raio da foto que vai entrar. Decorativo — não anuncia nada.
 */
export function SemImagem({ proporcao = '3x2' }: { proporcao?: Props['proporcao'] }) {
  return (
    <div className={`sem-imagem sem-imagem--${proporcao}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="sem-imagem__cacho"
        src="/logos/dov-icone-cacho-colorido.svg"
        alt=""
        width={630}
        height={900}
      />
    </div>
  );
}
