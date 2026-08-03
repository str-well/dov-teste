// Home provisória. A home de verdade é o item 5 da Fase 3 do plano —
// entra depois dos templates de matéria, categoria e verbete.
export default function Page() {
  return (
    <main>
      <h1>Descubra o Vinho</h1>
      <p className="sub">
        Front em construção. O portal é o item da Fase 2 em diante — ver
        <code> docs/PLANO-IMPLEMENTACAO.md</code>.
      </p>

      <section>
        <h2>Enquanto isso</h2>
        <ul>
          <li>
            <a href="/diagnostico">/diagnostico</a> — painel de infraestrutura: ISR,
            conexão com o WordPress, consumo do processo
          </li>
          <li>
            <a href="/api/health">/api/health</a> — versão do Node, uptime e{' '}
            <code>pid</code> do processo
          </li>
        </ul>
      </section>
    </main>
  );
}
