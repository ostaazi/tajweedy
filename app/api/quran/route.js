// app/api/quran/route.js
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // يضمن بيئة Node على Vercel

const ALLOWED_HOSTS = new Set(['api.quran.com']);

function badRequest(msg) {
  return new NextResponse(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const u = searchParams.get('u'); // مثال: /api/v4/recitations?language=ar
    if (!u || !u.startsWith('/')) return badRequest('missing or invalid "u"');

    const target = new URL(`https://api.quran.com${u}`);
    if (!ALLOWED_HOSTS.has(target.host)) return badRequest('host not allowed');

    const r = await fetch(target.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'user-agent': 'recitation-sync/1.0 (vercel-proxy)',
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: {
        'content-type': r.headers.get('content-type') || 'application/json; charset=utf-8',
        'access-control-allow-origin': '*',
      },
    });
  } catch (e) {
    return new NextResponse(JSON.stringify({ error: 'proxy_failed', detail: String(e) }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}
