'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { BUSCA, LARGURA_MENU_DESKTOP, REDES, SITE, type ItemNav } from '@/lib/site';

import {
  IconeBusca,
  IconeFechar,
  IconeInstagram,
  IconeMenu,
  IconeSetaDireita,
  IconeYoutube,
} from './icones';
import { Logo } from './logo';

type Props = {
  editorias: ItemNav[];
  utilitarios: ItemNav[];
  almanaque: ItemNav;
};

/**
 * Cabeçalho nos dois estados, mais o menu em tela cheia.
 *
 * As duas versões — desktop e mobile — são renderizadas juntas e alternadas por
 * CSS em 1280px, não por JavaScript. Assim não há salto de layout na hidratação
 * nem uma leitura de `window.innerWidth` que o servidor não consegue prever.
 *
 * A fronteira é 1280 e não 1025 porque as 7 editorias mais o Almanaque e a
 * busca não caberiam na linha — decisão fechada em `docs/DESIGN.md`.
 */
export function CabecalhoInterativo({ editorias, utilitarios, almanaque }: Props) {
  const caminho = usePathname();
  const reduzido = useCabecalhoReduzido();
  const [menuAberto, setMenuAberto] = useState(false);
  const fecharRef = useRef<HTMLButtonElement>(null);

  // Navegar fecha o menu. Cobre o caso em que o link aponta para outra rota;
  // o clique no item da rota atual é fechado pelo `Dialog.Close` do próprio item.
  useEffect(() => {
    setMenuAberto(false);
  }, [caminho]);

  // Chegar ao desktop também fecha. O painel é renderizado por portal no
  // `<body>`, fora de `.cabecalho__mobile` — então o `display: none` do CSS não
  // o alcança, e girar um tablet com o menu aberto deixaria o painel cobrindo o
  // layout de desktop.
  useEffect(() => {
    const consulta = window.matchMedia(`(min-width: ${LARGURA_MENU_DESKTOP}px)`);

    const aoMudar = (evento: MediaQueryListEvent | MediaQueryList) => {
      if (evento.matches) setMenuAberto(false);
    };

    aoMudar(consulta);
    consulta.addEventListener('change', aoMudar);

    return () => consulta.removeEventListener('change', aoMudar);
  }, []);

  const ativo = (href: string) =>
    href.startsWith('/') && (caminho === href || caminho.startsWith(`${href}/`));

  const redesVisiveis = REDES.filter((rede) => rede.url);

  return (
    <header className={`cabecalho${reduzido.ativo ? ' cabecalho--reduzido' : ''}`}>
      {/* Sentinelas da histerese. Ver `useCabecalhoReduzido`. */}
      <div ref={reduzido.refEntra} className="cabecalho__sentinela cabecalho__sentinela--entra" aria-hidden="true" />
      <div ref={reduzido.refSai} className="cabecalho__sentinela cabecalho__sentinela--sai" aria-hidden="true" />

      {/* ---------------------------------------------------------- desktop */}
      <div className="cabecalho__desktop">
        {/* Rola para fora e não volta — só a barra branca é sticky. */}
        <div className="faixa-utilitaria">
          <div className="limite faixa-utilitaria__interno">
            <p className="assinatura">{SITE.assinatura}</p>

            <div className="links-utilitarios">
              {utilitarios.map((item) => (
                <Link
                  key={item.href}
                  className="links-utilitarios__link"
                  href={item.href}
                  aria-current={ativo(item.href) ? 'page' : undefined}
                >
                  {item.rotulo}
                </Link>
              ))}

              {redesVisiveis.length > 0 && (
                <div className="redes">
                  {redesVisiveis.map((rede) => (
                    <a
                      key={rede.nome}
                      className="redes__link"
                      href={rede.url as string}
                      aria-label={rede.nome}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {rede.nome === 'Instagram' ? (
                        <IconeInstagram className="redes__icone" />
                      ) : (
                        <IconeYoutube className="redes__icone" />
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="cabecalho__barra">
          <div className="limite barra-principal">
            <Link className="marca" href="/" aria-label={`${SITE.nome} — página inicial`}>
              <Logo className="marca__logo" />
            </Link>

            <nav className="menu-principal" aria-label="Editorias">
              <ul className="menu-principal__lista">
                {editorias.map((item) => (
                  <li key={item.href}>
                    <Link
                      className="menu-principal__link"
                      href={item.href}
                      aria-current={ativo(item.href) ? 'page' : undefined}
                    >
                      {item.rotulo}
                    </Link>
                  </li>
                ))}
              </ul>

              <span className="menu-principal__divisor" aria-hidden="true" />

              <Link className="botao botao--contorno botao--mini" href={almanaque.href}>
                {almanaque.rotulo}
              </Link>

              <Link className="botao-icone" href={BUSCA.href} aria-label={BUSCA.rotulo}>
                <IconeBusca className="botao-icone__svg" />
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- mobile */}
      <div className="cabecalho__mobile">
        <Dialog.Root open={menuAberto} onOpenChange={setMenuAberto}>
          <div className="cabecalho-mobile">
            <Link href="/" aria-label={`${SITE.nome} — página inicial`}>
              <Logo className="cabecalho-mobile__logo" />
            </Link>

            <div className="cabecalho-mobile__acoes">
              <Link
                className="botao-icone botao-icone--toque"
                href={BUSCA.href}
                aria-label={BUSCA.rotulo}
              >
                <IconeBusca className="botao-icone__svg" />
              </Link>

              {/* O Radix põe aria-expanded, aria-controls e aria-haspopup aqui. */}
              <Dialog.Trigger className="botao-icone botao-icone--toque" aria-label="Abrir menu">
                <IconeMenu className="botao-icone__svg" />
              </Dialog.Trigger>
            </div>
          </div>

          <Dialog.Portal>
            <Dialog.Content
              className="menu-tela-cheia"
              // O Radix confia em `aria-hidden` nos irmãos e omite o
              // `aria-modal`. A especificação pede os dois, e declarar não
              // custa nada.
              aria-modal="true"
              // O foco vai para o botão de fechar, não para o campo de busca:
              // abrir o teclado virtual sem o usuário pedir é hostil.
              onOpenAutoFocus={(evento) => {
                evento.preventDefault();
                fecharRef.current?.focus();
              }}
            >
              <Dialog.Title className="visualmente-oculto">Menu</Dialog.Title>

              <img
                className="blob blob--lilas menu-tela-cheia__blob"
                src="/blobs/dov-blob-lilas.svg"
                alt=""
                aria-hidden="true"
              />

              <div className="menu-tela-cheia__topo">
                <Logo className="cabecalho-mobile__logo" />
                <Dialog.Close
                  ref={fecharRef}
                  className="botao-icone botao-icone--toque"
                  aria-label="Fechar menu"
                >
                  <IconeFechar className="botao-icone__svg" />
                </Dialog.Close>
              </div>

              <div className="menu-tela-cheia__corpo">
                {/* A busca aparece aberta: no mobile é o caminho mais curto
                    para o conteúdo. O campo é um GET simples — as sugestões
                    são da barra de busca completa, não daqui. */}
                <form className="busca menu-tela-cheia__busca" role="search" action="/busca">
                  <IconeBusca className="busca__icone" />
                  <label className="visualmente-oculto" htmlFor="busca-menu">
                    Buscar no portal
                  </label>
                  <input
                    className="busca__campo"
                    id="busca-menu"
                    name="q"
                    type="search"
                    placeholder="Busque uvas, harmonizações…"
                  />
                </form>

                <nav className="menu-tela-cheia__lista" aria-label="Editorias">
                  {editorias.map((item) => (
                    <Dialog.Close key={item.href} asChild>
                      <Link
                        className="menu-tela-cheia__link"
                        href={item.href}
                        aria-current={ativo(item.href) ? 'page' : undefined}
                      >
                        {item.rotulo}
                      </Link>
                    </Dialog.Close>
                  ))}
                </nav>

                <Dialog.Close asChild>
                  <Link
                    className="botao botao--primario botao--bloco menu-tela-cheia__cta"
                    href={almanaque.href}
                  >
                    Almanaque do vinho
                    <IconeSetaDireita className="botao__icone" />
                  </Link>
                </Dialog.Close>

                <div className="menu-tela-cheia__utilitarios">
                  {utilitarios.map((item) => (
                    <Dialog.Close key={item.href} asChild>
                      <Link href={item.href}>{item.rotulo}</Link>
                    </Dialog.Close>
                  ))}
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}

/**
 * O estado reduzido do cabeçalho, com a histerese que a especificação exige.
 *
 * Duas sentinelas de 1px, em 40px e 24px do topo do documento, observadas por
 * `IntersectionObserver` — não por listener de `scroll`, que dispara a cada
 * quadro e é o que a especificação proíbe.
 *
 * A histerese cai fora sozinha da geometria:
 *
 *   scroll < 24    as duas visíveis          → repouso
 *   24 … 40        só a de 40 visível        → **mantém o estado atual**
 *   scroll ≥ 40    nenhuma visível           → reduzido
 *
 * É essa faixa morta no meio que impede o cabeçalho de vibrar quando o usuário
 * para o scroll em cima do limiar.
 */
function useCabecalhoReduzido() {
  const refEntra = useRef<HTMLDivElement>(null);
  const refSai = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    const entra = refEntra.current;
    const sai = refSai.current;

    if (!entra || !sai) return;

    const observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (entrada.target === entra && !entrada.isIntersecting) setAtivo(true);
        if (entrada.target === sai && entrada.isIntersecting) setAtivo(false);
      }
    });

    observador.observe(entra);
    observador.observe(sai);

    return () => observador.disconnect();
  }, []);

  return { ativo, refEntra, refSai };
}
