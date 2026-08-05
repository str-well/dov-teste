import Link from 'next/link';

import { intervaloDeDatas } from '@/lib/formato';
import { AGENDA } from '@/lib/site';
import type { Evento } from '@/lib/wp';

/**
 * Cartão de evento da agenda. Usado na home e no índice `/agenda`.
 *
 * Antes de `/agenda/[slug]` existir, o cartão só era link quando o evento tinha
 * `dov_link` externo — e nenhum dos três tinha, então nenhum era clicável.
 * Agora o destino é sempre a página do evento; o link externo virou um botão
 * dentro dela, que é onde faz sentido.
 */
export function ItemDaAgenda({
  evento,
  nivel = 3,
}: {
  evento: Evento;
  /** A home usa h3 sob o h2 da seção; o índice usa h3 sob o h2 do grupo. */
  nivel?: 2 | 3;
}) {
  const Titulo = `h${nivel}` as 'h2' | 'h3';

  return (
    <Link className="agenda__item" href={`${AGENDA.href}/${evento.slug}`}>
      <p className="agenda__data">
        <time dateTime={evento.dataInicio}>
          {intervaloDeDatas(evento.dataInicio, evento.dataFim)}
        </time>
        {evento.local && ` · ${evento.local}`}
      </p>

      <Titulo className="agenda__titulo">{evento.titulo}</Titulo>
    </Link>
  );
}
