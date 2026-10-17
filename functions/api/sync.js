export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const roomId = url.searchParams.get('roomId');

  if (!userId && !roomId) {
    return new Response(JSON.stringify({ error: 'Missing userId or roomId' }), {
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

  const kvKey = roomId ? `room_state_${roomId}` : `user_state_${userId}`;
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
    const { userId, roomId, payload } = body;

    if ((!userId && !roomId) || !payload) {
      return new Response(JSON.stringify({ error: 'Missing identifier or payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (userId) {
      await env.MUN_KV.put(`user_state_${userId}`, JSON.stringify(payload));
    }
    if (roomId) {
      await env.MUN_KV.put(`room_state_${roomId}`, JSON.stringify(payload), {
        expirationTtl: 172800
      });
    }

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
