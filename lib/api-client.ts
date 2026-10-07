export type PlatformRole = 'USER' | 'SUPER_ADMIN';
export type OrgRole = 'OWNER' | 'ADMIN' | 'STAFF';
export type HackathonStaffRole = 'JUDGE' | 'MENTOR' | 'VOLUNTEER';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  platformRole: PlatformRole;
  emailVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  onboardingCompleted: boolean;
  orgMemberships: {
    organizationId: string;
    organizationSlug: string;
    role: OrgRole;
  }[];
  staffRoles: {
    hackathonId: string;
    hackathonSlug: string;
    role: HackathonStaffRole;
  }[];
}

class ApiError extends Error {
  code: string;
  details?: unknown;
  status: number;
  
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function handleRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  
  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/v1/auth/refresh', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}

export async function apiFetch<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
    const refreshed = await handleRefresh();
    if (refreshed) {
      res = await fetch(url, { ...options, headers });
    } else {
      // Could trigger a global logout event here
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('unauthorized'));
      }
    }
  }

  if (!res.ok) {
    let errCode = 'UNKNOWN_ERROR';
    let errMessage = 'An unknown error occurred';
    let errDetails;
    
    try {
      const errBody = await res.json();
      if (errBody.error) {
        errCode = errBody.error.code || errCode;
        errMessage = errBody.error.message || errMessage;
        errDetails = errBody.error.details;
      }
    } catch {
      errMessage = res.statusText;
    }
    
    throw new ApiError(res.status, errCode, errMessage, errDetails);
  }

  if (res.status === 204) {
    return {} as T;
  }

  const json = await res.json();
  return (json && typeof json === 'object' && 'data' in json) ? json.data as T : json as T;
}
