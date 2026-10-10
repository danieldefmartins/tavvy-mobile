const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), path = require('node:path');
const exportsUnderTest = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../../supabase/functions/verify-apple-purchase/receiptSelection.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsUnderTest });
const select = exportsUnderTest.selectReceiptEntry;
const monthly = 'ecard.monthly', annual = 'ecard.annual', pros = 'pros.annual', group = [monthly, annual];
const now = 1800000000000;
const current = { product_id: monthly, original_transaction_id: 'original', expires_date_ms: String(now + 100000), app_account_token: 'owner' };
const renewal = { product_id: monthly, auto_renew_product_id: annual, auto_renew_status: '1', original_transaction_id: 'original' };
test('verified scheduled annual crossgrade retains monthly entitlement and ownership token', () => {
  const result = select([current], [renewal], annual, group, now);
  assert.equal(result.entry, current);
  assert.equal(result.entry.app_account_token, 'owner');
  assert.equal(result.scheduledChange.productId, annual);
  assert.equal(result.scheduledChange.effectiveAt, new Date(now + 100000).toISOString());
});
test('completed annual purchase selects actual annual receipt instead of scheduled monthly plan', () => {
  const purchased = { ...current, product_id: annual, expires_date_ms: String(now + 200000) };
  assert.equal(select([current, purchased], [renewal], annual, group, now).entry, purchased);
  assert.equal(select([current, purchased], [renewal], annual, group, now).scheduledChange, undefined);
});
test('expired historical annual receipt does not hide a valid future switch', () => {
  const old = { ...current, product_id: annual, expires_date_ms: String(now - 1) };
  assert.equal(select([old, current], [renewal], annual, group, now).entry, current);
});
test('client selection alone cannot authorize a scheduled product', () => {
  assert.equal(select([current], [], annual, group, now), null);
});
test('renewal must match original transaction, current product and enabled renewal', () => {
  for (const patch of [{ original_transaction_id: 'other' }, { product_id: pros }, { auto_renew_status: '0' }, { auto_renew_product_id: monthly }]) {
    assert.equal(select([current], [{ ...renewal, ...patch }], annual, group, now), null);
  }
});
test('expired, revoked and malformed current receipts never authorize a future plan', () => {
  for (const patch of [{ expires_date_ms: String(now) }, { cancellation_date_ms: String(now - 1) }, { expires_date_ms: 'Infinity' }, { expires_date_ms: 'bad' }, { expires_date_ms: '9e15' }]) {
    assert.equal(select([{ ...current, ...patch }], [renewal], annual, group, now), null);
  }
});
test('cannot cross from eCard to Pros, or from Pros to eCard', () => {
  assert.equal(select([current], [{ ...renewal, auto_renew_product_id: pros }], pros, group, now), null);
  assert.equal(select([{ ...current, product_id: pros }], [{ ...renewal, product_id: pros }], annual, group, now), null);
});
test('expired requested receipt is retained for the existing expiry and finish flow', () => {
  const expired = { ...current, product_id: annual, expires_date_ms: String(now - 1) };
  assert.equal(select([expired], [], annual, group, now).entry, expired);
});
