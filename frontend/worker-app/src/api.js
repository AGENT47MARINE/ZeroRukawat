/**
 * api.js — ZeroRukawat API Service Layer
 * Every request/response is logged to the browser console with colour coding.
 * Open DevTools → Console to see all traffic in real time.
 */

const API_BASE =
  (typeof process !== 'undefined' && process?.env?.EXPO_PUBLIC_API_BASE_URL) ||
  (typeof window !== 'undefined' && window?.location?.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'http://127.0.0.1:8000');

const BASE_URL = API_BASE.replace(/\/$/, '');

// ─── Console logger ────────────────────────────────────────────────────────────
function logSent(method, path, body) {
  console.group(
    `%c ▶ SENT %c ${method} ${path}`,
    'background:#4F46E5;color:#fff;padding:2px 6px;border-radius:3px;font-weight:700;',
    'color:#4F46E5;font-weight:600;'
  );
  if (body) console.log('%cBody:', 'color:#6366f1;font-weight:600;', body);
  console.log('%cURL:', 'color:#94a3b8;', `${BASE_URL}${path}`);
  console.groupEnd();
}

function logReceived(method, path, status, data, ok) {
  const colour = ok ? '#16a34a' : '#dc2626';
  const label  = ok ? '◀ RECEIVED' : '✖ ERROR';
  console.group(
    `%c ${label} %c ${method} ${path} %c${status}`,
    `background:${colour};color:#fff;padding:2px 6px;border-radius:3px;font-weight:700;`,
    `color:${colour};font-weight:600;`,
    `background:${ok ? '#dcfce7' : '#fee2e2'};color:${colour};padding:2px 5px;border-radius:3px;font-size:11px;`
  );
  console.log('%cData:', `color:${colour};font-weight:600;`, data);
  console.groupEnd();
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  logSent(method, path, body);

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data     = await response.json();

  logReceived(method, path, response.status, data, response.ok);

  if (!response.ok) {
    const err = new Error(data.message || `Request failed (${response.status})`);
    err.status = response.status;
    throw err;
  }
  return data; // { status: 'success', data: { ... } }
}

// ─── API endpoints ─────────────────────────────────────────────────────────────
export const api = {
  // Auth
  register:          (payload)                       => request('POST', '/api/v1/auth/register', payload),
  verifyRegisterOtp: (phone, otp, registrationToken) => request('POST', '/api/v1/auth/register/verify-otp', {
    phone,
    otp,
    registration_token: registrationToken,
  }),
  requestOtp:        (phone)                         => request('POST', '/api/v1/auth/request-otp', { phone }),
  login:             (phone, otp)                    => request('POST', '/api/v1/auth/login', { phone, otp }),

  // Workers
  getMe:       (token)              => request('GET',   '/api/v1/workers/me', null, token),
  getPolicy:   (workerId, token)    => request('GET',   `/api/v1/workers/${workerId}/policy`, null, token),
  getPayouts:  (workerId, token)    => request('GET',   `/api/v1/workers/${workerId}/payouts`, null, token),
  initiatePayout: (workerId, payload, token) =>
    request('POST', `/api/v1/workers/${workerId}/payouts/initiate`, payload, token),
  updateWorker:(workerId, data, tk) => request('PATCH', `/api/v1/workers/${workerId}`, data, tk),
  getWorkerInsights: (token)         => request('GET',   '/api/v1/ai/worker-insights', null, token),

  // Disruptions (public)
  getActiveDisruptions: () => request('GET', '/api/v1/disruptions/active'),
};
