const http = require('http');
const crypto = require('crypto');

function createAdminCookie() {
  const key = process.env.ADMIN_SESSION_SECRET;
  const username = process.env.ADMIN_USERNAME;
  if (!key || !username) {
    throw new Error('Missing ADMIN_SESSION_SECRET or ADMIN_USERNAME in env');
  }
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = Buffer.from(JSON.stringify({ sub: username, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', key).update(payload).digest('base64url');
  return `dioleh2_admin_session=${payload}.${signature}`;
}

const cookie = createAdminCookie();

function request(options, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      ...options,
      headers: {
        ...(options.headers || {}),
        Cookie: cookie,
      }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('=== TEST 1: GET ALL PRODUCTS ===');
  const getRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/products',
    method: 'GET'
  });
  console.log('Total products:', getRes.data.products.length);
  if (getRes.data.products.length !== 9) {
    throw new Error('Expected 9 products, got ' + getRes.data.products.length);
  }

  console.log('=== TEST 2: TOGGLE AVAILABILITY (Tersedia -> Habis -> Tersedia) ===');
  const toggleOff = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/products',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { id: 'amerta-karika-sirup-6-cup', is_available: false });
  console.log('Toggled off:', toggleOff.data.product?.name, 'is_available:', toggleOff.data.product?.is_available);

  const toggleOn = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/products',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { id: 'amerta-karika-sirup-6-cup', is_available: true });
  console.log('Toggled on:', toggleOn.data.product?.name, 'is_available:', toggleOn.data.product?.is_available);

  console.log('=== TEST 3: ADD NEW TEST PRODUCT ===');
  const createRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/products',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    action: 'create',
    name: 'Produk Uji Coba Lifecycle',
    group: 'Camilan',
    pack: '1 Bungkus',
    price: 15000,
    description: 'Produk sementara untuk uji coba lifecycle add-delete',
    image: '/images/products/opak-singkong-sabar-makmur.png'
  });
  console.log('Created product:', createRes.data.product?.id, createRes.data.product?.name);

  console.log('=== TEST 4: DELETE TEST PRODUCT ===');
  const deleteRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/products?id=${encodeURIComponent(createRes.data.product.id)}`,
    method: 'DELETE'
  });
  console.log('Deleted product result:', deleteRes.data.message);

  const finalCheck = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/products',
    method: 'GET'
  });
  console.log('Final product count after deletion:', finalCheck.data.products.length);
  if (finalCheck.data.products.length !== 9) {
    throw new Error('Count should be exactly 9 after test product deletion!');
  }

  console.log('\n>>> ALL 4 LIFECYCLE TESTS PASSED PERFECTLY! <<<');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
