import type { Metadata } from 'next';

import { EstadoVazio } from '@/components/estado-vazio';
import { ItemDaAgenda } from '@/components/item-da-agenda';
import { Migalhas } from '@/components/migalhas';
import { ALMANAQUE } from '@/lib/site';
import { listarEventos } from '@/lib/wp';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Agenda',
  description:
    'Feiras, vindimas, degustações e aulas abertas — o que está marcado no mundo do vinho.',
  alternates: { canonical: '/agenda' },
};

/**
 * Índice da agenda — `/agenda`.
 *
 * **Rota fora do `Anexo C`**, acrescentada junto com `/agenda/[slug]`. Sem ela,
 * as migalhas do evento não teriam pai e quem subisse de `/agenda/algum-evento`
 * cairia num 404 — o mesmo defeito que o Almanaque tinha antes do índice.
 *
 * Não confundir com `/programe-se`, que é o arquivo de **matérias** da editoria.
 * A agenda lista **eventos**, que são outro tipo de conteúdo.
 *
 * Sem prancha no pacote do designer: o layout é derivado dos tokens, com a cabeça
 * institucional e a grade de cartões que a home já usa.
 *
 * Não tem paginação nem filtro de propósito — são 3 eventos. Se a agenda crescer
 * ao ponto de precisar, aí vale olhar o arquivo de categoria como referência.
 */
export default async function Page() {
  // Os dois grupos vêm de uma consulta só: `apenasFuturos: false` traz tudo, e a
  // divisão é aqui. `listarEventos` já devolve ordenado pela data de início.
  const todos = await listarEventos({ apenasFuturos: false });
  const futuros = await listarEventos({ apenasFuturos: true });

  const slugsFuturos = new Set(futuros.map((evento) => evento.slug));
  // Passados em ordem inversa: o que acabou de acontecer primeiro.
  const passados = todos.filter((evento) => !slugsFuturos.has(evento.slug)).reverse();

  return (
    <main>
      <section className="cabeca-institucional secao--empilhada" aria-labelledby="agenda-titulo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="blob blob--menta cabeca-institucional__blob"
          src="/blobs/dov-blob-menta.svg"
          alt=""
          aria-hidden="true"
        />

        <div className="limite secao__conteudo">
          <div className="cabeca-institucional__conteudo">
            <Migalhas itens={[{ rotulo: 'Home', href: '/' }, { rotulo: 'Agenda' }]} />

            <h1 className="cabeca-institucional__titulo" id="agenda-titulo">
              Agenda
            </h1>

            <p className="cabeca-institucional__lead">
              Feiras, vindimas, degustações e aulas abertas — o que está marcado, e o que
              já passou.
            </p>
          </div>
        </div>
      </section>

      {futuros.length > 0 ? (
        <section className="secao secao--agenda" aria-labelledby="proximos-titulo">
          <div className="limite">
            <div className="secao__cabeca">
              <div>
                <p className="kicker secao__kicker">Programe-se</p>
                <h2 className="titulo-secao" id="proximos-titulo">
                  Próximos eventos
                </h2>
              </div>
            </div>

            <div className="agenda">
              {futuros.map((evento) => (
                <ItemDaAgenda key={evento.id} evento={evento} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="secao secao--agenda" aria-label="Próximos eventos">
          <div className="limite">
            {/* [ESPEC] §7 — "Agenda sem eventos". A saída é a newsletter, que
                está no rodapé de toda tela. */}
            <EstadoVazio
              titulo="Sem eventos marcados por enquanto"
              orientacao="Assine a newsletter no rodapé para saber quando a agenda abrir."
              rotuloDosAtalhos="Enquanto isso"
              atalhos={[{ rotulo: 'Almanaque A–Z', href: ALMANAQUE.href }]}
              acao={{ rotulo: 'Ver as últimas publicações', href: '/' }}
            />
          </div>
        </section>
      )}

      {passados.length > 0 && (
        <section className="secao" aria-labelledby="passados-titulo">
          <div className="limite">
            <div className="secao__cabeca">
              <div>
                <p className="kicker secao__kicker kicker--neutro">Arquivo</p>
                <h2 className="titulo-secao" id="passados-titulo">
                  Já aconteceram
                </h2>
              </div>
            </div>

            <div className="agenda">
              {passados.map((evento) => (
                <ItemDaAgenda key={evento.id} evento={evento} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
