import { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "dioleh2_admin_session";
const encoder = new TextEncoder();

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Cryptographically verifies HMAC-SHA256 session token using standard Web Crypto.
 * Fully compatible with both Node.js runtime and Next.js Edge runtime (middleware).
 */
export async function isAdminSessionValid(token: string | undefined): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const username = process.env.ADMIN_USERNAME;
  if (!token || !secret || secret.length < 32 || !username) {
    return false;
  }

  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra !== undefined) {
      return false;
    }

    const data = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(payload))
    ) as { sub?: string; exp?: number };

    if (
      data.sub !== username ||
      !data.exp ||
      data.exp <= Math.floor(Date.now() / 1000)
    ) {
      return false;
    }

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = decodeBase64Url(signature);
    const payloadBytes = encoder.encode(payload);

    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as unknown as BufferSource,
      payloadBytes as unknown as BufferSource
    );
  } catch {
    return false;
  }
}

/**
 * Validates admin session directly from NextRequest cookies.
 */
export async function verifyAdminSessionFromRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return isAdminSessionValid(token);
}
