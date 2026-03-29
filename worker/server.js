const http = require('http');
const https = require('https');
const busboy = require('busboy');

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || '';
const PORT = process.env.PORT || 3101;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Build a multipart/form-data body manually
function buildMultipart(boundary, fieldName, filename, mimeType, fileBuffer) {
  const CRLF = '\r\n';
  const header = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"`,
    `Content-Type: ${mimeType}`,
    '',
    '',
  ].join(CRLF);
  const footer = `${CRLF}--${boundary}--${CRLF}`;
  return Buffer.concat([
    Buffer.from(header),
    fileBuffer,
    Buffer.from(footer),
  ]);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/remove-bg') {
    const bb = busboy({ headers: req.headers });
    let fileBuffer = null;
    let filename = 'image.png';
    let mimeType = 'image/png';

    bb.on('file', (fieldname, stream, info) => {
      filename = info.filename || 'image.png';
      mimeType = info.mimeType || 'image/png';
      const chunks = [];
      stream.on('data', (d) => chunks.push(d));
      stream.on('end', () => { fileBuffer = Buffer.concat(chunks); });
    });

    bb.on('finish', () => {
      if (!fileBuffer) {
        res.writeHead(400, corsHeaders());
        res.end('No image provided');
        return;
      }

      const boundary = '----RemoveBgBoundary' + Date.now();
      const body = buildMultipart(boundary, 'image_file', filename, mimeType, fileBuffer);

      const options = {
        hostname: 'api.remove.bg',
        path: '/v1.0/removebg',
        method: 'POST',
        headers: {
          'X-Api-Key': REMOVE_BG_API_KEY,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
      };

      const proxyReq = https.request(options, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', (d) => chunks.push(d));
        proxyRes.on('end', () => {
          const respBody = Buffer.concat(chunks);
          if (proxyRes.statusCode !== 200) {
            console.error('remove.bg error:', respBody.toString());
            res.writeHead(proxyRes.statusCode, corsHeaders());
            res.end(respBody);
            return;
          }
          res.writeHead(200, { ...corsHeaders(), 'Content-Type': 'image/png' });
          res.end(respBody);
        });
      });

      proxyReq.on('error', (e) => {
        res.writeHead(500, corsHeaders());
        res.end('Proxy error: ' + e.message);
      });

      proxyReq.write(body);
      proxyReq.end();
    });

    req.pipe(bb);
    return;
  }

  res.writeHead(404, corsHeaders());
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Worker proxy running on http://localhost:${PORT}`);
});
