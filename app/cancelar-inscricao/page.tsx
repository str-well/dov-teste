import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfirmarCancelamento } from '@/components/confirmar-cancelamento';
import { PaginaInstitucional } from '@/components/pagina-institucional';

/**
 * Cancelamento da newsletter — `/cancelar-inscricao?token=…`.
 *
 * É o destino do link que vai em todo e-mail.
 *
 * **A página não cancela nada por si.** Ela mostra um botão, e o botão manda um
 * POST. Cancelar durante o render seria mais curto, e foi a primeira versão
 * disto — mas cliente de e-mail e antivírus corporativo abrem links para
 * escanear, e aí a varredura descadastraria alguém que nunca clicou, **em
 * silêncio**: a pessoa só descobriria ao notar que parou de receber. Detalhe em
 * `app/api/newsletter/cancelar/route.ts`.
 *
 * Continua sendo um clique, sem login e sem formulário — que é o que a LGPD pede
 * quando exige que revogar seja tão fácil quanto consentir.
 *
 * O mu-plugin marca como rascunho em vez de apagar: a lei pede que se possa
 * comprovar a revogação, e registro apagado não comprova nada. Eliminação de
 * verdade é outro direito, pedido pelo contato.
 */
export const metadata: Metadata = {
  title: 'Cancelar inscrição',
  // A URL carrega o token de uma pessoa. Não indexar e não seguir.
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function Page({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <PaginaInstitucional
        kicker="Newsletter"
        titulo="Link incompleto"
        lead={
          'Este endereço chegou sem o código de cancelamento. Use o link "Cancelar a ' +
          'inscrição" que vai no fim de cada e-mail que enviamos.'
        }
      >
        <p>
          Se o link não funcionar, escreva pela <Link href="/contato">página de contato</Link>{' '}
          e a gente cancela na mão.
        </p>
      </PaginaInstitucional>
    );
  }

  return (
    <PaginaInstitucional
      kicker="Newsletter"
      titulo="Cancelar a inscrição"
      lead="Confirme abaixo e você para de receber a newsletter do Descubra o Vinho."
    >
      <ConfirmarCancelamento token={token} />

      <p>
        Mudou de ideia antes de confirmar? Basta fechar esta página — nada foi alterado
        ainda.
      </p>

      <p>
        Se quiser a <strong>eliminação</strong> dos seus dados, e não só o cancelamento,
        peça pela <Link href="/contato">página de contato</Link>. São direitos diferentes,
        e o segundo a gente faz na mão.
      </p>
    </PaginaInstitucional>
  );
}
