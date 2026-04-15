const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 12000);
const RETRY_BASE_DELAY_MS = Number(import.meta.env.VITE_API_RETRY_DELAY_MS ?? 350);
const RETRY_MAX_DELAY_MS = Number(import.meta.env.VITE_API_RETRY_MAX_DELAY_MS ?? 2000);
const AUTH_STORAGE_KEY = 'sunmount.auth.session';

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.code = options.code ?? 'REQUEST_FAILED';
    this.retriable = Boolean(options.retriable);
    this.details = options.details ?? [];
    this.requestId = options.requestId ?? null;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetriableStatus = (status) => status === 408 || status === 425 || status === 429 || status >= 500;

const buildIdempotencyKey = (prefix) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function getAuthSession() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.token) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setAuthSession(session) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthSession()?.token);
}

function makeUrl(path, query) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = API_BASE_URL ? new URL(`${API_BASE_URL}${normalizedPath}`) : new URL(normalizedPath, window.location.origin);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  if (!API_BASE_URL) {
    return `${url.pathname}${url.search}`;
  }

  return url.toString();
}

async function request(path, options = {}) {
  const retryAttempts = Number(options.retryAttempts ?? ((options.method ?? 'GET') === 'GET' ? 2 : 0));
  let attempt = 0;
  let lastError = null;

  while (attempt <= retryAttempts) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs ?? REQUEST_TIMEOUT_MS));

    try {
      const response = await fetch(makeUrl(path, options.query), {
        method: options.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...((!options.skipAuth && getAuthSession()?.token)
            ? { Authorization: `Bearer ${getAuthSession().token}` }
            : {}),
          ...(options.headers ?? {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const text = await response.text();
      const payload = text ? JSON.parse(text) : null;

      if (!response.ok || !payload?.success) {
        const retriable = isRetriableStatus(response.status);
        const message = payload?.message ?? `Request failed (${response.status})`;
        const requestId = response.headers.get('x-request-id');
        if (response.status === 401) {
          clearAuthSession();
        }
        throw new ApiError(message, {
          status: response.status,
          code: payload?.error?.code ?? 'REQUEST_FAILED',
          details: payload?.error?.details ?? [],
          retriable,
          requestId,
        });
      }

      return payload;
    } catch (error) {
      clearTimeout(timeout);

      if (error?.name === 'AbortError') {
        lastError = new ApiError('Request timed out', {
          status: 408,
          code: 'REQUEST_TIMEOUT',
          retriable: true,
        });
      } else if (error instanceof ApiError) {
        lastError = error;
      } else {
        lastError = new ApiError(error?.message ?? 'Network request failed', {
          status: 0,
          code: 'NETWORK_ERROR',
          retriable: true,
        });
      }

      const canRetry = attempt < retryAttempts && lastError.retriable;
      if (!canRetry) {
        throw lastError;
      }

      const backoff = Math.min(RETRY_MAX_DELAY_MS, RETRY_BASE_DELAY_MS * 2 ** attempt);
      await sleep(backoff);
      attempt += 1;
    }
  }

  throw lastError ?? new ApiError('Request failed unexpectedly');
}

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function normalizeMetric(metric) {
  return {
    ...metric,
    value: toNumber(metric.value, metric.value),
    delta: metric.delta ?? '0%',
  };
}

export function normalizeInventoryItem(item) {
  return {
    ...item,
    price: toNumber(item.price),
    quantity: toNumber(item.quantity),
    weight: item.weight === null || item.weight === undefined ? '' : `${item.weight} kg`,
    lastUpdated: item.lastUpdated,
  };
}

export function normalizeOrderQueueItem(order, kind) {
  const partyKey = kind === 'sales' ? 'customer' : 'supplier';
  const partyIdKey = kind === 'sales' ? 'customerId' : 'supplierId';
  return {
    ...order,
    amount: toNumber(order.amount),
    [partyKey]: order[partyKey] ?? order[partyIdKey],
  };
}

export function normalizeOrderLines(payload) {
  return {
    ...payload,
    amount: toNumber(payload.amount),
    lines: (payload.lines ?? []).map((line) => ({
      ...line,
      quantity: toNumber(line.quantity),
      unitPrice: toNumber(line.unitPrice),
      lineTotal: toNumber(line.lineTotal),
    })),
  };
}

export function normalizeBatch(batch) {
  const outputQty = Array.isArray(batch.output)
    ? batch.output.reduce((sum, row) => sum + toNumber(row.quantity), 0)
    : toNumber(batch.output);

  return {
    ...batch,
    progress: toNumber(batch.progress),
    outputText: `${outputQty} Units`,
    eta: batch.eta ? new Date(batch.eta).toISOString() : null,
    materials: (batch.materials ?? []).map((row) => `${row.productCode} (${row.quantity})`),
    materialConsumed: Boolean(batch.materialConsumed),
    outputAdded: Boolean(batch.outputAdded),
    statusLabel: batch.statusLabel ?? batch.status,
  };
}

export function normalizeHistoryRecord(record) {
  return {
    ...record,
    value: toNumber(record.value),
    note: record.note ?? '',
  };
}

export async function getDashboardMetrics() {
  const payload = await request('/api/dashboard/metrics');
  return (payload.data ?? []).map(normalizeMetric);
}

export async function getInventory(params = {}) {
  const payload = await request('/api/inventory', { query: params });
  return {
    rows: (payload.data ?? []).map(normalizeInventoryItem),
    pagination: payload.meta?.pagination ?? null,
  };
}

export async function patchInventoryQuantity(id, body) {
  const payload = await request(`/api/inventory/${id}/quantity`, { method: 'PATCH', body });
  return normalizeInventoryItem(payload.data);
}

export async function getSalesOrders(params = {}) {
  const payload = await request('/api/orders', { query: { ...params, type: 'SALE' } });
  return {
    rows: (payload.data ?? []).map((row) => normalizeOrderQueueItem(row, 'sales')),
    pagination: payload.meta?.pagination ?? null,
  };
}

export async function getSalesOrderLines(id) {
  const payload = await request(`/api/orders/${id}/lines`, { query: { type: 'SALE' } });
  return normalizeOrderLines(payload.data);
}

export async function updateSalesOrderLines(id, body) {
  const payload = await request(`/api/orders/${id}/lines`, { method: 'PUT', body: { ...body, type: 'SALE' } });
  return normalizeOrderLines(payload.data);
}

export async function finalizeSalesOrder(id) {
  const payload = await request(`/api/orders/${id}/status`, {
    method: 'POST',
    body: { type: 'SALE', status: 'DISPATCHED' },
    retryAttempts: 1,
    headers: {
      'Idempotency-Key': buildIdempotencyKey(`sales-finalize-${id}`),
    },
  });
  return normalizeOrderQueueItem(payload.data, 'sales');
}

export async function getPurchaseOrders(params = {}) {
  const payload = await request('/api/orders', { query: { ...params, type: 'PURCHASE' } });
  return {
    rows: (payload.data ?? []).map((row) => normalizeOrderQueueItem(row, 'purchase')),
    pagination: payload.meta?.pagination ?? null,
  };
}

export async function getPurchaseOrderLines(id) {
  const payload = await request(`/api/orders/${id}/lines`, { query: { type: 'PURCHASE' } });
  return normalizeOrderLines(payload.data);
}

export async function updatePurchaseOrderLines(id, body) {
  const payload = await request(`/api/orders/${id}/lines`, { method: 'PUT', body: { ...body, type: 'PURCHASE' } });
  return normalizeOrderLines(payload.data);
}

export async function completePurchaseOrder(id) {
  const payload = await request(`/api/orders/${id}/status`, {
    method: 'POST',
    body: { type: 'PURCHASE', status: 'COMPLETED' },
    retryAttempts: 1,
    headers: {
      'Idempotency-Key': buildIdempotencyKey(`purchase-complete-${id}`),
    },
  });
  return normalizeOrderQueueItem(payload.data, 'purchase');
}

export async function getManufacturingBatches(params = {}) {
  const payload = await request('/api/manufacturing/batches', { query: params });
  return {
    rows: (payload.data ?? []).map(normalizeBatch),
    pagination: payload.meta?.pagination ?? null,
  };
}

export async function updateManufacturingBatch(id, body) {
  const payload = await request(`/api/manufacturing/batches/${id}`, { method: 'PATCH', body });
  return normalizeBatch(payload.data);
}

export async function deleteManufacturingBatch(id) {
  const payload = await request(`/api/manufacturing/batches/${id}`, { method: 'DELETE' });
  return payload.data;
}

export async function startManufacturingBatch(id) {
  const payload = await request(`/api/manufacturing/batches/${id}/start`, {
    method: 'POST',
    retryAttempts: 1,
    headers: {
      'Idempotency-Key': buildIdempotencyKey(`batch-start-${id}`),
    },
  });
  return normalizeBatch(payload.data);
}

export async function completeManufacturingBatch(id) {
  const payload = await request(`/api/manufacturing/batches/${id}/complete`, {
    method: 'POST',
    retryAttempts: 1,
    headers: {
      'Idempotency-Key': buildIdempotencyKey(`batch-complete-${id}`),
    },
  });
  return normalizeBatch(payload.data);
}

export async function getHistoryRecords(params = {}) {
  const payload = await request('/api/history', { query: params });
  return {
    rows: (payload.data ?? []).map(normalizeHistoryRecord),
    pagination: payload.meta?.pagination ?? null,
  };
}

export async function updateHistoryRecord(id, body) {
  const payload = await request(`/api/history/${id}`, { method: 'PATCH', body });
  return normalizeHistoryRecord(payload.data);
}

export async function advanceHistoryRecord(id) {
  const payload = await request(`/api/history/${id}/next-stage`, {
    method: 'POST',
    retryAttempts: 1,
    headers: {
      'Idempotency-Key': buildIdempotencyKey(`history-next-${id}`),
    },
  });
  return normalizeHistoryRecord(payload.data);
}

export async function deleteHistoryRecord(id) {
  const payload = await request(`/api/history/${id}`, { method: 'DELETE' });
  return payload.data;
}

export async function getEntities(params = {}) {
  const payload = await request('/api/entities', { query: params });
  return {
    rows: payload.data ?? [],
    pagination: payload.meta?.pagination ?? null,
  };
}

export async function createEntity(body) {
  const payload = await request('/api/entities', { method: 'POST', body });
  return payload.data;
}

export async function updateEntity(id, body) {
  const payload = await request(`/api/entities/${id}`, { method: 'PATCH', body });
  return payload.data;
}

export async function deleteEntity(id) {
  const payload = await request(`/api/entities/${id}`, { method: 'DELETE' });
  return payload.data;
}

export async function lookupEntity(code) {
  const payload = await request(`/api/entities/lookup/${encodeURIComponent(code)}`);
  return payload.data;
}

export async function getCoreProducts(params = {}) {
  const payload = await request('/products', { query: params });
  return {
    rows: payload.data ?? [],
    pagination: payload.meta?.pagination ?? null,
  };
}

export async function createCoreOrder(body) {
  const payload = await request('/orders', { method: 'POST', body });
  return payload.data;
}

export async function getCoreOrderById(id) {
  const payload = await request(`/orders/${id}`);
  return payload.data;
}

export async function updateCoreOrder(id, body) {
  const payload = await request(`/orders/${id}`, { method: 'PUT', body });
  return payload.data;
}

export async function deleteCoreOrder(id) {
  const payload = await request(`/orders/${id}`, { method: 'DELETE' });
  return payload.data;
}

export async function advanceOrderStatus(orderId, type, status) {
  const payload = await request(`/api/orders/${orderId}/status`, {
    method: 'POST',
    body: {
      type,
      status,
    },
  });
  return normalizeOrderQueueItem(payload.data, type === 'SALE' ? 'sales' : 'purchase');
}

const SALE_NEXT_STATUS = {
  Quotation: 'CONFIRMED',
  Confirmed: 'PACKED',
  Packed: 'DISPATCHED',
  Dispatched: 'DELIVERED',
  Delivered: 'PAID',
};

const PURCHASE_NEXT_STATUS = {
  Created: 'APPROVED',
  Approved: 'ORDERED',
  Ordered: 'RECEIVED',
  Received: 'COMPLETED',
  Unpaid: 'PAID',
  Paid: 'COMPLETED',
};

export async function advanceOrderStage(orderId, currentStatus) {
  const nextStatus = SALE_NEXT_STATUS[currentStatus];
  if (!nextStatus) {
    throw new ApiError('No next sales stage available', { code: 'NO_NEXT_STAGE' });
  }
  return advanceOrderStatus(orderId, 'SALE', nextStatus);
}

export async function advancePurchaseOrderStage(orderId, currentStatus) {
  const nextStatus = PURCHASE_NEXT_STATUS[currentStatus];
  if (!nextStatus) {
    throw new ApiError('No next purchase stage available', { code: 'NO_NEXT_STAGE' });
  }
  return advanceOrderStatus(orderId, 'PURCHASE', nextStatus);
}

export async function getSettings() {
  const payload = await request('/api/settings');
  return payload.data ?? {};
}

export async function updateSettings(body) {
  const payload = await request(`/api/settings`, { method: 'PUT', body });
  return payload.data ?? {};
}

export async function getSystemHealth() {
  const payload = await request('/api/settings/health');
  return payload.data ?? {};
}

export async function getOrderRuntimeStatus() {
  const payload = await request('/health');
  return {
    running: payload?.data?.status === 'ok',
    timestamp: payload?.data?.timestamp ?? null,
  };
}

export async function loginUser(credentials) {
  const payload = await request('/api/auth/login', {
    method: 'POST',
    body: credentials,
    skipAuth: true,
  });
  const session = payload.data ?? {};
  setAuthSession(session);
  return session;
}

export async function signupUser(credentials) {
  const payload = await request('/api/auth/signup', {
    method: 'POST',
    body: credentials,
    skipAuth: true,
  });
  const session = payload.data ?? {};
  setAuthSession(session);
  return session;
}

export function logoutUser() {
  return request('/api/auth/logout', {
    method: 'POST',
  }).catch(() => null).finally(() => {
    clearAuthSession();
  });
}
