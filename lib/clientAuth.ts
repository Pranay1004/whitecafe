export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    // Decode base64 payload safely in browser
    const payloadJson = window.atob(parts[1]);
    const payload = JSON.parse(payloadJson);
    
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function clearClientSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isGuest');
    localStorage.removeItem('cart');
  }
}
