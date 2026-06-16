const allowedOrigins = new Set([
  'https://swu-singles-nz.pages.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

const baseCorsHeaders = {
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  vary: 'Origin'
};

export function createJsonResponse(body: unknown, status = 200, request?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...createCorsHeaders(request),
      'content-type': 'application/json; charset=utf-8'
    }
  });
}

export function createOptionsResponse(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(request)
  });
}

function createCorsHeaders(request?: Request): HeadersInit {
  const origin = request?.headers.get('origin');

  if (!origin || !allowedOrigins.has(origin)) {
    return baseCorsHeaders;
  }

  return {
    ...baseCorsHeaders,
    'access-control-allow-origin': origin
  };
}
