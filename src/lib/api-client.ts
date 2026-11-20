import { getTokens, setTokens, clearTokens } from './token-store';
import { decodeAccessToken } from './jwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean; // attach the stored access token; default false (most GETs are public)
}

let refreshInFlight: Promise<string | null> | null = null;

// Calls /auth/refresh at most once even if several requests 401 at the same
// moment — they all await the same in-flight promise instead of each
// kicking off their own refresh (which would race and revoke each other's
// rotated token, per the backend's rotate-on-use refresh design).
async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const stored = getTokens();
    if (!stored) return null;
    const decoded = decodeAccessToken(stored.accessToken);
    if (!decoded) return null;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: decoded.sub, refreshToken: stored.refreshToken }),
      });
      if (!res.ok) throw new Error('refresh failed');
      const tokens = await res.json();
      setTokens(tokens);
      return tokens.accessToken as string;
    } catch {
      clearTokens();
      return null;
    }
  })();

  const result = await refreshInFlight;
  refreshInFlight = null;
  return result;
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { auth, headers, ...rest } = options;
  const accessToken = auth ? getTokens()?.accessToken : undefined;

  // no-store: always ask the API. Without it Next.js can freeze a server-rendered
  // page's data at build time, so new categories/listings would not appear until
  // the site is redeployed.
  const res = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  // A 401 on an authenticated call gets exactly one silent retry after a
  // token refresh — if that also fails, the error propagates so the caller
  // (a page-level effect, typically) can redirect to /login.
  if (res.status === 401 && auth && !isRetry) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) return request<T>(path, options, true);
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => undefined) : undefined;

  if (!res.ok) {
    const message = (body && (body.message || body.error)) || res.statusText;
    throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : message, body);
  }

  return body as T;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type UserRole = 'BUYER' | 'SELLER' | 'BUYER_SELLER' | 'ADMIN' | 'SUPPORT_ADMIN';

export type CategoryType = 'PRODUCT' | 'SERVICE';

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  children: Category[];
}

export interface ProductSummary {
  id: string;
  slug: string;
  title: string;
  price: string;
  discountPrice: string | null;
  currency: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SUSPENDED';
  images: { url: string }[];
  store: { id: string; businessName: string; slug: string };
  category: { id: string; name: string; slug: string };
}

export interface ProductDetail extends ProductSummary {
  description: string;
  type: 'PHYSICAL' | 'DIGITAL';
  condition: string | null;
  variants: { id: string; name: string; value: string; priceOverride: string | null; stockQuantity: number }[];
}

export interface ServiceSummary {
  id: string;
  slug: string;
  title: string;
  price: string;
  currency: string;
  pricingModel: 'FIXED' | 'HOURLY' | 'PER_SESSION';
  locationType: 'ONLINE' | 'IN_PERSON' | 'BOTH';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SUSPENDED';
  images: { url: string }[];
  store: { id: string; businessName: string; slug: string };
  category: { id: string; name: string; slug: string };
}

export interface ServiceDetail extends ServiceSummary {
  description: string;
  durationMinutes: number;
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
}

export interface SearchResult<T> {
  items: T[];
  total: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: {
    id: string;
    slug: string;
    title: string;
    price: string;
    currency: string;
    stockQuantity: number;
    images: { url: string }[];
    store: { businessName: string };
  };
  variant: { id: string; name: string; value: string; priceOverride: string | null; stockQuantity: number } | null;
}

export interface Cart {
  id: string;
  items: CartItem[];
}

export interface SellerOrderItem {
  id: string;
  titleSnapshot: string;
  priceSnapshot: string;
  quantity: number;
  lineTotal: string;
}

export interface SellerOrder {
  id: string;
  storeId: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  subtotal: string;
  items: SellerOrderItem[];
  store?: { businessName: string };
}

export interface Order {
  id: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'PARTIALLY_FULFILLED' | 'COMPLETED' | 'CANCELLED';
  totalAmount: string;
  currency: string;
  createdAt: string;
  sellerOrders: SellerOrder[];
  payment?: { status: string; externalPaymentId: string } | null;
}

export interface CheckoutResult {
  order: Order;
  /** Paystack's hosted checkout page — the buyer is sent here to pay. */
  authorizationUrl: string;
  paymentId: string;
}

export interface SellerStore {
  id: string;
  businessName: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  verificationStatus: 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  verificationNotes: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  country: string | null;
}

export interface OnboardingInput {
  businessName: string;
  description: string;
  contactEmail: string;
  contactPhone?: string;
  country?: string;
  offersServices?: boolean;
}

export interface DashboardSummary {
  store: { id: string; businessName: string; status: string };
  catalog: { totalProducts: number; publishedProducts: number; totalServices: number; publishedServices: number };
  orders: { total: number; recent: unknown[] };
  bookings: { total: number; upcoming: unknown[] };
  earnings: { available: number; pending: number };
}

export interface CreateProductInput {
  categoryId: string;
  title: string;
  description: string;
  type: 'PHYSICAL' | 'DIGITAL';
  price: number;
  discountPrice?: number;
  currency?: string;
  brand?: string;
  location?: string;
  stockQuantity?: number;
  images?: { url: string }[];
}

export interface CreateServiceInput {
  categoryId: string;
  title: string;
  description: string;
  pricingModel: 'FIXED' | 'HOURLY' | 'PER_SESSION';
  price: number;
  currency?: string;
  locationType: 'ONLINE' | 'IN_PERSON' | 'BOTH';
  location?: string;
  durationMinutes: number;
  requirements?: string;
  cancellationPolicy?: string;
  images?: string[];
}

export interface Booking {
  id: string;
  serviceId: string;
  storeId: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  priceSnapshot: string;
  customerNotes: string | null;
  service?: { title: string };
  payment?: { status: string; externalPaymentId: string } | null;
}

export interface BookingResult {
  booking: Booking;
  authorizationUrl: string;
  paymentId: string;
}

export interface PaymentVerification {
  kind: 'order' | 'booking';
  id: string;
  status: string;
}

export interface Review {
  id: string;
  rating: number;
  body: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  author: { firstName: string; lastName: string };
}

export interface ReviewList {
  items: Review[];
  averageRating: number;
  totalReviews: number;
}

export interface StoreProfile {
  id: string;
  businessName: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  country: string | null;
  status: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface Conversation {
  id: string;
  buyerId: string;
  storeId: string;
  blockedByBuyer: boolean;
  blockedBySeller: boolean;
  messages: Message[];
}

export interface ConversationSummary {
  id: string;
  storeId: string;
  buyerId: string;
  updatedAt: string;
  store?: { businessName: string };
  buyer?: { firstName: string; lastName: string };
  messages: Message[]; // most recent one only, per the backend's list endpoint
}

export interface AdminAnalytics {
  users: { total: number; newInPeriod: number; periodDays: number };
  sellers: { active: number; pendingApplications: number };
  listings: { publishedProducts: number; publishedServices: number };
  transactions: {
    totalOrders: number;
    totalBookings: number;
    grossTransactionValue: number;
    platformRevenue: number;
    sellerPayouts: number;
  };
  trustAndSafety: { openReports: number; openDisputes: number; refundedOrders: number; refundedBookings: number };
}

export interface PendingStore {
  id: string;
  businessName: string;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  country: string | null;
  submittedAt: string | null;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  isActive: boolean;
  parentId: string | null;
  children: AdminCategory[];
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DEACTIVATED';
  createdAt: string;
}

export interface AdminReport {
  id: string;
  targetType: 'PRODUCT' | 'SERVICE' | 'USER' | 'REVIEW';
  productId: string | null;
  serviceId: string | null;
  reviewId: string | null;
  targetUserId: string | null;
  reason: string;
  details: string | null;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export interface AdminDispute {
  id: string;
  orderId: string | null;
  bookingId: string | null;
  reason: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'CLOSED';
  refundAmount: string | null;
  createdAt: string;
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; firstName: string; lastName: string; role?: 'BUYER' | 'SELLER' }) =>
      request<AuthTokens>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<AuthTokens>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  },

  categories: {
    tree: (type?: CategoryType) => request<Category[]>(type ? `/categories?type=${type}` : '/categories'),
  },

  products: {
    search: (params: { q?: string; categoryId?: string; storeId?: string; sort?: string; limit?: number; offset?: number } = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][],
      ).toString();
      return request<SearchResult<ProductSummary>>(`/products${qs ? `?${qs}` : ''}`);
    },
    getBySlug: (slug: string) => request<ProductDetail>(`/products/${slug}`),
  },

  services: {
    search: (params: { q?: string; categoryId?: string; storeId?: string; locationType?: string; limit?: number; offset?: number } = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][],
      ).toString();
      return request<SearchResult<ServiceSummary>>(`/services${qs ? `?${qs}` : ''}`);
    },
    getBySlug: (slug: string) => request<ServiceDetail>(`/services/${slug}`),
  },

  cart: {
    get: () => request<Cart>('/cart', { auth: true }),
    addItem: (data: { productId: string; variantId?: string; quantity: number }) =>
      request<CartItem>('/cart/items', { method: 'POST', body: JSON.stringify(data), auth: true }),
    updateItem: (itemId: string, quantity: number) =>
      request<CartItem>(`/cart/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }), auth: true }),
    removeItem: (itemId: string) =>
      request<void>(`/cart/items/${itemId}`, { method: 'DELETE', auth: true }),
  },

  orders: {
    checkout: () => request<CheckoutResult>('/orders/checkout', { method: 'POST', auth: true }),
    mine: () => request<Order[]>('/orders/mine', { auth: true }),
    getOne: (id: string) => request<Order>(`/orders/${id}`, { auth: true }),
  },

  sellers: {
    getMyStore: () => request<SellerStore>('/sellers/me', { auth: true }),
    submitOnboarding: (data: OnboardingInput) =>
      request<SellerStore>('/sellers/onboarding', { method: 'POST', body: JSON.stringify(data), auth: true }),
    getDashboardSummary: () => request<DashboardSummary>('/sellers/dashboard/summary', { auth: true }),
  },

  sellerProducts: {
    mine: () => request<ProductSummary[]>('/products/mine', { auth: true }),
    create: (data: CreateProductInput) =>
      request<ProductDetail>('/products', { method: 'POST', body: JSON.stringify(data), auth: true }),
    updateStatus: (id: string, status: string) =>
      request<ProductDetail>(`/products/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }), auth: true }),
  },

  sellerServices: {
    mine: () => request<ServiceSummary[]>('/services/mine', { auth: true }),
    create: (data: CreateServiceInput) =>
      request<ServiceDetail>('/services', { method: 'POST', body: JSON.stringify(data), auth: true }),
    updateStatus: (id: string, status: string) =>
      request<ServiceDetail>(`/services/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }), auth: true }),
    setAvailability: (id: string, slots: { dayOfWeek: number; startTime: string; endTime: string }[]) =>
      request<void>(`/services/${id}/availability`, { method: 'PATCH', body: JSON.stringify({ slots }), auth: true }),
  },

  bookings: {
    create: (data: { serviceId: string; scheduledStart: string; customerNotes?: string }) =>
      request<BookingResult>('/bookings', { method: 'POST', body: JSON.stringify(data), auth: true }),
    mine: () => request<Booking[]>('/bookings/mine', { auth: true }),
    updateStatus: (id: string, status: string) =>
      request<Booking>(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }), auth: true }),
  },

  reviews: {
    listForTarget: (params: { productId?: string; serviceId?: string; storeId?: string }) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][],
      ).toString();
      return request<ReviewList>(`/reviews${qs ? `?${qs}` : ''}`);
    },
    create: (data: { targetType: 'PRODUCT' | 'SERVICE' | 'SELLER'; productId?: string; serviceId?: string; storeId?: string; rating: number; body?: string }) =>
      request<Review>('/reviews', { method: 'POST', body: JSON.stringify(data), auth: true }),
  },

  stores: {
    getBySlug: (slug: string) => request<StoreProfile>(`/stores/${slug}`),
  },

  payments: {
    // Asks the backend to check with the payment provider what happened to a
    // payment and update the order/booking accordingly.
    verify: (reference: string) =>
      request<PaymentVerification>(`/payments/verify?reference=${encodeURIComponent(reference)}`, { auth: true }),
  },

  messaging: {
    start: (data: { storeId: string; orderId?: string; bookingId?: string; message: string }) =>
      request<Conversation>('/messaging/conversations', { method: 'POST', body: JSON.stringify(data), auth: true }),
    listMineAsBuyer: () => request<ConversationSummary[]>('/messaging/conversations', { auth: true }),
    listMineAsSeller: () => request<ConversationSummary[]>('/messaging/conversations/seller', { auth: true }),
    get: (id: string) => request<Conversation>(`/messaging/conversations/${id}`, { auth: true }),
    sendMessage: (id: string, body: string) =>
      request<Message>(`/messaging/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }), auth: true }),
  },

  admin: {
    analytics: () => request<AdminAnalytics>('/admin/analytics/summary', { auth: true }),

    pendingSellers: () => request<PendingStore[]>('/sellers/onboarding/pending', { auth: true }),
    approveSeller: (storeId: string) =>
      request<unknown>(`/sellers/onboarding/${storeId}/approve`, { method: 'POST', auth: true }),
    rejectSeller: (storeId: string, reason: string) =>
      request<unknown>(`/sellers/onboarding/${storeId}/reject`, { method: 'POST', body: JSON.stringify({ reason }), auth: true }),

    categories: () => request<AdminCategory[]>('/categories/admin', { auth: true }),
    createCategory: (data: { name: string; parentId?: string; type?: CategoryType }) =>
      request<AdminCategory>('/categories', { method: 'POST', body: JSON.stringify(data), auth: true }),
    setCategoryActive: (id: string, active: boolean) =>
      request<AdminCategory>(`/categories/${id}/${active ? 'activate' : 'deactivate'}`, { method: 'PATCH', auth: true }),

    users: (params: { q?: string; role?: string; status?: string } = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v) as [string, string][],
      ).toString();
      return request<AdminUser[]>(`/admin/users${qs ? `?${qs}` : ''}`, { auth: true });
    },
    suspendUser: (id: string, reason?: string) =>
      request<unknown>(`/admin/users/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ reason }), auth: true }),
    reactivateUser: (id: string) =>
      request<unknown>(`/admin/users/${id}/reactivate`, { method: 'PATCH', auth: true }),

    reports: (status?: string) =>
      request<AdminReport[]>(`/admin/reports${status ? `?status=${status}` : ''}`, { auth: true }),
    resolveReport: (id: string, status: 'RESOLVED' | 'DISMISSED', resolutionNotes: string) =>
      request<unknown>(`/admin/reports/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ status, resolutionNotes }), auth: true }),

    disputes: (status?: string) =>
      request<AdminDispute[]>(`/admin/disputes${status ? `?status=${status}` : ''}`, { auth: true }),
    resolveDispute: (id: string, data: { status: 'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'CLOSED'; resolutionNotes: string; refundAmount?: number }) =>
      request<unknown>(`/admin/disputes/${id}/resolve`, { method: 'PATCH', body: JSON.stringify(data), auth: true }),
  },

  // Still no frontend for the admin's read-only cross-cutting list views
  // (all products/services/orders/bookings/reviews) or direct refunds
  // outside a dispute — the backend endpoints exist, see README.
};
