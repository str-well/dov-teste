import Link from 'next/link';

import { ALMANAQUE, PAGINAS_LEGAIS, SITE, ordenarEditorias } from '@/lib/site';
import { listarCategorias } from '@/lib/wp';

import { Logo } from './logo';

/**
 * Rodapé, idêntico em todas as telas.
 *
 * As editorias são divididas em duas colunas — "Editorias" e "Mais" — como nas
 * pranchas. A divisão é pela metade da lista real, não por uma lista chumbada:
 * se o cliente criar uma oitava editoria, ela cai numa das colunas sozinha.
 *
 * `listarCategorias()` é cacheada por render, então esta chamada não gera
 * requisição — o cabeçalho já pediu a mesma lista.
 */
export async function Rodape() {
  const categorias = ordenarEditorias(await listarCategorias());
  const metade = Math.ceil(categorias.length / 2);

  const primeiraColuna = categorias.slice(0, metade);
  const segundaColuna = categorias.slice(metade);

  return (
    <footer className="rodape">
      <div className="limite">
        <div className="rodape__grade">
          <div>
            <Logo className="rodape__logo" branco />
            <p className="rodape__descricao">{SITE.descricao}</p>
          </div>

          <nav aria-labelledby="rodape-editorias">
            <h2 className="rodape__titulo" id="rodape-editorias">
              Editorias
            </h2>
            <ul className="rodape__lista">
              {primeiraColuna.map((categoria) => (
                <li key={categoria.slug}>
                  <Link className="rodape__link" href={`/${categoria.slug}`}>
                    {categoria.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="rodape-mais">
            <h2 className="rodape__titulo" id="rodape-mais">
              Mais
            </h2>
            <ul className="rodape__lista">
              {segundaColuna.map((categoria) => (
                <li key={categoria.slug}>
                  <Link className="rodape__link" href={`/${categoria.slug}`}>
                    {categoria.nome}
                  </Link>
                </li>
              ))}
              <li>
                <Link className="rodape__link" href={ALMANAQUE.href}>
                  Almanaque A–Z
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="rodape__titulo" id="rodape-newsletter">
              Newsletter
            </h2>
            <p className="rodape__texto">Uma carta por semana, com o que vale ler e beber.</p>

            {/* O id é o destino do link "Newsletter" do cabeçalho.
                O envio entra na Fase 4, com a rota /api/newsletter e o Resend. */}
            <form className="rodape__form" id="newsletter" aria-labelledby="rodape-newsletter">
              <label className="visualmente-oculto" htmlFor="rodape-email">
                Seu e-mail
              </label>
              <input
                className="rodape__campo"
                id="rodape-email"
                type="email"
                name="email"
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
              <button className="botao botao--verde" type="submit">
                Assinar
              </button>
            </form>
          </div>
        </div>

        <div className="rodape__base">
          {/* O ano vem do relógio, não chumbado: em 1º de janeiro o rodapé
              estaria errado, e ninguém repara num rodapé. */}
          <p>
            © {new Date().getFullYear()} {SITE.nome} · Todos os direitos reservados
          </p>

          <div className="rodape__legais">
            {PAGINAS_LEGAIS.map((pagina) => (
              <Link key={pagina.href} href={pagina.href}>
                {pagina.rotulo}
              </Link>
            ))}
            <p className="rodape__aviso">{SITE.avisoLegal}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
