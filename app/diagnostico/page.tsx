import './diagnostico.css';

// Revalida a cada 60 segundos. É o coração do teste:
// se o "gerado em" avançar sozinho após 60s, o ISR está funcionando.
export const revalidate = 60;

const API = process.env.WORDPRESS_API_URL ?? '';

type Post = { id: number; title: { rendered: string }; date: string };

type Resultado =
  | { ok: true; posts: Post[]; ms: number }
  | { ok: false; erro: string };

async function buscarPosts(): Promise<Resultado> {
  if (!API) {
    return { ok: false, erro: 'WORDPRESS_API_URL não está definida no ambiente.' };
  }

  const inicio = Date.now();

  try {
    const res = await fetch(`${API}/posts?per_page=5&_fields=id,title,date`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return { ok: false, erro: `A API respondeu ${res.status} ${res.statusText}.` };
    }

    return { ok: true, posts: await res.json(), ms: Date.now() - inicio };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'Falha na requisição.' };
  }
}

function horario(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export default async function Page() {
  const geradoEm = new Date().toISOString();
  const resultado = await buscarPosts();

  return (
    <main>
      <h1>Diagnóstico — Descubra o Vinho</h1>
      <p className="sub">
        Painel de infraestrutura. Provou que o plano Hostinger roda Next.js com ISR;
        agora fica como ferramenta de verificação do front. Fora do sitemap e noindex.
      </p>

      <section>
        <h2>1 · Revalidação (ISR)</h2>
        <dl>
          <dt>Build gerado em</dt>
          <dd>{horario(process.env.BUILD_TIME ?? geradoEm)}</dd>
          <dt>Página gerada em</dt>
          <dd className="big">{horario(geradoEm)}</dd>
        </dl>
        <div className="nota">
          Recarregue várias vezes seguidas. O horário deve <strong>ficar parado</strong>,
          e avançar sozinho depois de 60 segundos. Se avançar a cada recarga, a página
          está dinâmica e não em cache. Se nunca avançar, o ISR não está gravando.
        </div>
      </section>

      <section>
        <h2>2 · Conexão com o WordPress</h2>
        {resultado.ok ? (
          <>
            <dl>
              <dt>Status</dt>
              <dd className="ok">Conectado</dd>
              <dt>Tempo de resposta</dt>
              <dd>{resultado.ms} ms</dd>
              <dt>Posts recebidos</dt>
              <dd>{resultado.posts.length}</dd>
            </dl>
            <div className="nota">
              <strong>Últimos posts:</strong>
              <ul style={{ marginTop: 6 }}>
                {resultado.posts.map((p) => (
                  <li key={p.id}>
                    {p.title.rendered} — {horario(p.date)}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <dl>
            <dt>Status</dt>
            <dd className="erro">Falhou</dd>
            <dt>Motivo</dt>
            <dd>{resultado.erro}</dd>
          </dl>
        )}
      </section>

      <section>
        <h2>3 · O que verificar</h2>
        <ol>
          <li>
            O <code>next build</code> terminou sem morrer? Se travou sem mensagem
            clara, é falta de memória — passe o build para o GitHub Actions.
          </li>
          <li>
            Um <code>git push</code> dispara deploy sozinho, ou você precisou clicar
            no painel?
          </li>
          <li>
            Abra <code>/api/health</code> e anote a versão do Node e o{' '}
            <code>uptime</code>.
          </li>
          <li>
            Volte amanhã e confira o <code>uptime</code> de novo. Se tiver zerado, o
            processo caiu e foi reiniciado — ou pior, ficou fora do ar.
          </li>
          <li>
            Publique um post no WordPress e cronometre até ele aparecer aqui. Deve
            levar no máximo 60 segundos.
          </li>
        </ol>
      </section>
    </main>
  );
}
