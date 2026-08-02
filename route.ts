import { NextResponse } from 'next/server';

// Nunca em cache: precisa refletir o estado real do processo agora.
export const dynamic = 'force-dynamic';

export async function GET() {
  const mem = process.memoryUsage();
  const mb = (b: number) => Math.round(b / 1024 / 1024);

  return NextResponse.json({
    status: 'ok',
    agora: new Date().toISOString(),

    // Versão do Node no servidor da Hostinger.
    node: process.version,

    // Segundos desde que o processo subiu. Se zerar entre visitas,
    // a aplicação caiu e foi reiniciada (ou não foi).
    uptime_segundos: Math.round(process.uptime()),
    uptime_legivel: `${Math.floor(process.uptime() / 3600)}h ${Math.floor(
      (process.uptime() % 3600) / 60
    )}min`,

    // Identificador do processo. Muda quando há reinício.
    pid: process.pid,

    memoria_mb: {
      heap_usado: mb(mem.heapUsed),
      heap_total: mb(mem.heapTotal),
      rss: mb(mem.rss),
    },

    plataforma: `${process.platform} ${process.arch}`,
    build_time: process.env.BUILD_TIME ?? null,
    wordpress_configurado: Boolean(process.env.WORDPRESS_API_URL),
  });
}
