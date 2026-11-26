const http = require('http');
const crypto = require('crypto');

const HOST = '127.0.0.1';
const PORT = 3000;

function createAdminCookie() {
  const key = process.env.ADMIN_SESSION_SECRET;
  const username = process.env.ADMIN_USERNAME;
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = Buffer.from(JSON.stringify({ sub: username, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', key).update(payload).digest('base64url');
  return `dioleh2_admin_session=${payload}.${signature}`;
}

function request({ path, method = 'GET', body, useAuth = false }) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (useAuth) headers['Cookie'] = createAdminCookie();

    const req = http.request({ hostname: HOST, port: PORT, path, method, headers }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data: raw });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('=== E2E TEST: QRIS RECEIPT SYNC, 2-STATE DELIVERY & FAVICON ===');

  // 1. Verify Favicon routes
  const icon1 = await request({ path: '/icon.png' });
  const icon2 = await request({ path: '/icon-d-oleh2.png' });
  if (icon1.status !== 200 || icon2.status !== 200) {
    throw new Error(`Favicon check failed: /icon.png=${icon1.status}, /icon-d-oleh2.png=${icon2.status}`);
  }
  console.log('✅ Favicon /icon.png & /icon-d-oleh2.png -> HTTP 200');

  // 2. Create QRIS test order
  const checkoutRes = await request({
    path: '/api/orders/checkout',
    method: 'POST',
    body: {
      customerName: 'QA QRIS Receipt Tester',
      customerPhone: '081122334455',
      address: 'Villa Dieng Plateau (Test QA)',
      coordinates: { lat: -7.206, lng: 109.909 },
      items: [{ productId: 'amerta-karika-sirup-6-cup', qty: 5 }],
      paymentType: 'qris',
    },
  });
  if (checkoutRes.status !== 200 || !checkoutRes.data?.orderId) {
    throw new Error('QRIS checkout failed: ' + JSON.stringify(checkoutRes.data));
  }
  const orderId = checkoutRes.data.orderId;
  console.log('✅ QRIS order created:', orderId);

  // 3. Upload payment proof (1x1 transparent PNG Data URL)
  const dummyPng =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const uploadRes = await request({
    path: '/api/orders/upload-payment-proof',
    method: 'POST',
    body: { orderId, paymentProof: dummyPng },
  });
  if (uploadRes.status !== 200 || !uploadRes.data?.success) {
    throw new Error('Upload payment proof failed: ' + JSON.stringify(uploadRes.data));
  }
  console.log('✅ Payment proof uploaded via /api/orders/upload-payment-proof');

  // 4. Verify /api/admin/orders returns payment_proof_url immediately
  const adminOrdersRes = await request({
    path: '/api/admin/orders',
    method: 'GET',
    useAuth: true,
  });
  const matched = (adminOrdersRes.data?.orders || []).find((o) => o.id === orderId);
  if (!matched || !matched.payment_proof_url) {
    throw new Error('Admin orders did NOT return payment_proof_url! Bug #1 regression!');
  }
  console.log('✅ /api/admin/orders immediately includes payment_proof_url (No barcode scan needed)');

  // 5. Test 2-state delivery transition (picked_up -> delivered -> picked_up)
  const deliverRes = await request({
    path: `/api/orders/${encodeURIComponent(orderId)}`,
    method: 'PATCH',
    body: { delivery_status: 'delivered', order_status: 'completed' },
    useAuth: true,
  });
  if (deliverRes.status !== 200 || deliverRes.data?.order?.delivery_status !== 'delivered') {
    throw new Error('Delivery transition to delivered failed');
  }
  console.log('✅ 2-State delivery transition to Terkirim (delivered) -> PASS');

  // 6. Cleanup test order via DELETE
  const cleanupRes = await request({
    path: '/api/admin/orders',
    method: 'POST',
    body: { action: 'delete', id: orderId },
    useAuth: true,
  });
  if (cleanupRes.status !== 200) {
    throw new Error('Failed to cleanup test order');
  }
  console.log('✅ Test order cleaned up from Neon DB');

  console.log('\n>>> ALL QA REVISION E2E CHECKS PASSED! <<<');
}

run().catch((err) => {
  console.error('❌ E2E Failed:', err);
  process.exit(1);
});
