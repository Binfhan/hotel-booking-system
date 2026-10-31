export type RoleType = 'ROLE_USER' | 'ROLE_ADMIN'

export type RoomType = string

export type RoomStatus = 'AVAILABLE' | 'MAINTENANCE' | 'OCCUPIED'

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'

export type BookingAction = 'CONFIRM' | 'CHECK_IN' | 'CHECK_OUT' | 'CANCEL'

export type AddonServiceType =
  | 'BREAKFAST'
  | 'AIRPORT_PICKUP'
  | 'EXTRA_BED'
  | 'SPA'

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'SEASONAL'

export type PaymentMethodType = 'CREDIT_CARD' | 'E_WALLET' | 'PAY_AT_HOTEL'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export interface AuthResponse {
  token: string
  userId: number
  fullName: string
  email: string
  phone: string
  role: RoleType
}

export interface UserItem {
  id: number
  fullName: string
  email: string
  phone: string
  role: RoleType
  locked: boolean
  createdAt: string
}

export interface UserDetailItem {
  id: number
  fullName: string
  email: string
  phone: string
  role: RoleType
  locked: boolean
  createdAt: string
  totalBookings: number
  totalSpent: number
  bookings: BookingItem[]
}

export interface RoomCategoryItem {
  id: number
  code: string
  name: string
  defaultPrice: number
  defaultCapacity: number
  defaultBedType: string
  defaultDescription: string
  defaultAmenities: string
  defaultImageUrl: string
}

export interface CreateOrUpdateRoomCategoryPayload {
  code: string
  name: string
  defaultPrice: number
  defaultCapacity: number
  defaultBedType: string
  defaultDescription?: string
  defaultAmenities?: string
  defaultImageUrl?: string
}

export interface RoomItem {
  id: number
  roomNumber: string
  name: string
  roomType: string
  location: string
  pricePerNight: number
  capacity: number
  bedType: string
  status: RoomStatus
  description: string
  images: string[]
  amenities: string[]
}

export interface CreateOrUpdateRoomPayload {
  roomNumber: string
  name: string
  roomType: string
  location: string
  pricePerNight?: number
  capacity?: number
  bedType?: string
  status?: RoomStatus
  description?: string
  images?: string[]
  amenities?: string[]
}

export interface VoucherItem {
  id: number
  code: string
  discountType: DiscountType
  discountValue: number
  minOrderValue: number
  applicableRoomTypes: string
  validFrom: string
  validTo: string
  active: boolean
}

export interface CreateOrUpdateVoucherPayload {
  code: string
  discountType: DiscountType
  discountValue: number
  minOrderValue?: number
  applicableRoomTypes: string
  validFrom: string
  validTo: string
  active?: boolean
}

export interface BookingServiceItem {
  serviceType: AddonServiceType
  serviceName: string
  price: number
}

export interface PriceBreakdown {
  roomId: number
  roomName: string
  nights: number
  guestCount: number
  baseRoomCost: number
  addonServicesCost: number
  subTotal: number
  appliedVoucherCode: string | null
  discountAmount: number
  totalAmount: number
  decoratorDescription: string
  addonItems: BookingServiceItem[]
}

export interface PaymentInfo {
  id: number
  paymentMethod: PaymentMethodType
  paymentStatus: PaymentStatus
  transactionRef: string
  amount: number
  paidAt: string | null
}

export interface BookingItem {
  id: number
  bookingCode: string
  userId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  roomId: number
  roomNumber: string
  roomName: string
  roomType: string
  roomLocation: string
  roomPrimaryImage: string | null
  checkInDate: string
  checkOutDate: string
  nights: number
  guestCount: number
  baseRoomCost: number
  addonServicesCost: number
  voucherCode: string | null
  discountAmount: number
  totalAmount: number
  costBreakdownDescription: string
  status: BookingStatus
  specialRequests: string | null
  addonServices: BookingServiceItem[]
  payment: PaymentInfo | null
  createdAt: string
}

export interface NotificationItem {
  id: number
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface DashboardStats {
  totalRooms: number
  availableRooms: number
  maintenanceRooms: number
  totalCustomers: number
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  checkedInBookings: number
  checkedOutBookings: number
  cancelledBookings: number
  totalRevenue: number
  recentBookings: BookingItem[]
}

export interface RoomFilterParams {
  keyword?: string
  location?: string
  roomType?: string
  minGuests?: string
  minPrice?: string
  maxPrice?: string
  checkInDate?: string
  checkOutDate?: string
}
