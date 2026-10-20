// Mini-„Kong“: leitet /auth/v1, /rest/v1, /storage/v1 an die Container weiter und setzt CORS.
const http = require('http');
const routes = { '/auth/v1': 59999, '/rest/v1': 53000, '/storage/v1': 55000 };
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Supabase-Api-Version');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const prefix = Object.keys(routes).find((p) => req.url.startsWith(p));
  if (!prefix) { res.writeHead(404); return res.end('not found'); }
  const headers = { ...req.headers, host: 'localhost' };
  const up = http.request({ host: '127.0.0.1', port: routes[prefix], path: req.url.slice(prefix.length) || '/', method: req.method, headers }, (r) => {
    const h = { ...r.headers };
    delete h['access-control-allow-origin'];
    res.writeHead(r.statusCode, h);
    r.pipe(res);
  });
  up.on('error', (e) => { res.writeHead(502); res.end(String(e)); });
  req.pipe(up);
}).listen(54321, () => console.log('gateway on 54321'));
