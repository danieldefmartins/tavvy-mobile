import "npm:reflect-metadata@0.2.2";
import { X509CertificateGenerator } from 'npm:@peculiar/x509@2.1.0';
import { verifyAppleJws } from '../../supabase/functions/_shared/appleJws.ts';
import { assertEquals, assertRejects } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

const algorithm = { name: 'ECDSA', namedCurve: 'P-256' };
const signingAlgorithm = { name: 'ECDSA', hash: 'SHA-256' };
const rootKeys = await crypto.subtle.generateKey(algorithm, true, ['sign', 'verify']);
const leafKeys = await crypto.subtle.generateKey(algorithm, true, ['sign', 'verify']);
const validity = { notBefore: new Date('2026-01-01'), notAfter: new Date('2027-01-01'), signingAlgorithm };
const root = await X509CertificateGenerator.createSelfSigned({ ...validity, name: 'CN=Fixture Root', keys: rootKeys }, crypto);
const leaf = await X509CertificateGenerator.create({ ...validity, subject: 'CN=Fixture Leaf', issuer: root.subject, publicKey: leafKeys.publicKey, signingKey: rootKeys.privateKey }, crypto);
const now = new Date('2026-10-09');
function encode(value: unknown) { return btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
async function token(header = { alg: 'ES256', x5c: [leaf.toString('base64'), root.toString('base64')] }) {
  const input = `${encode(header)}.${encode({ notificationType: 'TEST' })}`;
  const signature = new Uint8Array(await crypto.subtle.sign(signingAlgorithm, leafKeys.privateKey, new TextEncoder().encode(input)));
  return `${input}.${btoa(String.fromCharCode(...signature)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
}
Deno.test('valid certificate chain and ES256 payload verify in Deno WebCrypto', async () => {
  assertEquals((await verifyAppleJws<{notificationType: string}>(await token(), root.toString(), now)).payload.notificationType, 'TEST');
});
Deno.test('a fixture certificate cannot impersonate the pinned Apple root', async () => {
  await assertRejects(() => token().then(t => verifyAppleJws(t)), Error, 'Apple Root');
});
Deno.test('altered payload fails signature verification', async () => {
  const parts = (await token()).split('.'); parts[1] = encode({ notificationType: 'EXPIRED' });
  await assertRejects(() => verifyAppleJws(parts.join('.'), root.toString(), now), Error, 'signature');
});
Deno.test('expired and not-yet-valid certificates fail', async () => {
  for (const date of ['2025-01-01', '2028-01-01']) await assertRejects(() => token().then(t => verifyAppleJws(t, root.toString(), new Date(date))), Error, 'validity');
});
Deno.test('wrong algorithm, missing chain and malformed tokens fail closed', async () => {
  for (const value of ['bad', await token({alg:'none',x5c:[]}), await token({alg:'ES256',x5c:[]})]) await assertRejects(() => verifyAppleJws(value, root.toString(), now));
});
Deno.test('a mismatched issuer key cannot validate a leaf', async () => {
  const impostor = await X509CertificateGenerator.createSelfSigned({ ...validity, name: root.subject, keys: leafKeys }, crypto);
  const value = await token({alg:'ES256', x5c:[leaf.toString('base64'), impostor.toString('base64')]});
  await assertRejects(() => verifyAppleJws(value, impostor.toString(), now), Error, 'signature');
});
