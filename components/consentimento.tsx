'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useCallback, useEffect, useState } from 'react';

/**
 * O banner de consentimento e o carregamento do Google Analytics 4.
 *
 * **Não existe prancha para esta tela.** O banner nasceu da decisão de usar GA4,
 * que é posterior ao pacote do designer, e é montado só com tokens e com os
 * botões que já existem em `componentes.css` — nenhum valor novo.
 *
 * A regra que sustenta o arquivo: **nada de GA antes do "aceitar"**. Não é
 * modo de consentimento com ping anônimo, é ausência de script. Enquanto não
 * houver decisão, o site não pede nada ao Google e não escreve cookie nenhum.
 *
 * Sem `NEXT_PUBLIC_GA_ID` **nada disso aparece** — nem o banner, nem o script,
 * nem o botão do rodapé. É o estado do ambiente local e o da build atual: um
 * banner que pede consentimento para um rastreador que não existe pediria
 * consentimento sobre mentira.
 */

/**
 * Registro no `localStorage`, não em cookie.
 *
 * Cookie de consentimento é ele mesmo um cookie, e o único jeito de justificá-lo
 * é chamá-lo de estritamente necessário — o que é verdade, mas evitável. O
 * `localStorage` não viaja em requisição e não precisa de cláusula.
 *
 * O sufixo de versão existe para o dia em que a lista de finalidades mudar: um
 * "aceito" dado hoje não vale para um pixel de publicidade que entre depois.
 * Trocar para `v2` faz todo mundo decidir de novo, que é o comportamento certo.
 */
const CHAVE = 'dov:consentimento:v1';

/** Como o rodapé reabre o banner. Ver `BotaoPreferencias`. */
const EVENTO_ABRIR = 'dov:abrir-preferencias';

type Decisao = 'aceito' | 'recusado';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function ler(): Decisao | null {
  try {
    const valor = window.localStorage.getItem(CHAVE);

    return valor === 'aceito' || valor === 'recusado' ? valor : null;
  } catch {
    // Safari em navegação privada e alguns modos de bloqueio lançam ao tocar no
    // `localStorage`. Sem registro legível o banner reaparece, que é o lado
    // seguro do erro: perguntar de novo, nunca presumir consentimento.
    return null;
  }
}

function gravar(decisao: Decisao) {
  try {
    window.localStorage.setItem(CHAVE, decisao);
  } catch {
    // Não dá para gravar: a decisão vale para esta navegação e o banner volta na
    // próxima. Preferível a quebrar o clique do leitor.
  }
}

/**
 * Expira os cookies que o GA já tiver escrito.
 *
 * Necessário na revogação: parar de carregar o script não apaga o `_ga`, e o
 * identificador continuaria vivo por dois anos esperando um novo "aceitar".
 *
 * O `domain` tem de ser tentado nas duas formas porque o GA escreve no domínio
 * registrável (`.descubraovinho.com.br`), e um `document.cookie` sem `domain`
 * não alcança o cookie que foi escrito com um.
 */
function apagarCookiesDoGa() {
  const partes = window.location.hostname.split('.');
  const registravel = partes.length > 2 ? `.${partes.slice(-3).join('.')}` : `.${partes.join('.')}`;

  for (const cookie of document.cookie.split(';')) {
    const nome = cookie.split('=')[0]?.trim();

    if (!nome || !/^_ga|^_gid$|^_gat/.test(nome)) {
      continue;
    }

    for (const dominio of [undefined, window.location.hostname, registravel]) {
      document.cookie =
        `${nome}=; path=/; max-age=0` + (dominio ? `; domain=${dominio}` : '');
    }
  }
}

export function Consentimento() {
  const [mostrar, setMostrar] = useState(false);
  const [carregarGa, setCarregarGa] = useState(false);

  useEffect(() => {
    if (!GA_ID) {
      return;
    }

    const decisao = ler();

    if (decisao === 'aceito') {
      setCarregarGa(true);
    } else if (decisao === null) {
      setMostrar(true);
    }

    const abrir = () => setMostrar(true);
    window.addEventListener(EVENTO_ABRIR, abrir);

    return () => window.removeEventListener(EVENTO_ABRIR, abrir);
  }, []);

  const aceitar = useCallback(() => {
    gravar('aceito');
    setCarregarGa(true);
    setMostrar(false);
  }, []);

  const recusar = useCallback(() => {
    gravar('recusado');
    apagarCookiesDoGa();

    // Se o GA já subiu nesta navegação, desmontar a tag não descarrega o `gtag`
    // que está em memória. Recarregar é o único jeito honesto de a recusa valer
    // agora e não só na próxima página.
    if (carregarGa) {
      window.location.reload();

      return;
    }

    setMostrar(false);
  }, [carregarGa]);

  if (!GA_ID) {
    return null;
  }

  return (
    <>
      {carregarGa && (
        <>
          <Script
            id="ga-carregador"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          {/* Sem `page_view` manual: a medição aprimorada do GA4 já dispara em
              mudança de histórico, que é o que a navegação do App Router faz.
              Mandar o evento aqui também contaria cada página duas vezes. */}
          <Script id="ga-config" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];` +
              `function gtag(){dataLayer.push(arguments)}` +
              `gtag('js',new Date());` +
              `gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}

      {mostrar && (
        // Região, não diálogo: o banner não bloqueia a leitura e não rouba o
        // foco de quem chegou para ler uma matéria. Fica no fim do documento,
        // então o teclado o alcança depois do rodapé.
        <section className="consentimento" role="region" aria-label="Cookies de medição">
          <div className="consentimento__caixa">
            {/* Curto de propósito: em tela de 375px o texto longo fazia o aviso
                ocupar 38% da altura. O detalhe — transferência internacional,
                base legal, retenção — mora na política, que é linkada aqui. */}
            <p className="consentimento__texto">
              Queremos usar o Google Analytics para medir quais matérias são lidas. Ele
              grava um cookie e envia dados para fora do Brasil, e nada é carregado antes
              de você autorizar.{' '}
              <Link href="/politica-de-privacidade">Como tratamos seus dados</Link>.
            </p>

            {/* Os dois botões têm o mesmo tamanho e o mesmo peso de propósito:
                recusar não pode ser mais difícil do que aceitar. */}
            <div className="consentimento__acoes">
              <button type="button" className="botao botao--primario" onClick={aceitar}>
                Aceitar
              </button>
              <button type="button" className="botao botao--contorno" onClick={recusar}>
                Recusar
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/**
 * O botão do rodapé que reabre o banner.
 *
 * A LGPD exige que revogar seja tão fácil quanto consentir, e depois da primeira
 * decisão o banner não volta sozinho. Sem este botão, "aceitei sem querer" não
 * teria desfazer.
 */
export function BotaoPreferencias() {
  if (!GA_ID) {
    return null;
  }

  return (
    <button
      type="button"
      className="rodape__preferencias"
      onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR))}
    >
      Preferências de cookies
    </button>
  );
}
