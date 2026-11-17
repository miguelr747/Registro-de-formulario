import express from 'express';
import { createApp } from './app.ts';

let cachedApp: express.Express | null = null;

function getVercelApp(): express.Express {
  if (cachedApp) return cachedApp;

  const apiApp = createApp();
  const vercelApp = express();

  vercelApp.use((req, _res, next) => {
    const rawPath = req.query.__vercel_path;
    if (typeof rawPath === 'string' && rawPath.length > 0) {
      const cleanPath = decodeURIComponent(rawPath).replace(/^\/+/, '');
      const urlObj = new URL(req.url || '/', 'http://localhost');
      urlObj.searchParams.delete('__vercel_path');
      const restSearch = urlObj.searchParams.toString();
      req.url = `/api/${cleanPath}${restSearch ? `?${restSearch}` : ''}`;
    } else if (req.url) {
      const urlObj = new URL(req.url, 'http://localhost');
      if (urlObj.pathname === '/' || urlObj.pathname === '/api' || urlObj.pathname === '/api/index') {
        urlObj.pathname = '/api/health';
      } else if (!urlObj.pathname.startsWith('/api/')) {
        urlObj.pathname = `/api${urlObj.pathname.startsWith('/') ? '' : '/'}${urlObj.pathname}`;
      }
      urlObj.searchParams.delete('...path');
      urlObj.searchParams.delete('path');
      const restSearch = urlObj.searchParams.toString();
      req.url = `${urlObj.pathname}${restSearch ? `?${restSearch}` : ''}`;
    }
    next();
  });

  vercelApp.use(apiApp);
  cachedApp = vercelApp;
  return cachedApp;
}

export default function handler(req: express.Request, res: express.Response) {
  try {
    const app = getVercelApp();
    return app(req, res);
  } catch (err) {
    console.error('Error iniciando función serverless:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Error interno del servidor al iniciar la API.',
    });
  }
}
