import type { Metadata } from 'next';

import { Busca } from '@/components/busca';
import { BuscaComSugestoes } from '@/components/busca-com-sugestoes';
import { CartaoCompacto, CartaoMateria } from '@/components/cartao';
import { ChipsRolagem } from '@/components/chips-rolagem';
import { IconeSetaDireita } from '@/components/icones';
import { Paginacao } from '@/components/paginacao';
import { listarMaterias, listarTags } from '@/lib/wp';

export const metadata: Metadata = {
  title: 'Componentes · Descubra o Vinho',
  robots: { index: false, follow: false },
};

/**
 * Prancha viva dos componentes globais.
 *
 * Contraparte de `design/telas/00-fundamentos-componentes.html`: os mesmos
 * componentes, mas renderizados com dados reais do WordPress, para comparar
 * lado a lado. Cabeçalho e rodapé não aparecem aqui porque vêm do layout —
 * já estão em volta desta página.
 *
 * Vale como ferramenta de verificação enquanto os templates são construídos.
 * Sai antes do lançamento, junto com a `/diagnostico`.
 */
export default async function Page() {
  const [{ itens: materias, totalPaginas }, tags] = await Promise.all([
    listarMaterias({ porPagina: 6 }),
    listarTags(),
  ]);

  const [primeira, segunda, terceira] = materias;

  // O último da lista, de propósito: fora da tela no mobile, é o que prova que
  // a tira rola até o chip aceso ao carregar.
  const tagDeTeste = tags.at(-1);

  return (
    <main className="limite secao">
      <p className="kicker">Sistema de design</p>
      <h1 className="titulo-secao" style={{ marginBottom: 'var(--dov-esp-9)' }}>
        Componentes globais, com dados reais
      </h1>

      <Secao titulo="01 · Botões">
        <div className="chips">
          <button className="botao botao--primario" type="button">
            Primário
          </button>
          <button className="botao botao--contorno" type="button">
            Contorno
          </button>
          <button className="botao botao--primario botao--pequeno" type="button">
            Pequeno
          </button>
          <button className="botao botao--contorno botao--mini" type="button">
            Mini
          </button>
          <button className="botao botao--verde" type="button">
            Verde
          </button>
          <button className="botao botao--primario" type="button" disabled>
            Desabilitado
          </button>
          <a className="link-texto" href="#componentes">
            Link de texto
          </a>
        </div>

        <div className="chips" style={{ marginTop: 'var(--dov-esp-4)' }}>
          <button className="botao botao--primario" type="button" aria-busy="true" disabled>
            <span className="botao__spinner" aria-hidden="true" />
            Enviando
          </button>
          <a className="botao botao--primario" href="#componentes">
            Com ícone
            <IconeSetaDireita className="botao__icone" />
          </a>
        </div>
      </Secao>

      <Secao titulo="02 · Chips, etiquetas e paginação">
        <div className="chips">
          <button className="chip chip--ativo" type="button" aria-current="true">
            Tudo
          </button>
          <button className="chip" type="button">
            Enoturismo
          </button>
          <button className="chip" type="button">
            Espumantes
          </button>
          <span className="chip chip--sugestao">Sugestão</span>
        </div>

        <div className="chips" style={{ marginTop: 'var(--dov-esp-4)' }}>
          <span className="etiqueta etiqueta--roxa">Roxa</span>
          <span className="etiqueta etiqueta--verde">Verde</span>
          <span className="etiqueta etiqueta--neutra">Neutra</span>
          <span className="etiqueta etiqueta--contorno">Contorno</span>
        </div>

        <div style={{ marginTop: 'var(--dov-esp-8)' }}>
          <Paginacao
            pagina={2}
            totalPaginas={Math.max(totalPaginas, 8)}
            href={(p) => `/componentes?pagina=${p}`}
            rotulo="Exemplo de paginação"
          />
        </div>
      </Secao>

      <Secao titulo="03 · Barra de busca com sugestões">
        <BuscaComSugestoes id="busca-prancha-hero" />
        <p className="cartao__meta" style={{ marginTop: 'var(--dov-esp-3)' }}>
          Digite 3 letras — tente <strong>terr</strong>, <strong>vinh</strong> ou{' '}
          <strong>queij</strong>. Setas circulam, Enter sem item em foco vai para a busca
          completa, Esc fecha mantendo o texto.
        </p>

        <div style={{ marginTop: 'var(--dov-esp-8)' }}>
          <Busca id="busca-prancha-media" tamanho="media" valor="enoturismo na serra" />
          <p className="cartao__meta" style={{ marginTop: 'var(--dov-esp-3)' }}>
            A versão sem sugestões, para onde não faz sentido — funciona sem JavaScript.
          </p>
        </div>
      </Secao>

      <Secao titulo="04 · Tira de chips com rolagem">
        <p className="cartao__meta" style={{ marginBottom: 'var(--dov-esp-4)' }}>
          No desktop os chips quebram em linhas. Estreite a janela para menos de 768px e a
          tira passa a rolar, com o último chip cortado na borda. O chip aceso é
          o <strong>{tagDeTeste?.nome ?? 'último'}</strong>, e ao carregar a página a tira
          rola até ele.
        </p>

        <ChipsRolagem>
          <button className="chip" type="button">
            Tudo
          </button>
          {tags.map((tag) => (
            <button
              key={tag.slug}
              className="chip"
              type="button"
              aria-current={tag.slug === tagDeTeste?.slug ? 'true' : undefined}
            >
              {tag.nome}
            </button>
          ))}
        </ChipsRolagem>
      </Secao>

      <Secao titulo="05 · Cartão — padrão, destaque e compacto">
        <p className="cartao__meta" style={{ marginBottom: 'var(--dov-esp-5)' }}>
          Nenhuma matéria tem imagem destacada hoje, então todos os cartões estão no
          estado vazio — é o comportamento correto, não uma falha de carregamento.
        </p>

        {materias.length > 0 ? (
          <>
            <div className="grade-cartoes">
              {materias.slice(0, 3).map((materia) => (
                <CartaoMateria key={materia.id} materia={materia} nivel={3} />
              ))}
            </div>

            {primeira && (
              <div className="grade-cartoes--duplo grade-cartoes" style={{ marginTop: 'var(--dov-esp-9)' }}>
                <CartaoMateria materia={primeira} variacao="destaque" nivel={3} />
                <div className="pilha" style={{ display: 'grid', gap: 'var(--dov-esp-5)', alignContent: 'start' }}>
                  {[segunda, terceira].filter(Boolean).map((materia) => (
                    <CartaoCompacto key={materia!.id} materia={materia!} nivel={4} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="lead">Nenhuma matéria publicada.</p>
        )}
      </Secao>

      <Secao titulo="06 · Carregamento">
        <div className="grade-cartoes">
          {[0, 1, 2].map((i) => (
            <div key={i} aria-busy="true">
              <div className="esqueleto cartao__midia--3x2" />
              <div className="esqueleto esqueleto--texto" style={{ marginTop: 'var(--dov-esp-4)', width: '30%' }} />
              <div className="esqueleto esqueleto--texto" style={{ marginTop: 'var(--dov-esp-2)' }} />
              <div className="esqueleto esqueleto--texto" style={{ marginTop: 'var(--dov-esp-2)', width: '70%' }} />
            </div>
          ))}
        </div>
      </Secao>
    </main>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 'var(--dov-esp-13)' }}>
      <h2
        className="kicker kicker--neutro"
        style={{ marginBottom: 'var(--dov-esp-5)', fontFamily: 'var(--dov-fonte-corpo)' }}
      >
        {titulo}
      </h2>
      {children}
    </section>
  );
}
