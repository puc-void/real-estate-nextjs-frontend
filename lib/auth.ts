import { NextRequest } from "next/server";

const SECRET = "nestora-secret-key-1234567890-very-long-secret";
const encoder = new TextEncoder();

// Base64Url helpers
function base64UrlEncode(str: string): string {
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

function base64UrlEncodeFromBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecodeToBuffer(str: string): ArrayBuffer {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getCryptoKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export interface JWTPayload {
  id: string;
  name: string;
  email: string;
  role: "USER" | "AGENT" | "ADMIN";
  agentId?: string;
  exp?: number;
}

export async function signJwt(payload: Omit<JWTPayload, "exp">): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const base64UrlHeader = base64UrlEncode(JSON.stringify(header));
  const base64UrlPayload = base64UrlEncode(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
    })
  );
  
  const dataToSign = `${base64UrlHeader}.${base64UrlPayload}`;
  const key = await getCryptoKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(dataToSign));
  const base64UrlSignature = base64UrlEncodeFromBuffer(signature);
  
  return `${dataToSign}.${base64UrlSignature}`;
}

export async function verifyJwt(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [header, payload, signature] = parts;
    const key = await getCryptoKey();
    const dataToVerify = `${header}.${payload}`;
    const sigBuffer = base64UrlDecodeToBuffer(signature);
    
    const isValid = await crypto.subtle.verify("HMAC", key, sigBuffer, encoder.encode(dataToVerify));
    if (!isValid) return null;
    
    const decodedPayload = JSON.parse(base64UrlDecode(payload)) as JWTPayload;
    if (decodedPayload.exp && decodedPayload.exp < Date.now()) {
      return null; // Expired
    }
    
    return decodedPayload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export async function getSessionUser(req: NextRequest): Promise<JWTPayload | null> {
  // Check Authorization header first
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return verifyJwt(token);
  }

  // Check token cookie
  const tokenCookie = req.cookies.get("token")?.value;
  if (tokenCookie) {
    return verifyJwt(tokenCookie);
  }

  return null;
}
