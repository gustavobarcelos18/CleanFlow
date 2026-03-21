const ORIGENS_DEV = ['http://localhost:8081', 'http://localhost:8080'];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allowedOriginsEnv = Deno.env.get('ALLOWED_ORIGINS') ?? '';
  const allowedOrigins = allowedOriginsEnv.split(',').map(o => o.trim()).filter(Boolean);

  const isAllowed = ORIGENS_DEV.includes(origin) || allowedOrigins.includes(origin);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };

  if (isAllowed) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (!Deno.env.get('FUNCTIONS_REGION')) {
    headers['Access-Control-Allow-Origin'] = ORIGENS_DEV[0];
  }

  return headers;
}
