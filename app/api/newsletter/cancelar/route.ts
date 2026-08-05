import { receber } from '@/lib/formulario';
import { cancelarInscricao } from '@/lib/wp';

/**
 * Cancelamento da newsletter.
 *
 *     POST /api/newsletter/cancelar   { "token": "…" }
 *
 * **É POST, e isso é o ponto do arquivo.** Um GET que cancela parece mais
 * simples — o link do e-mail cancelaria direto —, mas cliente de e-mail e
 * antivírus corporativo abrem links para pré-visualizar e escanear. Com GET,
 * essa varredura descadastraria alguém que nunca clicou, **em silêncio**: a
 * pessoa só descobriria ao notar que parou de receber. É o mesmo padrão de falha
 * invisível que o resto do projeto evita.
 *
 * Com POST, a pré-visualização abre a página e não acontece nada. Quem cancela é
 * o clique no botão. Um clique só, sem login e sem formulário — a LGPD pede que
 * revogar seja tão fácil quanto consentir, e continua sendo.
 */
export const dynamic = 'force-dynamic';

export async function POST(requisicao: Request) {
  // Sem limite de envio próprio: cancelar não manda e-mail, então não há cota a
  // proteger. A guarda de enxurrada do `receber()` já basta — e um 429 aqui
  // atrapalharia justamente quem está tentando exercer um direito.
  const { corpo, falha } = await receber(requisicao, 'cancelar');

  if (falha) {
    return falha.erro
      ? Response.json({ ok: false, erro: falha.erro }, { status: falha.status })
      : Response.json({ ok: true });
  }

  const token = typeof corpo.token === 'string' ? corpo.token.trim() : '';

  if (!token) {
    return Response.json({ ok: false, motivo: 'sem_token' }, { status: 400 });
  }

  const resultado = await cancelarInscricao(token);

  if (resultado.ok) {
    return Response.json({ ok: true });
  }

  // Token inexistente não é erro de servidor: é link antigo, ou cancelamento que
  // já foi feito. 404 para o cliente saber diferenciar de falha de verdade.
  if (resultado.motivo === 'nao_encontrado') {
    return Response.json({ ok: false, motivo: 'nao_encontrado' }, { status: 404 });
  }

  console.error('[cancelar] falha:', resultado.motivo, resultado.detalhe);

  return Response.json({ ok: false, motivo: 'falha' }, { status: 503 });
}
