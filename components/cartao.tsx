import Link from 'next/link';

import { dataCurta, dataParaAtributo, tempoDeLeitura } from '@/lib/formato';
import { categoriaPrincipal, type Materia } from '@/lib/wp';

import { ImagemWp } from './imagem-wp';

type CartaoProps = {
  materia: Materia;
  /**
   * `destaque` usa título maior e foto 4:3, como na chamada principal da home.
   * `padrao` é a listagem: foto 3:2.
   */
  variacao?: 'padrao' | 'destaque';
  /** `true` quando o cartão fica sobre off-white: ganha fundo branco e sombra. */
  sobreAlternativa?: boolean;
  /** Desliga o lazy-load. Só no primeiro cartão acima da dobra. */
  prioridade?: boolean;
  /** Nível do título no documento. A página decide, para não furar a hierarquia. */
  nivel?: 2 | 3 | 4;
};

/** Cartão de notícia — a peça que mais se repete no portal. */
export async function CartaoMateria({
  materia,
  variacao = 'padrao',
  sobreAlternativa = false,
  prioridade = false,
  nivel = 3,
}: CartaoProps) {
  // A categoria é resolvida aqui e não recebida por prop: `listarCategorias()`
  // é cacheada por render, então vinte cartões custam uma requisição só. Em
  // troca o cartão é autossuficiente — a página passa a matéria e nada mais.
  const categoria = await categoriaPrincipal(materia);

  // Sem categoria não existe URL: a rota é `/{categoria}/{slug}`. Não renderizar
  // é melhor que link quebrado — e é sinal de matéria publicada sem editoria.
  if (!categoria) return null;

  const href = `/${categoria.slug}/${materia.slug}`;
  const Titulo = `h${nivel}` as 'h2' | 'h3' | 'h4';
  const destaque = variacao === 'destaque';

  return (
    <article
      className={`cartao${destaque ? ' cartao--destaque' : ''}${
        sobreAlternativa ? ' cartao--sobre-alternativa' : ''
      }`}
    >
      {/* Um único <a> envolve tudo: uma área de clique, um item na navegação
          por teclado. [ESPEC] §3 */}
      <Link className="cartao__link" href={href}>
        <div className={`cartao__midia cartao__midia--${destaque ? '4x3' : '3x2'}`}>
          <ImagemWp
            imagens={materia.imagens}
            preferencia={destaque ? ['dov_card_4x3', 'dov_card'] : ['dov_card', 'dov_card_4x3']}
            proporcao={destaque ? '4x3' : '3x2'}
            alt={materia.titulo}
            prioridade={prioridade}
          />
        </div>

        <p className="kicker">{categoria.nome}</p>

        <Titulo className="cartao__titulo">{materia.titulo}</Titulo>

        {materia.resumo && <p className="cartao__resumo">{materia.resumo}</p>}

        <p className="cartao__meta">
          <time dateTime={dataParaAtributo(materia.dataUtc)}>{dataCurta(materia.dataUtc)}</time>
          {' · '}
          {tempoDeLeitura(materia.tempoLeitura)}
        </p>
      </Link>
    </article>
  );
}

/**
 * Variação compacta — barra lateral, relacionados e listas curtas.
 * Sem resumo, foto 1:1, e a data sem o tempo de leitura.
 */
export async function CartaoCompacto({
  materia,
  nivel = 4,
}: {
  materia: Materia;
  nivel?: 3 | 4;
}) {
  const categoria = await categoriaPrincipal(materia);

  if (!categoria) return null;

  const href = `/${categoria.slug}/${materia.slug}`;
  const Titulo = `h${nivel}` as 'h3' | 'h4';

  return (
    <article className="cartao-compacto">
      <Link className="cartao-compacto__link" href={href}>
        <div className="cartao-compacto__midia">
          <ImagemWp
            imagens={materia.imagens}
            preferencia={['dov_retrato', 'dov_card']}
            proporcao="1x1"
            alt={materia.titulo}
          />
        </div>

        <div>
          <p className="kicker kicker--pequeno">{categoria.nome}</p>
          <Titulo className="cartao-compacto__titulo">{materia.titulo}</Titulo>
          <p className="cartao-compacto__meta">
            <time dateTime={dataParaAtributo(materia.dataUtc)}>{dataCurta(materia.dataUtc)}</time>
          </p>
        </div>
      </Link>
    </article>
  );
}
