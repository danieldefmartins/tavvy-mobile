const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), path = require('node:path');
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../../supabase/functions/_shared/appleEntitlements.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: api });

function database(owner = null) {
  const state = { provider: {}, subscriptions: [], writes: 0 };
  return { state, from(table) {
    let operation = 'select', value, fields;
    const query = {
      select(v) { fields = v; return this; },
      eq() { return this; }, is() { return this; }, order() { return this; }, limit() { return this; },
      maybeSingle() { return this; },
      update(v) { operation = 'update'; value = v; return this; },
      insert(v) { operation = 'insert'; value = v; return this; },
      then(resolve, reject) {
        try {
          let data = null, error = null;
          if (operation === 'select') {
            if (fields === 'user_id') data = table === 'pro_providers' && owner ? { user_id: owner } : null;
            else if (table === 'pro_subscriptions') data = state.subscriptions[0] || null;
          } else if (table === 'pro_providers') {
            state.writes++; Object.assign(state.provider, value); data = [{ id: 'provider' }];
          } else if (table === 'pro_subscriptions') {
            // Model the real database constraint that rejected the purchase.
            if (!['early_adopter', 'standard'].includes(value.tier)) error = { code: '23514', message: 'pro_subscriptions_tier_check' };
            else {
              state.writes++;
              if (operation === 'insert') state.subscriptions.push({ id: 'subscription', ...value });
              else Object.assign(state.subscriptions[0], value);
            }
          } else throw new Error('Unexpected table: ' + table);
          return Promise.resolve({ data, error }).then(resolve, reject);
        } catch (e) { return Promise.reject(e).then(resolve, reject); }
      },
    };
    return query;
  }};
}
const input = (extra = {}) => ({ userId: 'reviewer', productId: 'com.360.tavvy.pros.founding.annual', originalTransactionId: 'test-transaction', expiresAt: new Date(Date.now() + 60000), revokedAt: null, graceUntil: null, autoRenew: true, environment: 'Sandbox', source: 'receipt', ...extra });
test('Apple Founding purchase satisfies the existing tier constraint and preserves $199 price', async () => {
  const db = database();
  const result = await api.applyAppleEntitlement(db, input());
  assert.equal(result.status, 'active');
  assert.equal(db.state.subscriptions[0].tier, 'early_adopter');
  assert.equal(db.state.subscriptions[0].price_per_year, 199);
  assert.equal(db.state.provider.subscription_plan, 'founding');
});
test('restore retries update one subscription and genuine expiry deactivates both records', async () => {
  const db = database('reviewer');
  await api.applyAppleEntitlement(db, input());
  await api.applyAppleEntitlement(db, input());
  assert.equal(db.state.subscriptions.length, 1);
  const result = await api.applyAppleEntitlement(db, input({ expiresAt: new Date(Date.now() - 1000), source: 'notification' }));
  assert.equal(result.status, 'expired');
  assert.equal(db.state.provider.is_active, false);
  assert.equal(db.state.subscriptions[0].status, 'expired');
});
test('a purchase owned by another account is rejected without writes', async () => {
  const db = database('another-user');
  assert.equal((await api.applyAppleEntitlement(db, input())).status, 'conflict');
  assert.equal(db.state.writes, 0);
});
