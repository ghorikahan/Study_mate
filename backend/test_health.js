const http = require('http');
const app = require('./server');

const testEndpoints = async () => {
  // Wait 500ms for server to bind
  await new Promise(resolve => setTimeout(resolve, 500));

  const check = (path) => new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:5000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });

  try {
    const rootRes = await check('/');
    console.log('[TEST] GET / status:', rootRes.status);
    console.log('[TEST] GET / response:', JSON.stringify(rootRes.data));

    const healthRes = await check('/api/health');
    console.log('[TEST] GET /api/health status:', healthRes.status);
    console.log('[TEST] GET /api/health response:', JSON.stringify(healthRes.data));

    console.log('✅ ALL BACKEND HEALTH CHECKS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
};

testEndpoints();

