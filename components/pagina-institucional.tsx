type Props = {
  /** Rótulo em caixa-alta acima do título. */
  kicker: string;
  titulo: string;
  /** Uma ou duas frases. Aparece na cabeça, sobre off-white. */
  lead?: string;
  children: React.ReactNode;
};

/**
 * Casca das páginas institucionais — Quem Somos, Contato, páginas legais.
 *
 * Cabeça sobre off-white com um blob no canto, e corpo em medida de leitura.
 * Portado de `11-quem-somos-desktop`; o blob é decorativo e fica dentro de um
 * contêiner com `overflow: hidden`, conforme a especificação.
 *
 * O H1 é daqui: uma página, um H1.
 */
export function PaginaInstitucional({ kicker, titulo, lead, children }: Props) {
  return (
    <main>
      <div className="cabeca-institucional">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="blob blob--lilas cabeca-institucional__blob"
          src="/blobs/dov-blob-lilas.svg"
          alt=""
          aria-hidden="true"
        />

        <div className="limite">
          <div className="cabeca-institucional__conteudo">
            <p className="kicker">{kicker}</p>
            <h1 className="cabeca-institucional__titulo">{titulo}</h1>
            {lead && <p className="cabeca-institucional__lead">{lead}</p>}
          </div>
        </div>
      </div>

      <div className="limite">
        <div className="prosa">
          {children}
        </div>
      </div>
    </main>
  );
}
