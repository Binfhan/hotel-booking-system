import type {
  AddonServiceType,
  AuthResponse,
  BookingAction,
  BookingItem,
  CreateOrUpdateRoomCategoryPayload,
  CreateOrUpdateRoomPayload,
  CreateOrUpdateVoucherPayload,
  DashboardStats,
  NotificationItem,
  PaymentMethodType,
  PaymentStatus,
  PriceBreakdown,
  RoleType,
  RoomCategoryItem,
  RoomFilterParams,
  RoomItem,
  UserDetailItem,
  UserItem,
  VoucherItem
} from '@/types/hotel'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage.getItem('hotel_jwt_token')
}

const requestApi = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> | undefined)
    }
  })

  if (!response.ok) {
    let errorMessage = `Lỗi HTTP ${response.status}`
    try {
      const errBody = (await response.json()) as { message?: string }
      if (errBody.message) {
        errorMessage = errBody.message
      }
    } catch {
      // Fallback to status code message
    }
    throw new Error(errorMessage)
  }

  return (await response.json()) as T
}

export const formatVnd = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount || 0)
}

export const formatDateVn = (dateStr?: string | null): string => {
  if (!dateStr) {
    return ''
  }
  const clean = dateStr.split('T')[0]
  const parts = clean.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

export const hotelApi = {
  login: (email: string, password: string): Promise<AuthResponse> =>
    requestApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (
    fullName: string,
    email: string,
    password: string,
    phone: string
  ): Promise<AuthResponse> =>
    requestApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, phone })
    }),

  getRooms: (params?: RoomFilterParams): Promise<RoomItem[]> => {
    const search = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          search.append(key, value)
        }
      })
    }
    const queryString = search.toString()
    return requestApi<RoomItem[]>(
      `/rooms${queryString ? `?${queryString}` : ''}`
    )
  },

  getRoomById: (id: number): Promise<RoomItem> =>
    requestApi<RoomItem>(`/rooms/${id}`),

  getRoomCategories: (): Promise<RoomCategoryItem[]> =>
    requestApi<RoomCategoryItem[]>('/room-categories'),

  getActiveVouchers: (): Promise<VoucherItem[]> =>
    requestApi<VoucherItem[]>('/vouchers'),

  previewBookingPrice: (payload: {
    roomId: number
    checkInDate: string
    checkOutDate: string
    guestCount: number
    addonServices: AddonServiceType[]
    voucherCode?: string
  }): Promise<PriceBreakdown> =>
    requestApi<PriceBreakdown>('/bookings/preview', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  createBooking: (payload: {
    roomId: number
    checkInDate: string
    checkOutDate: string
    guestCount: number
    addonServices: AddonServiceType[]
    voucherCode?: string
    paymentMethod: PaymentMethodType
    specialRequests?: string
  }): Promise<BookingItem> =>
    requestApi<BookingItem>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMyBookings: (): Promise<BookingItem[]> =>
    requestApi<BookingItem[]>('/bookings/my'),

  cancelMyBooking: (bookingId: number): Promise<BookingItem> =>
    requestApi<BookingItem>(`/bookings/${bookingId}/cancel`, {
      method: 'PATCH'
    }),

  getMyNotifications: (): Promise<NotificationItem[]> =>
    requestApi<NotificationItem[]>('/bookings/notifications'),

  markNotificationAsRead: (id: number): Promise<NotificationItem> =>
    requestApi<NotificationItem>(`/bookings/notifications/${id}/read`, {
      method: 'PATCH'
    }),

  markAllNotificationsAsRead: (): Promise<NotificationItem[]> =>
    requestApi<NotificationItem[]>('/bookings/notifications/read-all', {
      method: 'PATCH'
    }),

  // =========================================================================
  // ADMIN ENDPOINTS
  // =========================================================================
  getDashboardStats: (): Promise<DashboardStats> =>
    requestApi<DashboardStats>('/admin/dashboard'),

  // Room Category CRUD
  getAllRoomCategoriesAdmin: (): Promise<RoomCategoryItem[]> =>
    requestApi<RoomCategoryItem[]>('/admin/room-categories'),

  createRoomCategoryAdmin: (
    payload: CreateOrUpdateRoomCategoryPayload
  ): Promise<RoomCategoryItem> =>
    requestApi<RoomCategoryItem>('/admin/room-categories', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateRoomCategoryAdmin: (
    id: number,
    payload: CreateOrUpdateRoomCategoryPayload
  ): Promise<RoomCategoryItem> =>
    requestApi<RoomCategoryItem>(`/admin/room-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteRoomCategoryAdmin: (id: number): Promise<{ message: string }> =>
    requestApi<{ message: string }>(`/admin/room-categories/${id}`, {
      method: 'DELETE'
    }),

  // Room CRUD
  createRoom: (payload: CreateOrUpdateRoomPayload): Promise<RoomItem> =>
    requestApi<RoomItem>('/admin/rooms', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateRoom: (
    id: number,
    payload: CreateOrUpdateRoomPayload
  ): Promise<RoomItem> =>
    requestApi<RoomItem>(`/admin/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteRoom: (id: number): Promise<{ message: string }> =>
    requestApi<{ message: string }>(`/admin/rooms/${id}`, {
      method: 'DELETE'
    }),

  // Voucher CRUD
  getAllVouchersAdmin: (): Promise<VoucherItem[]> =>
    requestApi<VoucherItem[]>('/admin/vouchers'),

  createVoucherAdmin: (
    payload: CreateOrUpdateVoucherPayload
  ): Promise<VoucherItem> =>
    requestApi<VoucherItem>('/admin/vouchers', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateVoucherAdmin: (
    id: number,
    payload: CreateOrUpdateVoucherPayload
  ): Promise<VoucherItem> =>
    requestApi<VoucherItem>(`/admin/vouchers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteVoucherAdmin: (id: number): Promise<{ message: string }> =>
    requestApi<{ message: string }>(`/admin/vouchers/${id}`, {
      method: 'DELETE'
    }),

  // Booking & Payment Admin
  getAllBookingsAdmin: (): Promise<BookingItem[]> =>
    requestApi<BookingItem[]>('/admin/bookings'),

  updateBookingStateAdmin: (
    bookingId: number,
    action: BookingAction
  ): Promise<BookingItem> =>
    requestApi<BookingItem>(`/admin/bookings/${bookingId}/state`, {
      method: 'PATCH',
      body: JSON.stringify({ action })
    }),

  updatePaymentStatusAdmin: (
    bookingId: number,
    paymentStatus: PaymentStatus
  ): Promise<BookingItem> =>
    requestApi<BookingItem>(`/admin/bookings/${bookingId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus })
    }),

  // User Admin CRUD + Detail
  getAllUsersAdmin: (): Promise<UserItem[]> =>
    requestApi<UserItem[]>('/admin/users'),

  getUserDetailAdmin: (id: number): Promise<UserDetailItem> =>
    requestApi<UserDetailItem>(`/admin/users/${id}`),

  createUserAdmin: (payload: {
    fullName: string
    email: string
    password: string
    phone?: string
    role?: RoleType
  }): Promise<UserItem> =>
    requestApi<UserItem>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateUserAdmin: (
    id: number,
    payload: {
      fullName?: string
      email?: string
      phone?: string
      password?: string
      role?: RoleType
      locked?: boolean
    }
  ): Promise<UserItem> =>
    requestApi<UserItem>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteUserAdmin: (id: number): Promise<{ message: string }> =>
    requestApi<{ message: string }>(`/admin/users/${id}`, {
      method: 'DELETE'
    }),

  toggleLockUserAdmin: (id: number): Promise<UserItem> =>
    requestApi<UserItem>(`/admin/users/${id}/toggle-lock`, {
      method: 'PATCH'
    }),

  resolveImageUrl: (url: string): Promise<{ url: string }> =>
    requestApi<{ url: string }>(
      `/rooms/resolve-image?url=${encodeURIComponent(url)}`
    )
}
