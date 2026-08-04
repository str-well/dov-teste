import Link from 'next/link';

type Atalho = { rotulo: string; href: string };

type Props = {
  titulo: React.ReactNode;
  /** Uma frase de orientação. O que fazer, não o que faltou. */
  orientacao: React.ReactNode;
  /** Chips de saída. Nunca deixar o leitor sem para onde ir. */
  atalhos?: Atalho[];
  rotuloDosAtalhos?: string;
  acao?: { rotulo: string; href: string; variacao?: 'primario' | 'contorno' };
  /**
   * Esconde o título visualmente, mantendo-o para leitor de tela. Serve quando
   * o `<h1>` da página já diz a mesma coisa — o caso da busca sem resultado, em
   * que a prancha repete o texto no `<h1>` e deixa o `<h2>` oculto.
   */
  tituloOculto?: boolean;
};

/**
 * Estado vazio, no formato que a §7 da especificação define para todos eles:
 * título em Cormorant, uma frase de orientação, atalhos em chips e um botão.
 * **Nunca uma tela só com "nada encontrado".**
 *
 * O texto vai em `role="status"` para ser anunciado quando substituir uma lista
 * que tinha resultados — trocar de filtro sem recarregar a página é exatamente
 * esse caso.
 */
export function EstadoVazio({
  titulo,
  orientacao,
  atalhos = [],
  rotuloDosAtalhos = 'Comece por aqui',
  acao,
  tituloOculto = false,
}: Props) {
  return (
    <div className="vazio">
      <h2 className={tituloOculto ? 'visualmente-oculto' : 'vazio__titulo'}>{titulo}</h2>

      <p className="vazio__texto" role="status">
        {orientacao}
      </p>

      {atalhos.length > 0 && (
        <>
          <p className="kicker kicker--neutro vazio__rotulo">{rotuloDosAtalhos}</p>
          <div className="chips vazio__chips">
            {atalhos.map((atalho) => (
              <Link key={atalho.href} className="chip" href={atalho.href}>
                {atalho.rotulo}
              </Link>
            ))}
          </div>
        </>
      )}

      {acao && (
        <Link
          className={`botao botao--${acao.variacao ?? 'primario'}`}
          href={acao.href}
        >
          {acao.rotulo}
        </Link>
      )}
    </div>
  );
}
