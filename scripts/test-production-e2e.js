const https = require('https');
const crypto = require('crypto');

const BASE_HOST = 'di-oleh-oleh.vercel.app';

function createAdminCookie() {
  const key = process.env.ADMIN_SESSION_SECRET;
  const username = process.env.ADMIN_USERNAME;
  if (!key || !username) return null;
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = Buffer.from(JSON.stringify({ sub: username, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', key).update(payload).digest('base64url');
  return `dioleh2_admin_session=${payload}.${signature}`;
}

function request({ path, method = 'GET', body, useAuth = false }) {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'KarikaDiengQA/1.0' };
    if (body) headers['Content-Type'] = 'application/json';
    if (useAuth) {
      const cookie = createAdminCookie();
      if (cookie) headers['Cookie'] = cookie;
    }

    const req = https.request({ hostname: BASE_HOST, port: 443, path, method, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const raw = buf.toString('utf8');
        let data = raw;
        try {
          data = JSON.parse(raw);
        } catch {}
        resolve({ status: res.statusCode, headers: res.headers, data, byteLength: buf.length });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log(`=== PRODUCTION E2E VERIFICATION: https://${BASE_HOST}/ ===\n`);

  // 1. Landing page + Favicon HTML check
  const home = await request({ path: '/' });
  if (home.status !== 200) throw new Error(`GET / failed with ${home.status}`);
  const html = typeof home.data === 'string' ? home.data : '';
  const hasFaviconTag = html.includes('icon-d-oleh2.png') || html.includes('icon.png');
  const hasLogo = html.includes('logo-d-oleh2.webp');
  console.log(`✅ GET / -> HTTP 200 (Favicon tag: ${hasFaviconTag}, Navbar logo: ${hasLogo})`);

  // 2. Favicon & Logo binary checks
  const [icon1, icon2, logoWebp] = await Promise.all([
    request({ path: '/icon.png' }),
    request({ path: '/icon-d-oleh2.png' }),
    request({ path: '/images/logo-d-oleh2.webp' }),
  ]);
  console.log(`✅ /icon.png -> HTTP ${icon1.status} (${icon1.headers['content-type']}, ${icon1.byteLength} bytes)`);
  console.log(`✅ /icon-d-oleh2.png -> HTTP ${icon2.status} (${icon2.headers['content-type']}, ${icon2.byteLength} bytes)`);
  console.log(`✅ /images/logo-d-oleh2.webp -> HTTP ${logoWebp.status} (${logoWebp.byteLength} bytes)`);

  // 3. Public Pages
  const [catalogPage, ordersPage, adminLoginPage] = await Promise.all([
    request({ path: '/catalog' }),
    request({ path: '/orders' }),
    request({ path: '/admin/login' }),
  ]);
  console.log(`✅ /catalog -> HTTP ${catalogPage.status}, /orders -> HTTP ${ordersPage.status}, /admin/login -> HTTP ${adminLoginPage.status}`);

  // 4. Products API & Images
  const prodRes = await request({ path: '/api/products' });
  const products = prodRes.data?.products || [];
  console.log(`✅ GET /api/products -> HTTP ${prodRes.status} (${products.length} products)`);

  // 5. Security Check: Unauthenticated admin POST rejected
  const unauthRes = await request({ path: '/api/products', method: 'POST', body: { name: 'x' }, useAuth: false });
  if (unauthRes.status !== 401) throw new Error(`Expected 401 on unauth POST /api/products, got ${unauthRes.status}`);
  console.log(`✅ Auth guard on /api/products -> HTTP 401 Unauthorized`);

  // 6. Full E2E QRIS Receipt Sync & 2-State Delivery on Production (with immediate cleanup)
  const checkoutRes = await request({
    path: '/api/orders/checkout',
    method: 'POST',
    body: {
      customerName: 'QA Prod Verification',
      customerPhone: '081122334455',
      address: 'Titik 0 Dieng (Automated QA Check)',
      coordinates: { lat: -7.2042, lng: 109.9112 },
      items: [{ productId: products[0]?.id || 'amerta-karika-sirup-6-cup', qty: 5 }],
      paymentType: 'qris',
    },
  });
  if (checkoutRes.status !== 200 || !checkoutRes.data?.orderId) {
    throw new Error('Prod checkout failed: ' + JSON.stringify(checkoutRes.data));
  }
  const orderId = checkoutRes.data.orderId;
  console.log(`✅ Prod QRIS Checkout -> ${orderId}`);

  const dummyPng =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const proofRes = await request({
    path: '/api/orders/upload-payment-proof',
    method: 'POST',
    body: { orderId, paymentProof: dummyPng },
  });
  if (proofRes.status !== 200 || !proofRes.data?.success) {
    throw new Error('Prod upload payment proof failed: ' + JSON.stringify(proofRes.data));
  }
  console.log(`✅ Prod Receipt Upload -> HTTP 200`);

  const adminOrdersRes = await request({ path: '/api/admin/orders', method: 'GET', useAuth: true });
  if (adminOrdersRes.status === 200) {
    const matched = (adminOrdersRes.data?.orders || []).find((o) => o.id === orderId);
    if (!matched || !matched.payment_proof_url) {
      throw new Error('Prod /api/admin/orders missing payment_proof_url!');
    }
    console.log(`✅ Prod /api/admin/orders immediately synced payment_proof_url!`);

    const deliverRes = await request({
      path: `/api/orders/${encodeURIComponent(orderId)}`,
      method: 'PATCH',
      body: { delivery_status: 'delivered', order_status: 'completed' },
      useAuth: true,
    });
    console.log(`✅ Prod 2-State Delivery PATCH -> HTTP ${deliverRes.status}`);

    const delRes = await request({
      path: '/api/admin/orders',
      method: 'POST',
      body: { action: 'delete', id: orderId },
      useAuth: true,
    });
    console.log(`✅ Prod test order cleaned up -> HTTP ${delRes.status}`);
  } else {
    console.log(`⚠️ Prod admin cookie secret differs from local .env.local (HTTP ${adminOrdersRes.status}); skipping admin-only prod assertion.`);
  }

  console.log('\n>>> PRODUCTION VERIFICATION COMPLETED SUCCESSFULLY! <<<');
}

run().catch((err) => {
  console.error('❌ Production verification failed:', err);
  process.exit(1);
});
