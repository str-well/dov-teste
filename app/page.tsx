// Home provisória. A home de verdade é o item 5 da Fase 3 do plano —
// entra depois dos templates de matéria, categoria e verbete.
//
// Tailwind aqui só faz grade e espaçamento. A tipografia vem do reset dos
// tokens — nada de tamanho chumbado numa página que vai ser substituída.
export default function Page() {
  return (
    <main className="mx-auto max-w-texto px-5 py-14 tablet:px-12">
      <h1>Descubra o Vinho</h1>

      <p className="mt-5 text-texto-suave">
        Front em construção. O portal é o item da Fase 2 em diante — ver{' '}
        <code className="rounded-pequeno bg-fundo-alternativo px-1">
          docs/PLANO-IMPLEMENTACAO.md
        </code>
        .
      </p>

      <section className="mt-12 border-t border-divisor pt-6">
        <h2 className="text-texto-meta">Enquanto isso</h2>

        <ul className="mt-4 flex flex-col gap-3 text-texto-suave">
          <li>
            <a href="/diagnostico">/diagnostico</a> — painel de infraestrutura: ISR,
            conexão com o WordPress, consumo do processo
          </li>
          <li>
            <a href="/api/health">/api/health</a> — versão do Node, uptime e{' '}
            <code className="rounded-pequeno bg-fundo-alternativo px-1">pid</code> do
            processo
          </li>
        </ul>
      </section>
    </main>
  );
}
