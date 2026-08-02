import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Ensaio da rota que o WordPress vai chamar em produção.
// Teste: curl -X POST "https://SEU-SUBDOMINIO/api/revalidate?secret=SEU_SEGREDO&path=/"
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const path = req.nextUrl.searchParams.get('path') ?? '/';

  if (!process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { ok: false, erro: 'REVALIDATE_SECRET não está definida no servidor.' },
      { status: 500 }
    );
  }

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, erro: 'Segredo inválido.' }, { status: 401 });
  }

  revalidatePath(path);

  return NextResponse.json({
    ok: true,
    revalidado: path,
    em: new Date().toISOString(),
  });
}
