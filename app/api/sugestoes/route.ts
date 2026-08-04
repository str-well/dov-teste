import { ErroWordPress, sugestoes } from '@/lib/wp';

/**
 * Sugestões do combobox da busca.
 *
 *     GET /api/sugestoes?q=terr
 *
 * Existe porque o painel é interativo e o cliente precisa buscar a cada tecla.
 * Poderia ser uma server action, mas rota GET é o que permite `AbortController`
 * no cliente — e cancelar a requisição anterior é o que mantém a lista coerente
 * quando alguém digita rápido.
 *
 * A resposta é cacheada por 5 minutos com `s-maxage`: quem digita "vin" recebe a
 * mesma lista de todo mundo, e é o plano compartilhado da Hostinger que agradece.
 */
export const revalidate = 300;

const MINIMO_DE_CARACTERES = 3;

export async function GET(requisicao: Request) {
  const termo = new URL(requisicao.url).searchParams.get('q')?.trim() ?? '';

  // O cliente já não pede abaixo de 3 caracteres. Aqui é a trava do servidor:
  // uma busca de 1 letra varre o banco inteiro para nada.
  if (termo.length < MINIMO_DE_CARACTERES) {
    return Response.json({ sugestoes: [] });
  }

  try {
    return Response.json(
      { sugestoes: await sugestoes(termo) },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate=60`,
        },
      },
    );
  } catch (erro) {
    // 503 e não 500: é indisponibilidade do WordPress, não defeito nosso. O
    // cliente mostra "Não foi possível sugerir agora" e o Enter continua
    // levando para a busca completa.
    const status = erro instanceof ErroWordPress ? 503 : 500;

    return Response.json({ sugestoes: [], erro: true }, { status });
  }
}
