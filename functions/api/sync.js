export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Missing userId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!env.MUN_KV) {
    return new Response(JSON.stringify({ error: 'MUN_KV not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const kvKey = `user_state_${userId}`;
  const data = await env.MUN_KV.get(kvKey);
  return new Response(data || 'null', {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  if (!env.MUN_KV) {
    return new Response(JSON.stringify({ error: 'MUN_KV not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { userId, payload } = body;

    if (!userId || !payload) {
      return new Response(JSON.stringify({ error: 'Missing userId or payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.MUN_KV.put(`user_state_${userId}`, JSON.stringify(payload));

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
