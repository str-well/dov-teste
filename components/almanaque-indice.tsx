'use client';

import Fuse from 'fuse.js';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { IconeBusca } from './icones';
import { Realce } from './realce';

/** O que o índice precisa de cada verbete. Nada além disso vai para o cliente. */
export type ItemDoIndice = {
  slug: string;
  titulo: string;
  definicao: string;
  letra: string;
};

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Abaixo de 2 caracteres a busca não filtra: "a" casaria com quase tudo. */
const MINIMO_DE_CARACTERES = 2;

type Props = {
  verbetes: ItemDoIndice[];
  /**
   * Kicker, título e texto da cabeça, vindos do servidor. Entram **dentro** da
   * seção escura, acima do campo de busca — que precisa ficar ali, como nas
   * pranchas, mas é estado do cliente. O slot é o que permite os dois no mesmo
   * lugar sem levar o `<h1>` e a contagem para o pacote do navegador.
   */
  cabeca: React.ReactNode;
};

/**
 * O índice A–Z do Almanaque: tira de letras sticky, blocos por letra e busca.
 *
 * **Por que é um componente cliente com a lista inteira nas props**, e não o
 * `public/almanaque.json` que o plano previa: o JSON exigiria um passo de build
 * próprio, e o projeto tem como preferência explícita minimizar infraestrutura.
 * Com 22 verbetes a lista custa ~3 kB no payload desta página — que é a única
 * que precisa dela. **Quando o Almanaque chegar perto dos 418 verbetes
 * prometidos (~80 kB), vale voltar para o arquivo estático**, que o navegador
 * cacheia independente do HTML.
 *
 * A busca é Fuse.js e não um `includes`: "bâtonnage", "chaptalização" e
 * "assemblage" são exatamente as palavras que ninguém escreve certo de primeira,
 * e tolerância a erro de digitação aqui vale os 12 kB da biblioteca.
 */
export function AlmanaqueIndice({ verbetes, cabeca }: Props) {
  const [termo, setTermo] = useState('');
  const [letraAtiva, setLetraAtiva] = useState<string | null>(null);
  const reduzirMovimento = useRef(false);

  useEffect(() => {
    reduzirMovimento.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(verbetes, {
        keys: [
          { name: 'titulo', weight: 3 },
          { name: 'definicao', weight: 1 },
        ],
        // Tolerante, mas não ao ponto de "vinho" trazer "vindima": 0.35 acerta
        // erro de acento e de uma ou duas letras.
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: MINIMO_DE_CARACTERES,
      }),
    [verbetes],
  );

  const busca = termo.trim();

  const encontrados = useMemo(() => {
    if (busca.length < MINIMO_DE_CARACTERES) return null;

    return new Set(fuse.search(busca).map((resultado) => resultado.item.slug));
  }, [busca, fuse, verbetes]);

  const visiveis = encontrados
    ? verbetes.filter((verbete) => encontrados.has(verbete.slug))
    : verbetes;

  const grupos = ALFABETO.map((letra) => ({
    letra,
    verbetes: visiveis.filter((verbete) => verbete.letra === letra),
  }));

  // Títulos que não começam com letra de A a Z. Só entra se existir algum.
  const foraDoAlfabeto = visiveis.filter((verbete) => verbete.letra === '#');
  const todos = foraDoAlfabeto.length > 0
    ? [...grupos, { letra: '#', verbetes: foraDoAlfabeto }]
    : grupos;

  const comVerbetes = todos.filter((grupo) => grupo.verbetes.length > 0);

  // Letra ativa por `IntersectionObserver`, com o `rootMargin` que a §6 define
  // para esta tira: a faixa estreita no meio da tela é o que faz a letra mudar
  // quando a seção **chega** à leitura, e não quando encosta na borda.
  useEffect(() => {
    const alvos = comVerbetes
      .map((grupo) => document.getElementById(`letra-${grupo.letra.toLowerCase()}`))
      .filter((elemento): elemento is HTMLElement => elemento !== null);

    if (alvos.length === 0) {
      setLetraAtiva(null);
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setLetraAtiva(entrada.target.id.replace('letra-', '').toUpperCase());
          }
        }
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );

    for (const alvo of alvos) observador.observe(alvo);

    return () => observador.disconnect();
    // A dependência é a lista de letras presentes: filtrar a busca muda quais
    // seções existem, e o observador precisa ser remontado.
  }, [comVerbetes.map((g) => g.letra).join('')]);

  function irParaLetra(letra: string) {
    const destino = document.getElementById(`letra-${letra.toLowerCase()}`);

    if (!destino) return;

    // `scrollIntoView` respeita o `scroll-margin-top`, que já desconta o
    // cabeçalho e a tira sticky.
    destino.scrollIntoView({
      behavior: reduzirMovimento.current ? 'auto' : 'smooth',
      block: 'start',
    });

    // `replaceState` e não `pushState`: percorrer o alfabeto não deve encher o
    // histórico de 26 entradas que o botão voltar teria de desfazer. [ESPEC] §6
    history.replaceState(null, '', `#letra-${letra.toLowerCase()}`);
    setLetraAtiva(letra);
  }

  return (
    <>
      <section
        className="secao--escura secao--empilhada cabeca-almanaque"
        aria-labelledby="almanaque-titulo"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="blob blob--menta cabeca-almanaque__blob"
          src="/blobs/dov-blob-menta.svg"
          alt=""
          aria-hidden="true"
        />

        <div className="limite secao__conteudo">
          <div className="cabeca-almanaque__conteudo">
            {cabeca}

            {/* Sem JavaScript o campo leva para a busca geral; com JavaScript
                ele filtra o índice na hora e o envio não faz nada. */}
            <form
              className="busca busca--almanaque"
              role="search"
              action="/busca"
              onSubmit={(evento) => evento.preventDefault()}
            >
              <IconeBusca className="busca__icone" />

              <label className="visualmente-oculto" htmlFor="busca-almanaque">
                Buscar um verbete
              </label>

              <input
                className="busca__campo"
                id="busca-almanaque"
                name="q"
                type="search"
                value={termo}
                onChange={(evento) => setTermo(evento.target.value)}
                placeholder="Buscar um verbete: chaptalização, sur lie, Tannat…"
                autoComplete="off"
              />

              <button className="busca__botao" type="submit">
                Buscar
              </button>
            </form>
          </div>
        </div>
      </section>

      <nav className="letras" aria-label="Índice alfabético">
        <div className="limite">
          <ul className="letras__lista">
            {todos.map((grupo) => {
              const vazia = grupo.verbetes.length === 0;

              return (
                <li key={grupo.letra}>
                  {vazia ? (
                    // Letra sem verbete não é link: fora da tabulação, sem
                    // hover, com `aria-disabled`. [ESPEC] §6
                    <span className="letras__item letras__item--vazia" aria-disabled="true">
                      {grupo.letra}
                    </span>
                  ) : (
                    <a
                      className={`letras__item${
                        letraAtiva === grupo.letra ? ' letras__item--ativa' : ''
                      }`}
                      href={`#letra-${grupo.letra.toLowerCase()}`}
                      aria-current={letraAtiva === grupo.letra ? 'true' : undefined}
                      onClick={(evento) => {
                        evento.preventDefault();
                        irParaLetra(grupo.letra);
                      }}
                    >
                      {grupo.letra}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <section className="verbetes" aria-label="Verbetes do Almanaque">
        <div className="limite">
          {/* Anuncia a contagem quando a busca troca a lista. [ESPEC] §7 */}
          <p className="visualmente-oculto" role="status">
            {encontrados
              ? `${visiveis.length} ${visiveis.length === 1 ? 'verbete' : 'verbetes'} para ${busca}.`
              : ''}
          </p>

          {comVerbetes.length > 0 ? (
            comVerbetes.map((grupo) => (
              <div className="bloco-letra" key={grupo.letra}>
                <div className="bloco-letra__cabeca">
                  <h2
                    className="bloco-letra__inicial"
                    id={`letra-${grupo.letra.toLowerCase()}`}
                  >
                    {grupo.letra}
                  </h2>
                  <p className="bloco-letra__contagem">
                    {grupo.verbetes.length}{' '}
                    {grupo.verbetes.length === 1 ? 'verbete' : 'verbetes'}
                  </p>
                </div>

                <ul className="bloco-letra__lista">
                  {grupo.verbetes.map((verbete) => (
                    <li key={verbete.slug}>
                      <Link className="verbete-item" href={`/almanaque/${verbete.slug}`}>
                        <h3 className="verbete-item__termo">
                          <Realce texto={verbete.titulo} termo={busca} />
                        </h3>
                        {verbete.definicao && (
                          <p className="verbete-item__definicao">{verbete.definicao}</p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <div className="vazio">
              <h2 className="vazio__titulo">Nenhum verbete para “{busca}”</h2>
              <p className="vazio__texto">
                Confira a grafia ou tente uma palavra mais curta — “tanino”, “safra”,
                “espumante”.
              </p>
              <button className="botao botao--contorno" type="button" onClick={() => setTermo('')}>
                Limpar a busca
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
