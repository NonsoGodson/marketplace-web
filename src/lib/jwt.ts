// Decodes the payload of a JWT without verifying its signature — fine for
// reading claims client-side to drive UI (the backend is the only place
// that actually trusts this token). Avoids pulling in a whole jwt-decode
// dependency for three fields.
export interface DecodedAccessToken {
  sub: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'BUYER_SELLER' | 'ADMIN' | 'SUPPORT_ADMIN';
  exp: number;
}

export function decodeAccessToken(token: string): DecodedAccessToken | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeAccessToken(token);
  if (!decoded) return true;
  return decoded.exp * 1000 < Date.now();
}
