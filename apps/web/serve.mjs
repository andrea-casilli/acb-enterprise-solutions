import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./dist/', import.meta.url));
const types = { '.js':'text/javascript', '.css':'text/css', '.html':'text/html', '.svg':'image/svg+xml', '.png':'image/png' };
createServer((req,res) => {
  const requested = req.url === '/' ? 'index.html' : decodeURIComponent(req.url || '').replace(/^\//,'');
  const file = join(root, requested);
  const target = existsSync(file) && !file.endsWith('/') ? file : join(root,'index.html');
  res.writeHead(200, {'Content-Type':types[extname(target)] || 'application/octet-stream'});
  createReadStream(target).on('error', () => { res.writeHead(404); res.end('Not found'); }).pipe(res);
}).listen(5173, () => console.log('Nexus Web pronta su http://localhost:5173'));
