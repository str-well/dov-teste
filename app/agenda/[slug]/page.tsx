import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { IconeSetaDireita } from '@/components/icones';
import { ItemDaAgenda } from '@/components/item-da-agenda';
import { Migalhas } from '@/components/migalhas';
import { intervaloDeDatas } from '@/lib/formato';
import { AGENDA, SITE } from '@/lib/site';
import { eventoPorSlug, listarEventos } from '@/lib/wp';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

/**
 * Página do evento — `/agenda/[slug]`.
 *
 * **Rota fora do `Anexo C`.** O CPT `evento` sempre teve corpo de texto no editor
 * e nenhum lugar para exibi-lo; o mu-plugin até declara
 * `'rewrite' => array('slug' => 'agenda')`, então a intenção original era esta.
 * Até aqui o cartão da agenda só era link quando havia `dov_link` externo — e
 * nenhum dos eventos tinha, então nenhum era clicável.
 *
 * O link externo virou um botão **dentro** da página, que é onde faz sentido:
 * quem clica no cartão quer saber do que se trata antes de sair do portal.
 *
 * Sem prancha no pacote: layout derivado dos tokens, reaproveitando a cabeça
 * institucional e a prosa. A data e o local entram no lugar do kicker.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const evento = await eventoPorSlug(slug);

  if (!evento) return {};

  const quando = intervaloDeDatas(evento.dataInicio, evento.dataFim);

  return {
    title: evento.titulo,
    description: `${quando}${evento.local ? ` · ${evento.local}` : ''} — na agenda do ${SITE.nome}.`,
    alternates: { canonical: `${AGENDA.href}/${slug}` },
    openGraph: { type: 'article', title: evento.titulo, url: `${AGENDA.href}/${slug}` },
  };
}

export async function generateStaticParams() {
  // Passados incluídos: link compartilhado de evento antigo não deve virar 404.
  const eventos = await listarEventos({ apenasFuturos: false });

  return eventos.map((evento) => ({ slug: evento.slug }));
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const evento = await eventoPorSlug(slug);

  if (!evento) notFound();

  const [futuros] = await Promise.all([listarEventos({ apenasFuturos: true, quantidade: 4 })]);
  const outros = futuros.filter((outro) => outro.slug !== evento.slug).slice(0, 3);

  const quando = intervaloDeDatas(evento.dataInicio, evento.dataFim);
  const jaPassou = !futuros.some((futuro) => futuro.slug === evento.slug);

  return (
    <main>
      <section className="cabeca-institucional secao--empilhada" aria-labelledby="evento-titulo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="blob blob--menta cabeca-institucional__blob"
          src="/blobs/dov-blob-menta.svg"
          alt=""
          aria-hidden="true"
        />

        <div className="limite secao__conteudo">
          <div className="cabeca-institucional__conteudo">
            <Migalhas
              itens={[
                { rotulo: 'Home', href: '/' },
                { rotulo: 'Agenda', href: AGENDA.href },
                { rotulo: evento.titulo },
              ]}
            />

            {/* Data e local no lugar do kicker: é a informação que a pessoa
                procura primeiro numa página de evento. */}
            <p className="kicker kicker--verde">
              <time dateTime={evento.dataInicio}>{quando}</time>
              {evento.local && ` · ${evento.local}`}
            </p>

            <h1 className="cabeca-institucional__titulo" id="evento-titulo">
              {evento.titulo}
            </h1>

            {/* Evento que já passou diz isso na cara, senão a pessoa se programa
                para uma data que não existe mais. */}
            {jaPassou && (
              <p className="cabeca-institucional__lead" role="status">
                Este evento já aconteceu.
              </p>
            )}

            {evento.link && !jaPassou && (
              <p className="evento__acoes">
                <a
                  className="botao botao--primario"
                  href={evento.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver no site do evento
                  <IconeSetaDireita className="botao__icone" />
                </a>
              </p>
            )}
          </div>
        </div>
      </section>

      {evento.conteudoHtml && (
        <div className="limite">
          <div className="prosa" dangerouslySetInnerHTML={{ __html: evento.conteudoHtml }} />
        </div>
      )}

      {outros.length > 0 && (
        <section className="secao secao--agenda" aria-labelledby="outros-titulo">
          <div className="limite">
            <div className="secao__cabeca">
              <div>
                <p className="kicker secao__kicker">Programe-se</p>
                <h2 className="titulo-secao" id="outros-titulo">
                  Outros eventos
                </h2>
              </div>
              <Link className="link-texto" href={AGENDA.href}>
                Agenda completa
              </Link>
            </div>

            <div className="agenda">
              {outros.map((outro) => (
                <ItemDaAgenda key={outro.id} evento={outro} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
