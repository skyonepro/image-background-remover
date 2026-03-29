/**
 * POST /api/auth
 * 接收前端传来的 Google ID Token，验证后存储用户到 D1
 */
export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { credential } = await request.json()
    if (!credential) {
      return Response.json({ error: 'Missing credential' }, { status: 400 })
    }

    // 验证 Google ID Token
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    )
    if (!verifyRes.ok) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const payload = await verifyRes.json()

    // 检查 audience
    if (payload.aud !== env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      return Response.json({ error: 'Token audience mismatch' }, { status: 401 })
    }

    const { sub, email, name, picture } = payload

    // 存储或更新用户到 D1
    await env.DB.prepare(`
      INSERT INTO users (id, email, name, picture, created_at, last_login, login_count)
      VALUES (?, ?, ?, ?, unixepoch(), unixepoch(), 1)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        picture = excluded.picture,
        last_login = unixepoch(),
        login_count = login_count + 1
    `).bind(sub, email, name, picture).run()

    // 返回用户信息
    return Response.json({
      success: true,
      user: { id: sub, email, name, picture }
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
