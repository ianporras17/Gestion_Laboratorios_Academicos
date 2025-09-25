// apps/mobile/lib/api.ts
import { getToken } from './auth';

const BASE = process.env.EXPO_PUBLIC_API_URL!;
if (!BASE) console.warn('⚠️ EXPO_PUBLIC_API_URL no está definido');

export class ApiError extends Error {
  status: number;
  details?: Array<{ path?: string; param?: string; msg?: string }>;
  constructor(status: number, message: string, details?: any[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type ReqInit = {
  method?: string;
  body?: any;
  auth?: boolean;
  headers?: Record<string, string>;
};

async function request<T>(path: string, init: ReqInit = {}): Promise<T> {
  const url = `${BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  };
  if (init.auth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: init.method || 'GET',
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const raw = await res.text();
  let data: any;
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }

  if (!res.ok) {
    // express-validator manda "errors: [{param/path,msg}]"
    const details = Array.isArray(data?.errors) ? data.errors : undefined;
    const message =
      data?.error ||
      (details ? details.map((e: any) => `${e.param || e.path}: ${e.msg}`).join('\n') : `HTTP ${res.status}`);
    throw new ApiError(res.status, message, details);
  }

  return data as T;
}

export const api = {
  register: (body: {
    email: string; password: string; role: 'student'|'teacher';
    full_name: string; id_code: string; career_or_department: string; phone?: string;
  }) => request<{ token: string; user: any }>('/auth/register', { method:'POST', body }),

  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', { method:'POST', body:{ email, password }}),

  me: () => request<{ user: any; certifications: any[] }>('/users/me', { auth:true }),
  updateMe: (patch: Partial<{ full_name: string; phone: string; career_or_department: string }>) =>
    request<{ user: any }>('/users/me', { method:'PUT', auth:true, body: patch }),

  myCerts: () => request<any[]>('/users/me/certifications', { auth:true }),
  addCert: (code: string, obtained_at: string, name?: string) =>
    request('/users/me/certifications', { method:'POST', auth:true, body:{ code, name, obtained_at } }),
};
