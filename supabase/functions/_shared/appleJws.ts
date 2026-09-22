import { X509Certificate, verify as cryptoVerify } from "node:crypto";

/**
 * Verifies an App Store Server Notifications V2 / App Store Server API JWS
 * (`signedPayload`, `signedTransactionInfo`, `signedRenewalInfo`).
 *
 * Apple signs with ES256 and ships the certificate chain in the `x5c` header.
 * Trust is anchored on Apple Root CA - G3, pinned below (fetched from
 * https://www.apple.com/certificateauthority/ on 2026-09-22; SHA-256
 * 63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79).
 * Every certificate must be within its validity window, each must be signed by
 * the next one up, the root must be byte-identical to the pin, and the JWS
 * signature must verify with the leaf's key. Anything else throws.
 */
export const APPLE_ROOT_CA_G3_PEM = `-----BEGIN CERTIFICATE-----
MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwS
QXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9u
IEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcN
MTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBS
b290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9y
aXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49
AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtf
TjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517
IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySr
MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gA
MGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4
at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM
6BgD56KyKA==
-----END CERTIFICATE-----`;

export class AppleJwsError extends Error {
  constructor(message: string) { super(message); this.name = "AppleJwsError"; }
}

function b64urlToBuffer(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function derToPem(derBase64: string): string {
  const lines = derBase64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----`;
}

export interface VerifiedJws<T> {
  header: { alg: string; x5c: string[] };
  payload: T;
}

/** Throws AppleJwsError unless the token is a valid, Apple-signed ES256 JWS. */
export function verifyAppleJws<T = Record<string, unknown>>(token: string, rootPem: string = APPLE_ROOT_CA_G3_PEM, now: Date = new Date()): VerifiedJws<T> {
  if (typeof token !== "string") throw new AppleJwsError("JWS is not a string.");
  const parts = token.split(".");
  if (parts.length !== 3) throw new AppleJwsError("JWS must have three segments.");
  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg?: string; x5c?: unknown };
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBuffer(headerB64)));
  } catch {
    throw new AppleJwsError("JWS header is not valid JSON.");
  }
  if (header.alg !== "ES256") throw new AppleJwsError(`Unsupported JWS algorithm ${String(header.alg)}.`);
  if (!Array.isArray(header.x5c) || header.x5c.length < 2 || !header.x5c.every((c) => typeof c === "string")) {
    throw new AppleJwsError("JWS header lacks a certificate chain.");
  }
  const chain = (header.x5c as string[]).map((der, index) => {
    try {
      return new X509Certificate(derToPem(der));
    } catch {
      throw new AppleJwsError(`Certificate ${index} in x5c could not be parsed.`);
    }
  });

  const root = new X509Certificate(rootPem);
  const presentedRoot = chain[chain.length - 1];
  if (presentedRoot.raw.toString("base64") !== root.raw.toString("base64")) {
    throw new AppleJwsError("Certificate chain does not end at Apple Root CA - G3.");
  }

  for (let i = 0; i < chain.length; i++) {
    const cert = chain[i];
    if (now < new Date(cert.validFrom) || now > new Date(cert.validTo)) {
      throw new AppleJwsError(`Certificate ${i} is outside its validity period.`);
    }
    const issuer = i + 1 < chain.length ? chain[i + 1] : cert; // root is self-signed
    if (!cert.checkIssued(issuer)) throw new AppleJwsError(`Certificate ${i} was not issued by certificate ${i + 1}.`);
    if (!cert.verify(issuer.publicKey)) throw new AppleJwsError(`Certificate ${i} signature is invalid.`);
  }

  const leafKey = chain[0].publicKey;
  const signature = b64urlToBuffer(signatureB64);
  if (signature.length !== 64) throw new AppleJwsError("ES256 signature must be 64 bytes.");
  const ok = cryptoVerify(
    "sha256",
    new TextEncoder().encode(`${headerB64}.${payloadB64}`),
    { key: leafKey, dsaEncoding: "ieee-p1363" },
    signature,
  );
  if (!ok) throw new AppleJwsError("JWS signature does not verify.");

  let payload: T;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlToBuffer(payloadB64)));
  } catch {
    throw new AppleJwsError("JWS payload is not valid JSON.");
  }
  return { header: { alg: "ES256", x5c: header.x5c as string[] }, payload };
}
