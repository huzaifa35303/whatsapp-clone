// Server configuration helper for local dev, web deployment, Electron desktop, and native mobile APK

export function isElectronApp(): boolean {
  return !!(
    (window as any).electronAPI?.isElectron ||
    navigator.userAgent.toLowerCase().includes('electron')
  );
}

export function isCapacitorApp(): boolean {
  return !!(
    (window as any).Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    (window.location.protocol === 'file:' && !isElectronApp())
  );
}

export function getServerUrl(): string {
  // 1. User configured custom URL in settings or localStorage
  const customUrl = localStorage.getItem('wa_server_url');
  if (customUrl && customUrl.trim()) {
    return customUrl.trim().replace(/\/+$/, '');
  }

  // 2. Environment variable injected at build time
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return (envUrl as string).replace(/\/+$/, '');
  }

  // 3. Native Capacitor Android / iOS APK
  if (isCapacitorApp()) {
    // In Android emulator, 10.0.2.2 accesses host machine.
    // If running on a physical phone, user can change this in Settings.
    return 'http://10.0.2.2:5000';
  }

  // 4. Electron Desktop
  if (isElectronApp()) {
    return 'http://localhost:5000';
  }

  // 5. In Vite browser dev (port 5173 uses Vite proxy to avoid CORS)
  if (window.location.port === '5173') {
    return '';
  }

  // 6. In production web deployment (Express serves dist)
  return window.location.origin;
}

export function setServerUrl(url: string) {
  const cleaned = url.trim().replace(/\/+$/, '');
  if (cleaned) {
    localStorage.setItem('wa_server_url', cleaned);
  } else {
    localStorage.removeItem('wa_server_url');
  }
}

export function getFullApiUrl(endpoint: string): string {
  if (!endpoint) return '';
  if (
    endpoint.startsWith('http://') ||
    endpoint.startsWith('https://') ||
    endpoint.startsWith('blob:') ||
    endpoint.startsWith('data:')
  ) {
    return endpoint;
  }
  const base = getServerUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${path}` : path;
}

