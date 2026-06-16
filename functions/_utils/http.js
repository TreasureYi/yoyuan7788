export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

export function badRequest(message, status = 400) {
  return json(
    {
      error: message
    },
    {
      status
    }
  );
}
