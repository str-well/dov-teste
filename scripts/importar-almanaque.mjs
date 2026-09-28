#!/usr/bin/env node
/**
 * Importa os lotes de verbetes de almanaque/*.json para o WordPress.
 *
 *   node --env-file=.env.local scripts/importar-almanaque.mjs            → simulação
 *   node --env-file=.env.local scripts/importar-almanaque.mjs --aplicar  → grava
 *
 * Idempotente: casa por slug. Rodar de novo atualiza em vez de duplicar.
 * Nunca exclui nada. Só escreve os campos que o JSON traz — etimologia,
 * pronúncia, "Na prática" e relacionados de verbetes existentes ficam intactos.
 *
 * Variáveis (.env.local — já está no .gitignore do Next):
 *   WORDPRESS_API_URL        https://wp.descubraovinho.com.br/wp-json/wp/v2
 *   WP_IMPORT_USER           usuário do WordPress
 *   WP_IMPORT_APP_PASSWORD   senha de aplicativo (não é a senha de login)
 *   FRONT_URL                https://descubraovinho.com.br          (opcional)
 *   REVALIDATE_SECRET        o mesmo do painel da Hostinger         (opcional)
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const APLICAR = process.argv.includes('--aplicar');
const API = (process.env.WORDPRESS_API_URL || '').replace(/\/+$/, '');
const USER = process.env.WP_IMPORT_USER;
const PASS = process.env.WP_IMPORT_APP_PASSWORD;
const FRONT = (process.env.FRONT_URL || '').replace(/\/+$/, '');
const SECRET = process.env.REVALIDATE_SECRET;
const PASTA = path.resolve(process.env.ALMANAQUE_DIR || 'almanaque');
const PAUSA_MS = Number(process.env.IMPORT_PAUSA_MS ?? 150); // gentileza com o plano compartilhado

const TIPOS = {
  'uvas': 'Uvas',
  'vinhos-e-estilos': 'Vinhos e estilos',
  'paises-e-regioes': 'Países e regiões',
  'producao': 'Produção',
  'harmonizacao': 'Harmonização',
  'denominacoes': 'Denominações e classificações',
};

// ---------------------------------------------------------------------------
// utilidades
// ---------------------------------------------------------------------------

const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

const escapa = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Markdown leve do cliente (*itálico*) → HTML, para o corpo. */
const paraHtml = (s) => escapa(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');

/** Markdown leve → texto puro, para campos meta. */
const paraTexto = (s) => String(s ?? '').replace(/\*([^*]+)\*/g, '$1');

function slugify(titulo) {
  return titulo
    .replace(/\([^)]*\)/g, ' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function primeiraFrase(txt) {
  return txt.trim().split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ"])/)[0];
}

function montaCorpo(v) {
  let html = `<p>${paraHtml(v.definicao)}</p>`;
  if (v.regioes?.length) {
    html += '\n<h2>Regiões produtoras</h2>\n<ul>\n' +
      v.regioes.map((r) => `<li>${paraHtml(r)}</li>`).join('\n') + '\n</ul>';
  }
  return html;
}

// ---------------------------------------------------------------------------
// REST
// ---------------------------------------------------------------------------

const AUTH = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');

async function wp(rota, { method = 'GET', body, lote = false } = {}) {
  const url = new URL(API + rota);
  if (lote) url.searchParams.set('dov_lote', '1'); // suspende a revalidação por gravação
  const res = await fetch(url, {
    method,
    headers: { Authorization: AUTH, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const texto = await res.text();
  let dados;
  try { dados = texto ? JSON.parse(texto) : null; } catch { dados = texto; }
  if (!res.ok) {
    const msg = dados?.message || dados?.code || texto.slice(0, 200);
    const erro = new Error(`${method} ${rota} → ${res.status}: ${msg}`);
    erro.status = res.status;
    throw erro;
  }
  return { dados, totalPaginas: Number(res.headers.get('x-wp-totalpages') || 1) };
}

/** Busca todas as páginas — o Almanaque já passa de 100 itens. */
async function todos(rota) {
  const sep = rota.includes('?') ? '&' : '?';
  const saida = [];
  for (let pagina = 1; ; pagina++) {
    const { dados, totalPaginas } = await wp(`${rota}${sep}per_page=100&page=${pagina}`);
    saida.push(...dados);
    if (pagina >= totalPaginas) break;
  }
  return saida;
}

// ---------------------------------------------------------------------------
// leitura e validação dos lotes
// ---------------------------------------------------------------------------

async function lerLotes() {
  const arquivos = (await readdir(PASTA)).filter((f) => f.endsWith('.json')).sort();
  if (!arquivos.length) throw new Error(`nenhum .json em ${PASTA}`);

  const verbetes = [];
  for (const arquivo of arquivos) {
    const lote = JSON.parse(await readFile(path.join(PASTA, arquivo), 'utf8'));
    for (const v of lote.verbetes) verbetes.push({ ...v, _lote: lote.lote });
  }

  const erros = [];
  const vistos = new Map();
  for (const v of verbetes) {
    v.slug ||= slugify(v.titulo);
    v.definicao_curta ||= primeiraFrase(v.definicao || '');
    if (v.importar === false) continue;
    for (const c of ['titulo', 'tipo', 'definicao', 'curiosidade']) {
      if (!v[c]) erros.push(`${v._lote} · ${v.titulo || '?'}: falta "${c}"`);
    }
    if (v.tipo && !TIPOS[v.tipo]) erros.push(`${v._lote} · ${v.titulo}: tipo desconhecido "${v.tipo}"`);
    if (vistos.has(v.slug)) erros.push(`slug repetido "${v.slug}": ${vistos.get(v.slug)} e ${v.titulo}`);
    vistos.set(v.slug, v.titulo);
  }
  if (erros.length) {
    throw new Error('lotes inválidos — nada foi enviado:\n  - ' + erros.join('\n  - '));
  }
  return { arquivos, verbetes };
}

// ---------------------------------------------------------------------------
// principal
// ---------------------------------------------------------------------------

async function main() {
  const faltando = ['WORDPRESS_API_URL', 'WP_IMPORT_USER', 'WP_IMPORT_APP_PASSWORD']
    .filter((k) => !process.env[k]);
  if (faltando.length) throw new Error(`faltam variáveis: ${faltando.join(', ')}`);

  console.log(APLICAR ? '▶ MODO APLICAR — gravando no WordPress\n' : '▷ SIMULAÇÃO — nada será gravado (use --aplicar)\n');

  const { arquivos, verbetes } = await lerLotes();
  const ativos = verbetes.filter((v) => v.importar !== false);
  const retidos = verbetes.filter((v) => v.importar === false);
  console.log(`${arquivos.length} lotes · ${ativos.length} a importar · ${retidos.length} retidos\n`);

  // 1. confirma que o mu-plugin v2.2 está no ar antes de tocar em qualquer coisa
  let tiposExistentes;
  try {
    tiposExistentes = await todos('/verbete_tipos?_fields=id,slug,name');
  } catch (e) {
    if (e.status === 404) {
      throw new Error('/verbete_tipos não existe — suba o dov-headless.php v2.2.0 antes de importar.');
    }
    if (e.status === 401 || e.status === 403) {
      throw new Error(`autenticação recusada (${e.status}). Confira usuário e senha de aplicativo. ` +
        'Se estiverem certos, o servidor pode estar descartando o cabeçalho Authorization — ver LEIA-ME.');
    }
    throw e;
  }

  // 2. tipos
  const idTipo = Object.fromEntries(tiposExistentes.map((t) => [t.slug, t.id]));
  for (const [slug, nome] of Object.entries(TIPOS)) {
    if (idTipo[slug]) continue;
    if (!APLICAR) { console.log(`  criaria tipo  ${nome}`); continue; }
    const { dados } = await wp('/verbete_tipos', { method: 'POST', body: { name: nome, slug }, lote: true });
    idTipo[slug] = dados.id;
    console.log(`  tipo criado   ${nome}`);
  }

  // 3. verbetes que já existem, indexados por slug
  const existentes = await todos('/verbetes?status=any&context=edit&_fields=id,slug,title,status');
  const porSlug = new Map(existentes.map((e) => [e.slug, e]));
  console.log(`\n${existentes.length} verbetes já no WordPress\n`);

  // 4. grava
  const r = { criados: [], atualizados: [], erros: [] };
  for (const v of ativos) {
    const existente = porSlug.get(v.slug);
    const payload = {
      title: v.titulo,
      slug: v.slug,
      status: 'publish',
      content: montaCorpo(v),
      meta: {
        dov_definicao_curta: paraTexto(v.definicao_curta),
        dov_curiosidade: paraTexto(v.curiosidade),
        dov_ordenacao: v.ordenacao || '',
      },
      verbete_tipos: idTipo[v.tipo] ? [idTipo[v.tipo]] : [],
    };

    const acao = existente ? 'atualizar' : 'criar    ';
    const antes = existente && existente.title?.raw !== v.titulo ? `   (era "${existente.title?.raw}")` : '';
    console.log(`  ${acao}  ${v.slug.padEnd(40)} ${v.titulo}${antes}`);
    if (!APLICAR) { (existente ? r.atualizados : r.criados).push(v.slug); continue; }

    try {
      if (existente) {
        await wp(`/verbetes/${existente.id}`, { method: 'POST', body: payload, lote: true });
        r.atualizados.push(v.slug);
      } else {
        await wp('/verbetes', { method: 'POST', body: payload, lote: true });
        r.criados.push(v.slug);
      }
    } catch (e) {
      console.error(`    ✗ ${e.message}`);
      r.erros.push({ slug: v.slug, erro: e.message });
    }
    await dorme(PAUSA_MS);
  }

  if (retidos.length) {
    console.log('\nretidos (importar: false):');
    for (const v of retidos) console.log(`  · ${v.titulo} — ${v.nota || 'sem nota'}`);
  }

  // 5. revalida o front uma vez, no final
  if (APLICAR && (r.criados.length || r.atualizados.length)) {
    if (FRONT && SECRET) {
      const caminhos = ['/', '/almanaque', ...[...r.criados, ...r.atualizados].map((s) => `/almanaque/${s}`)];
      let falhas = 0;
      for (const p of caminhos) {
        const url = `${FRONT}/api/revalidate?secret=${encodeURIComponent(SECRET)}&path=${encodeURIComponent(p)}`;
        const res = await fetch(url, { method: 'POST' }).catch(() => null);
        if (!res?.ok) falhas++;
      }
      console.log(`\nrevalidação: ${caminhos.length - falhas}/${caminhos.length} caminhos` +
        (falhas ? ' — falhas: confira se o REVALIDATE_SECRET local é o mesmo da produção' : ''));
    } else {
      console.log('\nFRONT_URL ou REVALIDATE_SECRET ausentes: o front atualiza sozinho pelo fallback de 5 minutos.');
    }
  }

  console.log(`\n${APLICAR ? '' : '[simulação] '}criados ${r.criados.length} · atualizados ${r.atualizados.length} · erros ${r.erros.length}`);
  if (r.erros.length) process.exitCode = 1;
}

main().catch((e) => { console.error('\n✗ ' + e.message); process.exit(1); });
