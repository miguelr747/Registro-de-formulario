import express from 'express';
import { createApp } from './app.ts';

const apiApp = createApp();
const vercelApp = express();

// Normaliza rutas reescritas desde vercel.json (?__vercel_path=...) hacia /api/...
vercelApp.use((req, _res, next) => {
  const rawPath = req.query.__vercel_path;
  if (typeof rawPath === 'string' && rawPath.length > 0) {
    const cleanPath = rawPath.replace(/^\/+/, '');
    const urlObj = new URL(req.url || '/', 'http://localhost');
    urlObj.searchParams.delete('__vercel_path');
    const restSearch = urlObj.searchParams.toString();
    req.url = `/api/${cleanPath}${restSearch ? `?${restSearch}` : ''}`;
  } else if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  next();
});

vercelApp.use(apiApp);

export default vercelApp;
