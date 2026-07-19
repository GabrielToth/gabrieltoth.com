import { createHmac, timingSafeEqual } from "node:crypto"

function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/")
  while (str.length % 4) str += "="
  return Buffer.from(str, "base64")
}

export function verifyJwt(token, secret) {
  const parts = token.split(".")
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format")
  }

  const [headerB64, payloadB64, signatureB64] = parts

  const expectedSig = createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url")

  const actualSig = signatureB64

  const expectedBuf = Buffer.from(expectedSig, "utf8")
  const actualBuf = Buffer.from(actualSig, "utf8")

  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    throw new Error("Invalid JWT signature")
  }

  let payload
  try {
    const decoded = base64urlDecode(payloadB64)
    payload = JSON.parse(decoded.toString("utf8"))
  } catch {
    throw new Error("Invalid JWT payload")
  }

  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error("JWT expired")
  }

  return payload
}
