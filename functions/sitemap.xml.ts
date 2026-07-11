type PagesEnv = {
  API_BASE_URL?: string;
  VITE_API_BASE_URL?: string;
};

export const onRequestGet: PagesFunction<PagesEnv> = async ({ env }) => {
  const apiBaseUrl = (env.API_BASE_URL || env.VITE_API_BASE_URL || 'https://api.swu.nz').replace(/\/$/, '');
  const response = await fetch(`${apiBaseUrl}/sitemap.xml`, {
    headers: { accept: 'application/xml' }
  });

  if (!response.ok) {
    return new Response('Unable to generate sitemap', { status: 502 });
  }

  return new Response(response.body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  });
};
