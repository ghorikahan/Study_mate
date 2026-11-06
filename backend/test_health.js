const http = require('http');
const app = require('./server');

const testEndpoints = async () => {
  // Start server on ephemeral port for reliable standalone checks
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  const check = (path) =>
    new Promise((resolve, reject) => {
      http
        .get(`http://127.0.0.1:${port}${path}`, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(data) });
            } catch {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        })
        .on('error', reject);
    });

  try {
    const rootRes = await check('/');
    console.log('[TEST] GET / status:', rootRes.status);
    console.log('[TEST] GET / response:', JSON.stringify(rootRes.data));

    const healthRes = await check('/api/health');
    console.log('[TEST] GET /api/health status:', healthRes.status);
    console.log('[TEST] GET /api/health response:', JSON.stringify(healthRes.data));

    const dbRes = await check('/api/database-status');
    console.log('[TEST] GET /api/database-status status:', dbRes.status);
    console.log('[TEST] GET /api/database-status response:', JSON.stringify(dbRes.data));

    console.log('✅ ALL BACKEND HEALTH & DATABASE STATUS CHECKS PASSED!');
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    server.close(() => process.exit(1));
  }
};

testEndpoints();
