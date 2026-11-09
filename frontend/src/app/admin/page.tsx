'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDateVn, formatVnd, hotelApi } from '@/lib/api'
import { VnDateInput } from '@/components/VnDateInput'
import { useAuth } from '@/context/AuthContext'
import type {
  BookingAction,
  BookingItem,
  CreateOrUpdateRoomCategoryPayload,
  CreateOrUpdateRoomPayload,
  CreateOrUpdateVoucherPayload,
  DashboardStats,
  DiscountType,
  PaymentStatus,
  RoleType,
  RoomCategoryItem,
  RoomItem,
  RoomStatus,
  UserDetailItem,
  UserItem,
  VoucherItem
} from '@/types/hotel'

type AdminSection =
  | 'dashboard'
  | 'bookings'
  | 'rooms'
  | 'categories'
  | 'vouchers'
  | 'users'

const bookingBadgeColor = (status: string): string => {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'CHECKED_IN':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'CHECKED_OUT':
      return 'bg-slate-200 text-slate-800 border-slate-300'
    default:
      return 'bg-amber-100 text-amber-800 border-amber-200'
  }
}

const getTodayIso = (): string => new Date().toISOString().split('T')[0]

const getFutureIso = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const AdminDashboardPage = (): React.JSX.Element => {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [rooms, setRooms] = useState<RoomItem[]>([])
  const [categories, setCategories] = useState<RoomCategoryItem[]>([])
  const [vouchers, setVouchers] = useState<VoucherItem[]>([])
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])

  const [statusMessage, setStatusMessage] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // =========================================================================
  // 1. BOOKING FILTER & DETAIL MODAL STATE
  // =========================================================================
  const [bookingSearch, setBookingSearch] = useState<string>('')
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('ALL')
  const [bookingPaymentFilter, setBookingPaymentFilter] =
    useState<string>('ALL')
  const [detailBooking, setDetailBooking] = useState<BookingItem | null>(null)

  // =========================================================================
  // 2. ROOM FILTER & MODAL STATE
  // =========================================================================
  const [roomSearch, setRoomSearch] = useState<string>('')
  const [roomCategoryFilter, setRoomCategoryFilter] = useState<string>('ALL')
  const [roomStatusFilter, setRoomStatusFilter] = useState<string>('ALL')
  const [roomMinPriceFilter, setRoomMinPriceFilter] = useState<string>('')
  const [roomMaxPriceFilter, setRoomMaxPriceFilter] = useState<string>('')

  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false)
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null)
  const [roomNumber, setRoomNumber] = useState<string>('')
  const [roomName, setRoomName] = useState<string>('')
  const [roomType, setRoomType] = useState<string>('STANDARD')
  const [roomLocation, setRoomLocation] = useState<string>('Đà Nẵng')
  const [pricePerNight, setPricePerNight] = useState<string>('')
  const [capacity, setCapacity] = useState<string>('')
  const [bedType, setBedType] = useState<string>('')
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('AVAILABLE')
  const [description, setDescription] = useState<string>('')
  const [imageUrlsText, setImageUrlsText] = useState<string>('')
  const [amenitiesText, setAmenitiesText] = useState<string>('')
  const [detailRoom, setDetailRoom] = useState<RoomItem | null>(null)

  // =========================================================================
  // 3. ROOM CATEGORY (HẠNG PHÒNG) MODAL STATE
  // =========================================================================
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null
  )
  const [catCode, setCatCode] = useState<string>('')
  const [catName, setCatName] = useState<string>('')
  const [catDefaultPrice, setCatDefaultPrice] = useState<string>('1000000')
  const [catDefaultCapacity, setCatDefaultCapacity] = useState<string>('2')
  const [catDefaultBedType, setCatDefaultBedType] =
    useState<string>('1 Queen Bed')
  const [catDefaultDescription, setCatDefaultDescription] = useState<string>('')
  const [catDefaultAmenities, setCatDefaultAmenities] = useState<string>(
    'Wi-Fi tốc độ cao, Điều hòa 2 chiều, Smart TV'
  )
  const [catDefaultImageUrl, setCatDefaultImageUrl] = useState<string>('')

  // =========================================================================
  // 4. VOUCHER MODAL STATE
  // =========================================================================
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState<boolean>(false)
  const [editingVoucherId, setEditingVoucherId] = useState<number | null>(null)
  const [vCode, setVCode] = useState<string>('')
  const [vDiscountType, setVDiscountType] =
    useState<DiscountType>('PERCENTAGE')
  const [vDiscountValue, setVDiscountValue] = useState<string>('10')
  const [vMinOrderValue, setVMinOrderValue] = useState<string>('500000')
  const [vApplyAllRooms, setVApplyAllRooms] = useState<boolean>(true)
  const [vSelectedRoomTypes, setVSelectedRoomTypes] = useState<string[]>([])
  const [vValidFrom, setVValidFrom] = useState<string>(getTodayIso())
  const [vValidTo, setVValidTo] = useState<string>(getFutureIso(90))
  const [vActive, setVActive] = useState<boolean>(true)

  // =========================================================================
  // 5. USER FILTER & MODAL STATE
  // =========================================================================
  const [userSearch, setUserSearch] = useState<string>('')
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL')
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [uFullName, setUFullName] = useState<string>('')
  const [uEmail, setUEmail] = useState<string>('')
  const [uPhone, setUPhone] = useState<string>('')
  const [uPassword, setUPassword] = useState<string>('')
  const [uRole, setURole] = useState<RoleType>('ROLE_USER')
  const [detailUser, setDetailUser] = useState<UserDetailItem | null>(null)

  const loadAllAdminData = useCallback(async (): Promise<void> => {
    try {
      const [
        dashboardData,
        roomsData,
        categoriesData,
        vouchersData,
        bookingsData,
        usersData
      ] = await Promise.all([
        hotelApi.getDashboardStats(),
        hotelApi.getRooms(),
        hotelApi
          .getAllRoomCategoriesAdmin()
          .catch(() => hotelApi.getRoomCategories().catch(() => [])),
        hotelApi
          .getAllVouchersAdmin()
          .catch(() => hotelApi.getActiveVouchers().catch(() => [])),
        hotelApi.getAllBookingsAdmin(),
        hotelApi.getAllUsersAdmin()
      ])
      setStats(dashboardData)
      setRooms(roomsData)
      setCategories(categoriesData)
      setVouchers(vouchersData)
      setBookings(bookingsData)
      setUsers(usersData)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể tải dữ liệu Quản trị'
      )
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      if (!user || user.role !== 'ROLE_ADMIN') {
        router.push('/login')
        return
      }
      void loadAllAdminData()
    }
  }, [user, isLoading, router, loadAllAdminData])

  const clearNotifications = (): void => {
    setStatusMessage('')
    setErrorMessage('')
  }

  // =========================================================================
  // FILTERED LISTS
  // =========================================================================
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (bookingStatusFilter !== 'ALL' && b.status !== bookingStatusFilter) {
        return false
      }
      if (
        bookingPaymentFilter !== 'ALL' &&
        b.payment?.paymentStatus !== bookingPaymentFilter
      ) {
        return false
      }
      if (bookingSearch.trim()) {
        const kw = bookingSearch.toLowerCase()
        const match =
          b.bookingCode.toLowerCase().includes(kw) ||
          b.customerName.toLowerCase().includes(kw) ||
          b.customerEmail.toLowerCase().includes(kw) ||
          b.roomNumber.toLowerCase().includes(kw) ||
          b.roomName.toLowerCase().includes(kw)
        if (!match) {
          return false
        }
      }
      return true
    })
  }, [bookings, bookingStatusFilter, bookingPaymentFilter, bookingSearch])

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (
        roomCategoryFilter !== 'ALL' &&
        r.roomType.toUpperCase() !== roomCategoryFilter.toUpperCase()
      ) {
        return false
      }
      if (roomStatusFilter !== 'ALL' && r.status !== roomStatusFilter) {
        return false
      }
      if (
        roomMinPriceFilter &&
        r.pricePerNight < Number(roomMinPriceFilter)
      ) {
        return false
      }
      if (
        roomMaxPriceFilter &&
        r.pricePerNight > Number(roomMaxPriceFilter)
      ) {
        return false
      }
      if (roomSearch.trim()) {
        const kw = roomSearch.toLowerCase()
        const match =
          r.roomNumber.toLowerCase().includes(kw) ||
          r.name.toLowerCase().includes(kw) ||
          r.location.toLowerCase().includes(kw)
        if (!match) {
          return false
        }
      }
      return true
    })
  }, [
    rooms,
    roomCategoryFilter,
    roomStatusFilter,
    roomMinPriceFilter,
    roomMaxPriceFilter,
    roomSearch
  ])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) {
        return false
      }
      if (userSearch.trim()) {
        const kw = userSearch.toLowerCase()
        const match =
          u.fullName.toLowerCase().includes(kw) ||
          u.email.toLowerCase().includes(kw) ||
          (u.phone || '').toLowerCase().includes(kw)
        if (!match) {
          return false
        }
      }
      return true
    })
  }, [users, userRoleFilter, userSearch])

  // =========================================================================
  // HANDLERS: BOOKINGS
  // =========================================================================
  const handleBookingStateAction = async (
    bookingId: number,
    action: BookingAction
  ): Promise<void> => {
    clearNotifications()
    try {
      const updated = await hotelApi.updateBookingStateAdmin(bookingId, action)
      if (action === 'CANCEL') {
        setStatusMessage(
          `Đã hủy và xóa đơn đặt phòng #${updated.bookingCode} khỏi danh sách (State & Observer Pattern).`
        )
        if (detailBooking?.id === bookingId) {
          setDetailBooking(null)
        }
      } else {
        setStatusMessage(
          `Đã thực hiện [${action}] -> Đơn #${updated.bookingCode} chuyển sang trạng thái ${updated.status}.`
        )
        if (detailBooking?.id === bookingId) {
          setDetailBooking(updated)
        }
      }
      await loadAllAdminData()
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Lỗi chuyển trạng thái Booking'
      )
    }
  }

  const handleUpdatePaymentStatus = async (
    bookingId: number,
    paymentStatus: PaymentStatus
  ): Promise<void> => {
    clearNotifications()
    try {
      const updated = await hotelApi.updatePaymentStatusAdmin(
        bookingId,
        paymentStatus
      )
      setStatusMessage(
        `Đã cập nhật trạng thái thanh toán đơn #${updated.bookingCode} thành ${paymentStatus}.`
      )
      if (detailBooking?.id === bookingId) {
        setDetailBooking(updated)
      }
      await loadAllAdminData()
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Lỗi cập nhật thanh toán'
      )
    }
  }

  // =========================================================================
  // HANDLERS: ROOMS
  // =========================================================================
  const applyCategoryDefaultsToRoomForm = (categoryCode: string): void => {
    setRoomType(categoryCode)
    const found = categories.find(
      (c) => c.code.toUpperCase() === categoryCode.toUpperCase()
    )
    if (found && !editingRoomId) {
      setPricePerNight(String(found.defaultPrice))
      setCapacity(String(found.defaultCapacity))
      setBedType(found.defaultBedType)
      setDescription(found.defaultDescription || '')
      setAmenitiesText(found.defaultAmenities || '')
      setImageUrlsText(found.defaultImageUrl || '')
    }
  }

  const openAddRoomModal = (): void => {
    clearNotifications()
    setEditingRoomId(null)
    setRoomNumber('')
    setRoomName('')
    const defaultCat = categories[0]?.code || 'STANDARD'
    setRoomType(defaultCat)
    setRoomLocation('Đà Nẵng')
    setRoomStatus('AVAILABLE')
    const found = categories.find((c) => c.code === defaultCat)
    setPricePerNight(found ? String(found.defaultPrice) : '')
    setCapacity(found ? String(found.defaultCapacity) : '')
    setBedType(found ? found.defaultBedType : '')
    setDescription(found?.defaultDescription || '')
    setAmenitiesText(found?.defaultAmenities || '')
    setImageUrlsText(found?.defaultImageUrl || '')
    setIsRoomModalOpen(true)
  }

  const openEditRoomModal = (room: RoomItem): void => {
    clearNotifications()
    setEditingRoomId(room.id)
    setRoomNumber(room.roomNumber)
    setRoomName(room.name)
    setRoomType(room.roomType)
    setRoomLocation(room.location)
    setPricePerNight(String(room.pricePerNight))
    setCapacity(String(room.capacity))
    setBedType(room.bedType)
    setRoomStatus(room.status)
    setDescription(room.description || '')
    setImageUrlsText(room.images.join('\n'))
    setAmenitiesText(room.amenities.join(', '))
    setIsRoomModalOpen(true)
  }

  const compressImageFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const rawResult = typeof reader.result === 'string' ? reader.result : ''
        if (!rawResult) {
          resolve('')
          return
        }
        const img = new window.Image()
        img.onload = () => {
          try {
            const maxDim = 1280
            let { width, height } = img
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width)
                width = maxDim
              } else {
                width = Math.round((width * maxDim) / height)
                height = maxDim
              }
            }
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height)
              resolve(canvas.toDataURL('image/jpeg', 0.85))
              return
            }
          } catch {
            // Fallback to raw DataURL
          }
          resolve(rawResult)
        }
        img.onerror = () => resolve(rawResult)
        img.src = rawResult
      }
      reader.readAsDataURL(file)
    })
  }

  const resolveShareUrlsInText = async (rawText: string): Promise<string> => {
    const lines = rawText
      .split(/\n|,(?!\/)/)
      .map((s) => s.trim())
      .filter(Boolean)
      .reduce<string[]>((acc, item) => {
        if (
          item.startsWith('base64,') &&
          acc.length > 0 &&
          acc[acc.length - 1].startsWith('data:image/')
        ) {
          acc[acc.length - 1] = `${acc[acc.length - 1]},${item}`
        } else {
          acc.push(item)
        }
        return acc
      }, [])

    const resolved = await Promise.all(
      lines.map(async (line) => {
        if (
          line.startsWith('http') &&
          !line.includes('i.ibb.co/') &&
          !line.includes('images.unsplash.com') &&
          (line.includes('ibb.co/') ||
            line.includes('imgur.com/') ||
            line.includes('postimg.cc/') ||
            line.includes('drive.google.com/'))
        ) {
          try {
            const res = await hotelApi.resolveImageUrl(line)
            return res.url || line
          } catch {
            return line
          }
        }
        return line
      })
    )
    return resolved.join('\n')
  }

  const handleRoomLocalFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const files = e.target.files
    if (!files || files.length === 0) {
      return
    }
    const fileList = Array.from(files)
    e.target.value = ''
    for (const file of fileList) {
      const dataUrl = await compressImageFileToDataUrl(file)
      if (dataUrl) {
        setImageUrlsText((prev) =>
          prev.trim() ? `${prev.trim()}\n${dataUrl}` : dataUrl
        )
      }
    }
  }

  const handleCategoryLocalFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    e.target.value = ''
    const dataUrl = await compressImageFileToDataUrl(file)
    if (dataUrl) {
      setCatDefaultImageUrl(dataUrl)
    }
  }

  const handleSaveRoom = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    clearNotifications()

    const resolvedText = await resolveShareUrlsInText(imageUrlsText)
    setImageUrlsText(resolvedText)

    const images = resolvedText
      .split(/\n|,(?!\/)/)
      .map((s) => s.trim())
      .filter(Boolean)
      .reduce<string[]>((acc, item) => {
        if (item.startsWith('base64,') && acc.length > 0 && acc[acc.length - 1].startsWith('data:image/')) {
          acc[acc.length - 1] = `${acc[acc.length - 1]},${item}`
        } else {
          acc.push(item)
        }
        return acc
      }, [])
    const amenities = amenitiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload: CreateOrUpdateRoomPayload = {
      roomNumber,
      name: roomName,
      roomType,
      location: roomLocation,
      pricePerNight: pricePerNight ? Number(pricePerNight) : undefined,
      capacity: capacity ? Number(capacity) : undefined,
      bedType: bedType || undefined,
      status: roomStatus,
      description: description || undefined,
      images: images.length > 0 ? images : undefined,
      amenities: amenities.length > 0 ? amenities : undefined
    }

    try {
      if (editingRoomId) {
        await hotelApi.updateRoom(editingRoomId, payload)
        setStatusMessage(
          `Đã cập nhật thông tin phòng #${roomNumber} thành công.`
        )
      } else {
        await hotelApi.createRoom(payload)
        setStatusMessage(
          `Đã thêm phòng mới #${roomNumber} (Hạng ${roomType}) thành công.`
        )
      }
      setIsRoomModalOpen(false)
      await loadAllAdminData()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi lưu phòng')
    }
  }

  const handleDeleteRoom = async (id: number): Promise<void> => {
    clearNotifications()
    try {
      await hotelApi.deleteRoom(id)
      setStatusMessage('Đã xóa phòng thành công.')
      await loadAllAdminData()
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Không thể xóa phòng đang có đơn đặt phòng'
      )
    }
  }

  // =========================================================================
  // HANDLERS: ROOM CATEGORIES (HẠNG PHÒNG)
  // =========================================================================
  const openAddCategoryModal = (): void => {
    clearNotifications()
    setEditingCategoryId(null)
    setCatCode('')
    setCatName('')
    setCatDefaultPrice('1200000')
    setCatDefaultCapacity('2')
    setCatDefaultBedType('1 King Bed (1m8 x 2m)')
    setCatDefaultDescription('')
    setCatDefaultAmenities(
      'Wi-Fi tốc độ cao, Điều hòa 2 chiều, Smart TV 55 inch, Minibar'
    )
    setCatDefaultImageUrl(
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80'
    )
    setIsCategoryModalOpen(true)
  }

  const openEditCategoryModal = (cat: RoomCategoryItem): void => {
    clearNotifications()
    setEditingCategoryId(cat.id)
    setCatCode(cat.code)
    setCatName(cat.name)
    setCatDefaultPrice(String(cat.defaultPrice))
    setCatDefaultCapacity(String(cat.defaultCapacity))
    setCatDefaultBedType(cat.defaultBedType)
    setCatDefaultDescription(cat.defaultDescription || '')
    setCatDefaultAmenities(cat.defaultAmenities || '')
    setCatDefaultImageUrl(cat.defaultImageUrl || '')
    setIsCategoryModalOpen(true)
  }

  const handleSaveCategory = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    clearNotifications()
    const resolvedCatUrl = catDefaultImageUrl
      ? await resolveShareUrlsInText(catDefaultImageUrl)
      : ''
    setCatDefaultImageUrl(resolvedCatUrl)
    const payload: CreateOrUpdateRoomCategoryPayload = {
      code: catCode.trim().toUpperCase(),
      name: catName.trim(),
      defaultPrice: Number(catDefaultPrice),
      defaultCapacity: Number(catDefaultCapacity),
      defaultBedType: catDefaultBedType.trim(),
      defaultDescription: catDefaultDescription,
      defaultAmenities: catDefaultAmenities,
      defaultImageUrl: resolvedCatUrl
    }

    try {
      if (editingCategoryId) {
        await hotelApi.updateRoomCategoryAdmin(editingCategoryId, payload)
        setStatusMessage(
          `Đã cập nhật hạng phòng ${payload.code} và đồng bộ sang Quản lý Phòng & Voucher.`
        )
      } else {
        await hotelApi.createRoomCategoryAdmin(payload)
        setStatusMessage(
          `Đã thêm hạng phòng mới ${payload.code} (${payload.name}) thành công.`
        )
      }
      setIsCategoryModalOpen(false)
      await loadAllAdminData()
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Lỗi lưu hạng phòng'
      )
    }
  }

  const handleDeleteCategory = async (id: number): Promise<void> => {
    clearNotifications()
    try {
      await hotelApi.deleteRoomCategoryAdmin(id)
      setStatusMessage('Đã xóa hạng phòng thành công.')
      await loadAllAdminData()
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể xóa hạng phòng này'
      )
    }
  }

  // =========================================================================
  // HANDLERS: VOUCHERS
  // =========================================================================
  const openAddVoucherModal = (): void => {
    clearNotifications()
    setEditingVoucherId(null)
    setVCode('')
    setVDiscountType('PERCENTAGE')
    setVDiscountValue('10')
    setVMinOrderValue('500000')
    setVApplyAllRooms(true)
    setVSelectedRoomTypes([])
    setVValidFrom(getTodayIso())
    setVValidTo(getFutureIso(90))
    setVActive(true)
    setIsVoucherModalOpen(true)
  }

  const openEditVoucherModal = (v: VoucherItem): void => {
    clearNotifications()
    setEditingVoucherId(v.id)
    setVCode(v.code)
    setVDiscountType(v.discountType)
    setVDiscountValue(String(v.discountValue))
    setVMinOrderValue(String(v.minOrderValue))
    const isAll =
      !v.applicableRoomTypes ||
      v.applicableRoomTypes.toUpperCase() === 'ALL'
    setVApplyAllRooms(isAll)
    setVSelectedRoomTypes(
      isAll
        ? []
        : v.applicableRoomTypes
            .split(',')
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean)
    )
    setVValidFrom(v.validFrom)
    setVValidTo(v.validTo)
    setVActive(v.active)
    setIsVoucherModalOpen(true)
  }

  const toggleVoucherRoomType = (code: string): void => {
    setVSelectedRoomTypes((prev) =>
      prev.includes(code)
        ? prev.filter((item) => item !== code)
        : [...prev, code]
    )
  }

  const handleSaveVoucher = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    clearNotifications()

    if (!vApplyAllRooms && vSelectedRoomTypes.length === 0) {
      setErrorMessage(
        'Vui lòng chọn ít nhất 1 hạng phòng hoặc chọn "Áp dụng cho Tất cả phòng".'
      )
      return
    }

    const applicableRoomTypes = vApplyAllRooms
      ? 'ALL'
      : vSelectedRoomTypes.join(', ')

    const payload: CreateOrUpdateVoucherPayload = {
      code: vCode.trim().toUpperCase(),
      discountType: vDiscountType,
      discountValue: Number(vDiscountValue),
      minOrderValue: Number(vMinOrderValue || 0),
      applicableRoomTypes,
      validFrom: vValidFrom,
      validTo: vValidTo,
      active: vActive
    }

    try {
      if (editingVoucherId) {
        await hotelApi.updateVoucherAdmin(editingVoucherId, payload)
        setStatusMessage(`Đã cập nhật voucher ${payload.code} thành công.`)
      } else {
        await hotelApi.createVoucherAdmin(payload)
        setStatusMessage(`Đã tạo voucher mới ${payload.code} thành công.`)
      }
      setIsVoucherModalOpen(false)
      await loadAllAdminData()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi lưu voucher')
    }
  }

  const handleDeleteVoucher = async (id: number): Promise<void> => {
    clearNotifications()
    try {
      await hotelApi.deleteVoucherAdmin(id)
      setStatusMessage('Đã xóa voucher thành công.')
      await loadAllAdminData()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi xóa voucher')
    }
  }

  // =========================================================================
  // HANDLERS: USERS
  // =========================================================================
  const openAddUserModal = (): void => {
    clearNotifications()
    setEditingUserId(null)
    setUFullName('')
    setUEmail('')
    setUPhone('')
    setUPassword('')
    setURole('ROLE_USER')
    setIsUserModalOpen(true)
  }

  const openEditUserModal = (u: UserItem): void => {
    clearNotifications()
    setEditingUserId(u.id)
    setUFullName(u.fullName)
    setUEmail(u.email)
    setUPhone(u.phone || '')
    setUPassword('')
    setURole(u.role)
    setIsUserModalOpen(true)
  }

  const handleSaveUser = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    clearNotifications()
    try {
      if (editingUserId) {
        await hotelApi.updateUserAdmin(editingUserId, {
          fullName: uFullName,
          email: uEmail,
          phone: uPhone,
          password: uPassword || undefined,
          role: uRole
        })
        setStatusMessage('Đã cập nhật thông tin người dùng thành công.')
      } else {
        await hotelApi.createUserAdmin({
          fullName: uFullName,
          email: uEmail,
          password: uPassword,
          phone: uPhone,
          role: uRole
        })
        setStatusMessage('Đã thêm người dùng mới thành công.')
      }
      setIsUserModalOpen(false)
      await loadAllAdminData()
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Lỗi lưu người dùng'
      )
    }
  }

  const handleDeleteUser = async (id: number): Promise<void> => {
    clearNotifications()
    try {
      await hotelApi.deleteUserAdmin(id)
      setStatusMessage('Đã xóa người dùng thành công.')
      if (detailUser?.id === id) {
        setDetailUser(null)
      }
      await loadAllAdminData()
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể xóa người dùng'
      )
    }
  }

  const handleToggleLockUser = async (id: number): Promise<void> => {
    clearNotifications()
    try {
      const updated = await hotelApi.toggleLockUserAdmin(id)
      setStatusMessage(
        `Đã ${updated.locked ? 'KHÓA' : 'MỞ KHÓA'} tài khoản ${updated.email}.`
      )
      await loadAllAdminData()
      if (detailUser?.id === id) {
        const refreshed = await hotelApi.getUserDetailAdmin(id)
        setDetailUser(refreshed)
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Lỗi khóa/mở khóa tài khoản'
      )
    }
  }

  const handleViewUserDetail = async (id: number): Promise<void> => {
    clearNotifications()
    try {
      const detail = await hotelApi.getUserDetailAdmin(id)
      setDetailUser(detail)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Lỗi tải chi tiết người dùng'
      )
    }
  }

  const sidebarItems: Array<{
    id: AdminSection
    icon: string
    label: string
    badge?: number
  }> = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard Thống kê' },
    {
      id: 'bookings',
      icon: '📅',
      label: 'Quản lý Đặt phòng',
      badge: bookings.length
    },
    { id: 'rooms', icon: '🏨', label: 'Quản lý Phòng', badge: rooms.length },
    {
      id: 'categories',
      icon: '🏷️',
      label: 'Hạng phòng (Loại phòng)',
      badge: categories.length
    },
    {
      id: 'vouchers',
      icon: '🎟️',
      label: 'Quản lý Voucher',
      badge: vouchers.length
    },
    {
      id: 'users',
      icon: '👥',
      label: 'Quản lý Người dùng',
      badge: users.length
    }
  ]

  return (
    <div className='flex min-h-screen bg-slate-100'>
      {/* =================================================================== */}
      {/* LEFT SIDEBAR (STANDALONE ADMIN WORKSPACE)                           */}
      {/* =================================================================== */}
      <aside className='fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-slate-900 text-white shadow-xl'>
        <div className='border-b border-slate-800 px-6 py-5'>
          <div className='flex items-center gap-3'>
            <span className='flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-extrabold text-white shadow'>
              HB
            </span>
            <div>
              <h1 className='text-base font-extrabold tracking-tight text-white'>
                Grand Hotel Admin
              </h1>
              <p className='text-xs text-slate-400'>
                Hệ thống Quản trị Đặt phòng
              </p>
            </div>
          </div>
        </div>

        <nav className='flex-1 space-y-1.5 px-3 py-5'>
          {sidebarItems.map((item) => {
            const active = activeSection === item.id
            return (
              <button
                key={item.id}
                type='button'
                onClick={() => {
                  clearNotifications()
                  setActiveSection(item.id)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-bold transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className='flex items-center gap-3'>
                  <span className='text-base'>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className='border-t border-slate-800 p-4 space-y-3'>
          <div className='rounded-xl bg-slate-800/80 p-3 text-xs'>
            <p className='font-bold text-white'>{user?.fullName}</p>
            <p className='truncate text-slate-400'>{user?.email}</p>
            <span className='mt-1.5 inline-block rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300'>
              QUẢN TRỊ VIÊN HỆ THỐNG
            </span>
          </div>

          <div className='grid grid-cols-2 gap-2'>
            <Link
              href='/'
              className='rounded-lg border border-slate-700 bg-slate-800 py-2 text-center text-xs font-semibold text-slate-200 transition hover:bg-slate-700'
            >
              🌐 Trang Khách
            </Link>
            <button
              type='button'
              onClick={() => {
                logout()
                router.push('/login')
              }}
              className='rounded-lg bg-red-600/90 py-2 text-xs font-semibold text-white transition hover:bg-red-600'
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* =================================================================== */}
      {/* MAIN CONTENT AREA                                                   */}
      {/* =================================================================== */}
      <div className='ml-72 flex-1 p-8 space-y-6'>
        {/* Top Status / Error Notifications */}
        {statusMessage && (
          <div className='flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-sm'>
            <span>✓ {statusMessage}</span>
            <button
              type='button'
              onClick={() => setStatusMessage('')}
              className='text-emerald-600 hover:text-emerald-900'
            >
              ✕
            </button>
          </div>
        )}
        {errorMessage && (
          <div className='flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 shadow-sm'>
            <span>⚠ {errorMessage}</span>
            <button
              type='button'
              onClick={() => setErrorMessage('')}
              className='text-red-600 hover:text-red-900'
            >
              ✕
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 1: DASHBOARD THỐNG KÊ                                     */}
        {/* ================================================================= */}
        {activeSection === 'dashboard' && stats && (
          <div className='space-y-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-2xl font-extrabold text-slate-900'>
                  Dashboard Thống kê Tổng quan
                </h2>
              </div>
              <button
                type='button'
                onClick={() => void loadAllAdminData()}
                className='rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50'
              >
                ↻ Làm mới số liệu
              </button>
            </div>

            {/* 4 KPI Cards */}
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
              <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                <span className='text-xs font-semibold text-slate-500'>
                  💰 Tổng Doanh thu Thực tế
                </span>
                <p className='mt-2 text-2xl font-extrabold text-indigo-600'>
                  {formatVnd(stats.totalRevenue)}
                </p>
                <span className='mt-1 block text-xs text-slate-400'>
                  Từ các đơn đã duyệt / lưu trú
                </span>
              </div>

              <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                <span className='text-xs font-semibold text-slate-500'>
                  🏨 Tổng số Phòng Khách sạn
                </span>
                <p className='mt-2 text-2xl font-extrabold text-slate-900'>
                  {stats.totalRooms} phòng
                </p>
                <span className='mt-1 block text-xs text-emerald-600'>
                  Sẵn sàng: {stats.availableRooms} • Bảo trì:{' '}
                  {stats.maintenanceRooms}
                </span>
              </div>

              <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                <span className='text-xs font-semibold text-slate-500'>
                  📅 Đơn Đặt phòng Hoạt động
                </span>
                <p className='mt-2 text-2xl font-extrabold text-slate-900'>
                  {stats.totalBookings} đơn
                </p>
                <span className='mt-1 block text-xs text-amber-600'>
                  Chờ duyệt: {stats.pendingBookings} • Đã duyệt:{' '}
                  {stats.confirmedBookings}
                </span>
              </div>

              <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                <span className='text-xs font-semibold text-slate-500'>
                  👥 Khách hàng & Voucher
                </span>
                <p className='mt-2 text-2xl font-extrabold text-slate-900'>
                  {stats.totalCustomers} khách
                </p>
                <span className='mt-1 block text-xs text-indigo-600'>
                  {categories.length} hạng phòng • {vouchers.length} mã voucher
                </span>
              </div>
            </div>

            {/* Booking Lifecycle Distribution */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
              <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
                <h3 className='text-sm font-bold text-slate-900'>
                  Phân bổ Trạng thái Đơn đặt phòng (State Pattern)
                </h3>
                <div className='mt-4 space-y-3 text-xs'>
                  <div className='flex items-center justify-between rounded-xl bg-amber-50 p-3'>
                    <span className='font-semibold text-amber-800'>
                      ⏳ Chờ xác nhận (PENDING)
                    </span>
                    <span className='text-sm font-extrabold text-amber-900'>
                      {stats.pendingBookings} đơn
                    </span>
                  </div>
                  <div className='flex items-center justify-between rounded-xl bg-emerald-50 p-3'>
                    <span className='font-semibold text-emerald-800'>
                      ✓ Đã xác nhận (CONFIRMED)
                    </span>
                    <span className='text-sm font-extrabold text-emerald-900'>
                      {stats.confirmedBookings} đơn
                    </span>
                  </div>
                  <div className='flex items-center justify-between rounded-xl bg-blue-50 p-3'>
                    <span className='font-semibold text-blue-800'>
                      🔑 Đang lưu trú (CHECKED_IN)
                    </span>
                    <span className='text-sm font-extrabold text-blue-900'>
                      {stats.checkedInBookings} đơn
                    </span>
                  </div>
                  <div className='flex items-center justify-between rounded-xl bg-slate-100 p-3'>
                    <span className='font-semibold text-slate-700'>
                      🏁 Đã trả phòng (CHECKED_OUT)
                    </span>
                    <span className='text-sm font-extrabold text-slate-900'>
                      {stats.checkedOutBookings} đơn
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Bookings Table */}
              <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-sm font-bold text-slate-900'>
                    Đơn Đặt phòng Mới nhất
                  </h3>
                  <button
                    type='button'
                    onClick={() => setActiveSection('bookings')}
                    className='text-xs font-bold text-indigo-600 hover:underline'
                  >
                    Xem tất cả →
                  </button>
                </div>

                {stats.recentBookings.length === 0 ? (
                  <p className='mt-6 text-center text-xs text-slate-400'>
                    Hiện chưa có đơn đặt phòng nào.
                  </p>
                ) : (
                  <div className='mt-4 overflow-x-auto'>
                    <table className='w-full text-left text-xs'>
                      <thead className='border-b border-slate-200 bg-slate-50 text-slate-600'>
                        <tr>
                          <th className='p-3'>Mã đơn</th>
                          <th className='p-3'>Khách hàng</th>
                          <th className='p-3'>Phòng</th>
                          <th className='p-3'>Nhận - Trả</th>
                          <th className='p-3'>Tổng tiền</th>
                          <th className='p-3'>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-slate-100'>
                        {stats.recentBookings.map((b) => (
                          <tr key={b.id} className='hover:bg-slate-50'>
                            <td className='p-3 font-bold text-indigo-600'>
                              #{b.bookingCode}
                            </td>
                            <td className='p-3'>
                              <p className='font-semibold text-slate-800'>
                                {b.customerName}
                              </p>
                              <p className='text-slate-400'>
                                {b.customerEmail}
                              </p>
                            </td>
                            <td className='p-3 font-medium'>
                              {b.roomName} ({b.roomNumber})
                            </td>
                            <td className='p-3'>
                              {formatDateVn(b.checkInDate)} → {formatDateVn(b.checkOutDate)}
                            </td>
                            <td className='p-3 font-bold text-slate-900'>
                              {formatVnd(b.totalAmount)}
                            </td>
                            <td className='p-3'>
                              <span
                                className={`rounded-full border px-2.5 py-0.5 font-bold ${bookingBadgeColor(
                                  b.status
                                )}`}
                              >
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 2: QUẢN LÝ ĐẶT PHÒNG (BOOKINGS)                           */}
        {/* ================================================================= */}
        {activeSection === 'bookings' && (
          <div className='space-y-6'>
            <div>
              <h2 className='text-2xl font-extrabold text-slate-900'>
                Quản lý Đơn Đặt phòng ({filteredBookings.length} đơn)
              </h2>
            </div>

            {/* Filter Bar */}
            <div className='grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4'>
              <div className='sm:col-span-2'>
                <label className='mb-1 block text-xs font-bold text-slate-600'>
                  Tìm kiếm đơn (Mã đơn, Tên khách, Email, Số phòng)
                </label>
                <input
                  type='text'
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder='Nhập mã BK-..., tên khách hàng hoặc số phòng...'
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>

              <div>
                <label className='mb-1 block text-xs font-bold text-slate-600'>
                  Lọc theo Trạng thái Booking
                </label>
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold'
                >
                  <option value='ALL'>Tất cả trạng thái</option>
                  <option value='PENDING'>PENDING (Chờ xác nhận)</option>
                  <option value='CONFIRMED'>CONFIRMED (Đã xác nhận)</option>
                  <option value='CHECKED_IN'>CHECKED_IN (Đang lưu trú)</option>
                  <option value='CHECKED_OUT'>CHECKED_OUT (Đã trả phòng)</option>
                </select>
              </div>

              <div>
                <label className='mb-1 block text-xs font-bold text-slate-600'>
                  Lọc theo Thanh toán
                </label>
                <select
                  value={bookingPaymentFilter}
                  onChange={(e) => setBookingPaymentFilter(e.target.value)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold'
                >
                  <option value='ALL'>Tất cả TT thanh toán</option>
                  <option value='PENDING'>PENDING (Chưa thanh toán)</option>
                  <option value='PAID'>PAID (Đã thanh toán)</option>
                  <option value='REFUNDED'>REFUNDED (Đã hoàn tiền)</option>
                </select>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className='rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500'>
                Không có đơn đặt phòng nào khớp với bộ lọc hiện tại.
              </div>
            ) : (
              <div className='space-y-4'>
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200'
                  >
                    <div className='flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4'>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2'>
                          <span className='rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-extrabold text-indigo-700'>
                            #{b.bookingCode}
                          </span>
                          <span className='rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700'>
                            Phòng #{b.roomNumber} ({b.roomType})
                          </span>
                          <span className='text-xs text-slate-400'>
                            📍 {b.roomLocation}
                          </span>
                        </div>
                        <h3 className='text-base font-bold text-slate-900'>
                          {b.roomName}
                        </h3>
                        <p className='text-xs text-slate-600'>
                          👤 Khách đặt: <strong>{b.customerName}</strong> • ✉️{' '}
                          {b.customerEmail} • 📞{' '}
                          {b.customerPhone || 'Chưa cập nhật'}
                        </p>
                      </div>

                      <div className='flex flex-wrap items-center gap-2'>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${bookingBadgeColor(
                            b.status
                          )}`}
                        >
                          Trạng thái: {b.status}
                        </span>
                        <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700'>
                          TT: {b.payment?.paymentStatus} (
                          {b.payment?.paymentMethod})
                        </span>
                        <button
                          type='button'
                          onClick={() => setDetailBooking(b)}
                          className='rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100'
                        >
                          👁️ Xem chi tiết
                        </button>
                      </div>
                    </div>

                    <div className='mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5'>
                      <div>
                        <span className='block text-slate-400'>
                          Nhận - Trả phòng
                        </span>
                        <span className='font-semibold text-slate-800'>
                          {formatDateVn(b.checkInDate)} → {formatDateVn(b.checkOutDate)} ({b.nights} đêm,{' '}
                          {b.guestCount} khách)
                        </span>
                      </div>
                      <div>
                        <span className='block text-slate-400'>
                          Tiền phòng gốc
                        </span>
                        <span className='font-semibold'>
                          {formatVnd(b.baseRoomCost)}
                        </span>
                      </div>
                      <div>
                        <span className='block text-slate-400'>
                          Dịch vụ (Decorator)
                        </span>
                        <span className='font-semibold'>
                          +{formatVnd(b.addonServicesCost)}
                        </span>
                      </div>
                      <div>
                        <span className='block text-slate-400'>
                          Voucher ({b.voucherCode || 'Không'})
                        </span>
                        <span className='font-semibold text-emerald-700'>
                          -{formatVnd(b.discountAmount)}
                        </span>
                      </div>
                      <div>
                        <span className='block text-slate-400'>
                          Tổng thanh toán
                        </span>
                        <span className='text-sm font-extrabold text-indigo-600'>
                          {formatVnd(b.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className='mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='text-xs font-bold text-slate-600'>
                          Chuyển trạng thái (State Pattern):
                        </span>
                        <button
                          type='button'
                          disabled={b.status !== 'PENDING'}
                          onClick={() =>
                            void handleBookingStateAction(b.id, 'CONFIRM')
                          }
                          className='rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-30'
                        >
                          1. Xác nhận (CONFIRM)
                        </button>
                        <button
                          type='button'
                          disabled={b.status !== 'CONFIRMED'}
                          onClick={() =>
                            void handleBookingStateAction(b.id, 'CHECK_IN')
                          }
                          className='rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-30'
                        >
                          2. Nhận phòng (CHECK_IN)
                        </button>
                        <button
                          type='button'
                          disabled={b.status !== 'CHECKED_IN'}
                          onClick={() =>
                            void handleBookingStateAction(b.id, 'CHECK_OUT')
                          }
                          className='rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-30'
                        >
                          3. Trả phòng (CHECK_OUT)
                        </button>
                        <button
                          type='button'
                          disabled={
                            b.status === 'CHECKED_IN' ||
                            b.status === 'CHECKED_OUT'
                          }
                          onClick={() =>
                            void handleBookingStateAction(b.id, 'CANCEL')
                          }
                          className='rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-30'
                        >
                          Hủy & Xóa đơn (CANCEL)
                        </button>
                      </div>

                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-bold text-slate-600'>
                          TT Thanh toán:
                        </span>
                        <select
                          value={b.payment?.paymentStatus || 'PENDING'}
                          onChange={(e) =>
                            void handleUpdatePaymentStatus(
                              b.id,
                              e.target.value as PaymentStatus
                            )
                          }
                          className='rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold'
                        >
                          <option value='PENDING'>PENDING</option>
                          <option value='PAID'>PAID</option>
                          <option value='REFUNDED'>REFUNDED</option>
                          <option value='FAILED'>FAILED</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 3: QUẢN LÝ PHÒNG (ROOMS)                                  */}
        {/* ================================================================= */}
        {activeSection === 'rooms' && (
          <div className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div>
                <h2 className='text-2xl font-extrabold text-slate-900'>
                  Quản lý Danh sách Phòng ({filteredRooms.length} phòng)
                </h2>
              </div>
              <button
                type='button'
                onClick={openAddRoomModal}
                className='rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700'
              >
                + Thêm Phòng mới
              </button>
            </div>

            {/* Room Filter Bar */}
            <div className='grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-5'>
              <div>
                <label className='mb-1 block text-xs font-bold text-slate-600'>
                  Tìm số phòng / tên / địa điểm
                </label>
                <input
                  type='text'
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  placeholder='VD: P101, Ocean, Đà Nẵng...'
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>

              <div>
                <label className='mb-1 block text-xs font-bold text-slate-600'>
                  Lọc theo Hạng phòng
                </label>
                <select
                  value={roomCategoryFilter}
                  onChange={(e) => setRoomCategoryFilter(e.target.value)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold'
                >
                  <option value='ALL'>Tất cả Hạng phòng</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.code}>
                      {cat.code} - {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='mb-1 block text-xs font-bold text-slate-600'>
                  Lọc theo Trạng thái
                </label>
                <select
                  value={roomStatusFilter}
                  onChange={(e) => setRoomStatusFilter(e.target.value)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold'
                >
                  <option value='ALL'>Tất cả trạng thái</option>
                  <option value='AVAILABLE'>AVAILABLE (Sẵn sàng)</option>
                  <option value='MAINTENANCE'>MAINTENANCE (Bảo trì)</option>
                  <option value='OCCUPIED'>OCCUPIED (Đang có khách)</option>
                </select>
              </div>

              <div>
                <label className='mb-1 block text-xs font-bold text-slate-600'>
                  Giá từ (VNĐ)
                </label>
                <input
                  type='number'
                  value={roomMinPriceFilter}
                  onChange={(e) => setRoomMinPriceFilter(e.target.value)}
                  placeholder='VD: 500000'
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>

              <div>
                <label className='mb-1 block text-xs font-bold text-slate-600'>
                  Giá đến (VNĐ)
                </label>
                <input
                  type='number'
                  value={roomMaxPriceFilter}
                  onChange={(e) => setRoomMaxPriceFilter(e.target.value)}
                  placeholder='VD: 3000000'
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>
            </div>

            {/* Room List Grid */}
            <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
              {filteredRooms.map((r) => (
                <div
                  key={r.id}
                  className='flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row'
                >
                  <div className='flex gap-4'>
                    <img
                      src={r.images?.[0] || ''}
                      alt={r.name}
                      className='h-28 w-36 rounded-xl bg-slate-100 object-cover'
                    />
                    <div className='space-y-1 text-xs'>
                      <div className='flex flex-wrap items-center gap-1.5'>
                        <span className='font-extrabold text-indigo-600'>
                          #{r.roomNumber}
                        </span>
                        <span className='rounded bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700'>
                          {r.roomType}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 font-bold ${
                            r.status === 'AVAILABLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <h3 className='text-sm font-bold text-slate-900'>
                        {r.name}
                      </h3>
                      <p className='text-slate-500'>
                        📍 {r.location} • 👥 {r.capacity} khách • 🛏️ {r.bedType}
                      </p>
                      <p className='text-sm font-extrabold text-indigo-600'>
                        {formatVnd(r.pricePerNight)} / đêm
                      </p>
                    </div>
                  </div>

                  <div className='flex flex-row items-center gap-2 self-end sm:flex-col sm:justify-center'>
                    <button
                      type='button'
                      onClick={() => setDetailRoom(r)}
                      className='w-full rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100'
                    >
                      Chi tiết
                    </button>
                    <button
                      type='button'
                      onClick={() => openEditRoomModal(r)}
                      className='w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100'
                    >
                      Sửa phòng
                    </button>
                    <button
                      type='button'
                      onClick={() => void handleDeleteRoom(r.id)}
                      className='w-full rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100'
                    >
                      Xóa phòng
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 4: QUẢN LÝ HẠNG PHÒNG (ROOM CATEGORIES)                   */}
        {/* ================================================================= */}
        {activeSection === 'categories' && (
          <div className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div>
                <h2 className='text-2xl font-extrabold text-slate-900'>
                  Quản lý Hạng phòng / Loại phòng ({categories.length} hạng)
                </h2>
              </div>
              <button
                type='button'
                onClick={openAddCategoryModal}
                className='rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700'
              >
                + Thêm Hạng phòng mới
              </button>
            </div>

            <div className='grid grid-cols-1 gap-5 md:grid-cols-3'>
              {categories.map((cat) => {
                const roomCount = rooms.filter(
                  (r) => r.roomType.toUpperCase() === cat.code.toUpperCase()
                ).length
                return (
                  <div
                    key={cat.id}
                    className='flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'
                  >
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <span className='rounded-lg bg-indigo-600 px-3 py-1 text-xs font-extrabold text-white'>
                          {cat.code}
                        </span>
                        <span className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700'>
                          Đang có {roomCount} phòng
                        </span>
                      </div>
                      <h3 className='text-base font-bold text-slate-900'>
                        {cat.name}
                      </h3>
                      <div className='rounded-xl bg-slate-50 p-3 text-xs space-y-1'>
                        <p>
                          💰 Giá mặc định:{' '}
                          <strong className='text-indigo-600'>
                            {formatVnd(cat.defaultPrice)} / đêm
                          </strong>
                        </p>
                        <p>
                          👥 Sức chứa chuẩn:{' '}
                          <strong>{cat.defaultCapacity} khách</strong>
                        </p>
                        <p>
                          🛏️ Giường chuẩn:{' '}
                          <strong>{cat.defaultBedType}</strong>
                        </p>
                      </div>
                      <p className='text-xs text-slate-600 line-clamp-2'>
                        {cat.defaultDescription}
                      </p>
                      <p className='text-[11px] text-slate-500'>
                        ✨ Tiện nghi mặc định: {cat.defaultAmenities}
                      </p>
                    </div>

                    <div className='mt-5 flex gap-2 border-t border-slate-100 pt-4'>
                      <button
                        type='button'
                        onClick={() => openEditCategoryModal(cat)}
                        className='flex-1 rounded-lg border border-slate-300 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50'
                      >
                        Sửa Hạng phòng
                      </button>
                      <button
                        type='button'
                        onClick={() => void handleDeleteCategory(cat.id)}
                        className='rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100'
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 5: QUẢN LÝ VOUCHER (MÃ GIẢM GIÁ)                          */}
        {/* ================================================================= */}
        {activeSection === 'vouchers' && (
          <div className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div>
                <h2 className='text-2xl font-extrabold text-slate-900'>
                  Quản lý Mã giảm giá - Vouchers ({vouchers.length} mã)
                </h2>
              </div>
              <button
                type='button'
                onClick={openAddVoucherModal}
                className='rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700'
              >
                + Thêm Voucher mới
              </button>
            </div>

            {vouchers.length === 0 ? (
              <div className='rounded-2xl border border-slate-200 bg-white p-12 text-center'>
                <p className='text-base font-bold text-slate-700'>
                  Chưa có mã giảm giá (Voucher) nào.
                </p>
                <p className='mt-1 text-xs text-slate-500'>
                  Nhấn &ldquo;+ Thêm Voucher mới&rdquo; để tạo voucher áp dụng
                  cho tất cả phòng hoặc từng hạng phòng cụ thể.
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'>
                {vouchers.map((v) => (
                  <div
                    key={v.id}
                    className='flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'
                  >
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <span className='rounded-lg bg-indigo-600 px-3 py-1 text-sm font-extrabold tracking-wider text-white'>
                          {v.code}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            v.active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {v.active ? 'Đang kích hoạt' : 'Tạm ngưng'}
                        </span>
                      </div>

                      <div className='rounded-xl bg-slate-50 p-3 text-xs space-y-1.5'>
                        <p>
                          Loại chiến lược:{' '}
                          <strong>{v.discountType}</strong>
                        </p>
                        <p>
                          Mức giảm:{' '}
                          <strong className='text-sm text-indigo-600'>
                            {v.discountType === 'FIXED_AMOUNT'
                              ? formatVnd(v.discountValue)
                              : `${v.discountValue}%`}
                          </strong>
                        </p>
                        <p>
                          Đơn tối thiểu:{' '}
                          <strong>{formatVnd(v.minOrderValue)}</strong>
                        </p>
                        <p>
                          Hạng phòng áp dụng:{' '}
                          <span className='rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-900'>
                            {v.applicableRoomTypes === 'ALL'
                              ? 'Tất cả phòng (ALL)'
                              : v.applicableRoomTypes}
                          </span>
                        </p>
                        <p className='text-slate-500'>
                          Hiệu lực: {formatDateVn(v.validFrom)} → {formatDateVn(v.validTo)}
                        </p>
                      </div>
                    </div>

                    <div className='mt-4 flex gap-2 border-t border-slate-100 pt-3'>
                      <button
                        type='button'
                        onClick={() => openEditVoucherModal(v)}
                        className='flex-1 rounded-lg border border-slate-300 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50'
                      >
                        Sửa Voucher
                      </button>
                      <button
                        type='button'
                        onClick={() => void handleDeleteVoucher(v.id)}
                        className='rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100'
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 6: QUẢN LÝ NGƯỜI DÙNG (USERS)                             */}
        {/* ================================================================= */}
        {activeSection === 'users' && (
          <div className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div>
                <h2 className='text-2xl font-extrabold text-slate-900'>
                  Quản lý Người dùng ({filteredUsers.length} tài khoản)
                </h2>
              </div>
              <button
                type='button'
                onClick={openAddUserModal}
                className='rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700'
              >
                + Thêm Người dùng mới
              </button>
            </div>

            {/* User Filter Bar */}
            <div className='grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3'>
              <div className='sm:col-span-2'>
                <label className='mb-1 block text-xs font-bold text-slate-600'>
                  Tìm theo Họ tên, Email hoặc Số điện thoại
                </label>
                <input
                  type='text'
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder='Nhập tên, email hoặc số điện thoại...'
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-bold text-slate-600'>
                  Lọc theo Vai trò
                </label>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold'
                >
                  <option value='ALL'>Tất cả vai trò</option>
                  <option value='ROLE_USER'>ROLE_USER (Khách hàng)</option>
                  <option value='ROLE_ADMIN'>ROLE_ADMIN (Quản trị viên)</option>
                </select>
              </div>
            </div>

            <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
              <table className='w-full text-left text-xs'>
                <thead className='border-b border-slate-200 bg-slate-50 text-slate-600'>
                  <tr>
                    <th className='p-3.5'>ID</th>
                    <th className='p-3.5'>Họ và tên</th>
                    <th className='p-3.5'>Email</th>
                    <th className='p-3.5'>Số điện thoại</th>
                    <th className='p-3.5'>Vai trò</th>
                    <th className='p-3.5'>Trạng thái</th>
                    <th className='p-3.5 text-right'>Thao tác</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className='hover:bg-slate-50'>
                      <td className='p-3.5 font-semibold'>#{u.id}</td>
                      <td className='p-3.5 font-bold text-slate-900'>
                        {u.fullName}
                      </td>
                      <td className='p-3.5 text-slate-600'>{u.email}</td>
                      <td className='p-3.5 text-slate-600'>
                        {u.phone || 'Chưa cập nhật'}
                      </td>
                      <td className='p-3.5'>
                        <span
                          className={`rounded-full px-2.5 py-1 font-bold ${
                            u.role === 'ROLE_ADMIN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className='p-3.5'>
                        <span
                          className={`rounded-full px-2.5 py-1 font-bold ${
                            u.locked
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.locked ? '🔒 Đã khóa' : '✓ Hoạt động'}
                        </span>
                      </td>
                      <td className='p-3.5 text-right space-x-1.5'>
                        <button
                          type='button'
                          onClick={() => void handleViewUserDetail(u.id)}
                          className='rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-bold text-indigo-700 hover:bg-indigo-100'
                        >
                          👁️ Chi tiết
                        </button>
                        <button
                          type='button'
                          onClick={() => openEditUserModal(u)}
                          className='rounded-lg border border-slate-300 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100'
                        >
                          Sửa
                        </button>
                        <button
                          type='button'
                          onClick={() => void handleToggleLockUser(u.id)}
                          className={`rounded-lg px-2.5 py-1 font-semibold ${
                            u.locked
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-amber-500 text-white hover:bg-amber-600'
                          }`}
                        >
                          {u.locked ? 'Mở khóa' : 'Khóa'}
                        </button>
                        <button
                          type='button'
                          onClick={() => void handleDeleteUser(u.id)}
                          className='rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 font-semibold text-red-700 hover:bg-red-100'
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: ADD / EDIT ROOM                                            */}
      {/* =================================================================== */}
      {isRoomModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm'>
          <form
            onSubmit={handleSaveRoom}
            className='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl space-y-4'
          >
            <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
              <h3 className='text-lg font-extrabold text-slate-900'>
                {editingRoomId
                  ? `Chỉnh sửa Phòng #${roomNumber}`
                  : 'Thêm Phòng Khách sạn Mới (Factory Method)'}
              </h3>
              <button
                type='button'
                onClick={() => setIsRoomModalOpen(false)}
                className='text-slate-400 hover:text-slate-700'
              >
                ✕
              </button>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Số phòng *
                </label>
                <input
                  type='text'
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder='VD: P401'
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>

              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Hạng phòng (Liên kết từ Quản lý Hạng phòng) *
                </label>
                <select
                  value={roomType}
                  onChange={(e) =>
                    applyCategoryDefaultsToRoomForm(e.target.value)
                  }
                  className='w-full rounded-xl border border-indigo-300 bg-indigo-50/40 px-3 py-2 text-xs font-bold text-indigo-900'
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.code}>
                      {cat.code} — {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Tên phòng *
                </label>
                <input
                  type='text'
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder='VD: Royal Ocean Balcony'
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>

              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Địa điểm / Chi nhánh *
                </label>
                <input
                  type='text'
                  required
                  value={roomLocation}
                  onChange={(e) => setRoomLocation(e.target.value)}
                  placeholder='Đà Nẵng / Nha Trang / Phú Quốc...'
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>

              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Giá mỗi đêm (VNĐ)
                </label>
                <input
                  type='number'
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(e.target.value)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>

              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Sức chứa tối đa (Khách)
                </label>
                <input
                  type='number'
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>

              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Loại giường
                </label>
                <input
                  type='text'
                  value={bedType}
                  onChange={(e) => setBedType(e.target.value)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>

              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Trạng thái phòng
                </label>
                <select
                  value={roomStatus}
                  onChange={(e) => setRoomStatus(e.target.value as RoomStatus)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold'
                >
                  <option value='AVAILABLE'>AVAILABLE (Sẵn sàng)</option>
                  <option value='MAINTENANCE'>MAINTENANCE (Bảo trì)</option>
                  <option value='OCCUPIED'>OCCUPIED (Đang có khách)</option>
                </select>
              </div>
            </div>

            <div>
              <label className='mb-1 block text-xs font-bold text-slate-700'>
                Danh sách Tiện nghi (cách nhau bởi dấu phẩy)
              </label>
              <input
                type='text'
                value={amenitiesText}
                onChange={(e) => setAmenitiesText(e.target.value)}
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
              />
            </div>

            <div>
              <div className='mb-1 flex flex-wrap items-center justify-between gap-2'>
                <label className='block text-xs font-bold text-slate-700'>
                  Hình ảnh Phòng (Dán link ibb.co, Imgur, Google Drive, link bất kỳ HOẶC tải ảnh từ máy)
                </label>
                <label className='cursor-pointer rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200 hover:bg-indigo-100'>
                  📁 + Chọn ảnh từ máy tính (Không giới hạn MP)
                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={handleRoomLocalFileUpload}
                    className='hidden'
                  />
                </label>
              </div>
              <textarea
                rows={2}
                value={imageUrlsText}
                onChange={(e) => setImageUrlsText(e.target.value)}
                onBlur={async () => {
                  if (imageUrlsText.trim()) {
                    const resolved = await resolveShareUrlsInText(imageUrlsText)
                    setImageUrlsText(resolved)
                  }
                }}
                placeholder='Dán link ảnh bất kỳ (VD: https://ibb.co/xc809bj hoặc https://i.ibb.co/...) mỗi dòng 1 link'
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
              />
              {imageUrlsText.trim() && (
                <div className='mt-2 flex flex-wrap gap-2'>
                  {imageUrlsText
                    .split(/\n|,(?!\/)/)
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .reduce<string[]>((acc, item) => {
                      if (
                        item.startsWith('base64,') &&
                        acc.length > 0 &&
                        acc[acc.length - 1].startsWith('data:image/')
                      ) {
                        acc[acc.length - 1] = `${acc[acc.length - 1]},${item}`
                      } else {
                        acc.push(item)
                      }
                      return acc
                    }, [])
                    .map((imgSrc, idx) => (
                      <div
                        key={idx}
                        className='relative h-14 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100'
                      >
                        <img
                          src={imgSrc}
                          alt={`Preview ${idx + 1}`}
                          className='h-full w-full object-cover'
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div>
              <label className='mb-1 block text-xs font-bold text-slate-700'>
                Mô tả chi tiết phòng
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
              />
            </div>

            <div className='flex justify-end gap-2 border-t border-slate-100 pt-4'>
              <button
                type='button'
                onClick={() => setIsRoomModalOpen(false)}
                className='rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700'
              >
                Đóng
              </button>
              <button
                type='submit'
                className='rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700'
              >
                {editingRoomId ? 'Lưu cập nhật' : 'Tạo Phòng mới'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: ADD / EDIT ROOM CATEGORY (HẠNG PHÒNG)                      */}
      {/* =================================================================== */}
      {isCategoryModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm'>
          <form
            onSubmit={handleSaveCategory}
            className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4'
          >
            <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
              <h3 className='text-lg font-extrabold text-slate-900'>
                {editingCategoryId
                  ? `Chỉnh sửa Hạng phòng ${catCode}`
                  : 'Thêm Hạng phòng (Loại phòng) Mới'}
              </h3>
              <button
                type='button'
                onClick={() => setIsCategoryModalOpen(false)}
                className='text-slate-400 hover:text-slate-700'
              >
                ✕
              </button>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Mã Hạng phòng (In hoa) *
                </label>
                <input
                  type='text'
                  required
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value.toUpperCase())}
                  placeholder='VD: PRESIDENT, FAMILY, VIP'
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs uppercase font-bold'
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Tên hiển thị Hạng phòng *
                </label>
                <input
                  type='text'
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder='VD: Hạng Phòng Gia Đình'
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Giá mặc định / đêm (VNĐ) *
                </label>
                <input
                  type='number'
                  required
                  value={catDefaultPrice}
                  onChange={(e) => setCatDefaultPrice(e.target.value)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Sức chứa mặc định (Khách) *
                </label>
                <input
                  type='number'
                  required
                  min={1}
                  value={catDefaultCapacity}
                  onChange={(e) => setCatDefaultCapacity(e.target.value)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>
            </div>

            <div>
              <label className='mb-1 block text-xs font-bold text-slate-700'>
                Loại giường mặc định *
              </label>
              <input
                type='text'
                required
                value={catDefaultBedType}
                onChange={(e) => setCatDefaultBedType(e.target.value)}
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
              />
            </div>

            <div>
              <label className='mb-1 block text-xs font-bold text-slate-700'>
                Tiện nghi mặc định (cách nhau bởi dấu phẩy)
              </label>
              <input
                type='text'
                value={catDefaultAmenities}
                onChange={(e) => setCatDefaultAmenities(e.target.value)}
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
              />
            </div>

            <div>
              <div className='mb-1 flex flex-wrap items-center justify-between gap-2'>
                <label className='block text-xs font-bold text-slate-700'>
                  Hình ảnh mẫu mặc định (Dán link ibb.co, Imgur, link bất kỳ HOẶC tải từ máy)
                </label>
                <label className='cursor-pointer rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200 hover:bg-indigo-100'>
                  📁 + Chọn ảnh từ máy tính
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleCategoryLocalFileUpload}
                    className='hidden'
                  />
                </label>
              </div>
              <input
                type='text'
                value={catDefaultImageUrl}
                onChange={(e) => setCatDefaultImageUrl(e.target.value)}
                onBlur={async () => {
                  if (catDefaultImageUrl.trim()) {
                    const resolved = await resolveShareUrlsInText(
                      catDefaultImageUrl
                    )
                    setCatDefaultImageUrl(resolved)
                  }
                }}
                placeholder='VD: https://ibb.co/xc809bj hoặc chọn ảnh từ máy tính'
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
              />
              {catDefaultImageUrl.trim() && (
                <div className='mt-2 flex items-center gap-3'>
                  <div className='h-14 w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100'>
                    <img
                      src={catDefaultImageUrl}
                      alt='Category preview'
                      className='h-full w-full object-cover'
                    />
                  </div>
                  <span className='text-[11px] text-slate-500'>
                    Xem trước hình ảnh hạng phòng
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className='mb-1 block text-xs font-bold text-slate-700'>
                Mô tả mặc định
              </label>
              <textarea
                rows={2}
                value={catDefaultDescription}
                onChange={(e) => setCatDefaultDescription(e.target.value)}
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
              />
            </div>

            <div className='flex justify-end gap-2 border-t border-slate-100 pt-4'>
              <button
                type='button'
                onClick={() => setIsCategoryModalOpen(false)}
                className='rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700'
              >
                Đóng
              </button>
              <button
                type='submit'
                className='rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700'
              >
                {editingCategoryId ? 'Lưu cập nhật' : 'Tạo Hạng phòng'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: ADD / EDIT VOUCHER (CÓ CHỌN LOẠI PHÒNG ÁP DỤNG)            */}
      {/* =================================================================== */}
      {isVoucherModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm'>
          <form
            onSubmit={handleSaveVoucher}
            className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4'
          >
            <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
              <h3 className='text-lg font-extrabold text-slate-900'>
                {editingVoucherId
                  ? `Chỉnh sửa Voucher ${vCode}`
                  : 'Thêm Mã giảm giá (Voucher) Mới'}
              </h3>
              <button
                type='button'
                onClick={() => setIsVoucherModalOpen(false)}
                className='text-slate-400 hover:text-slate-700'
              >
                ✕
              </button>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Mã Voucher *
                </label>
                <input
                  type='text'
                  required
                  value={vCode}
                  onChange={(e) => setVCode(e.target.value.toUpperCase())}
                  placeholder='VD: LUXURY20, VIP500K'
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs uppercase font-bold'
                />
              </div>

              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Loại Chiến lược Giảm giá *
                </label>
                <select
                  value={vDiscountType}
                  onChange={(e) =>
                    setVDiscountType(e.target.value as DiscountType)
                  }
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold'
                >
                  <option value='PERCENTAGE'>PERCENTAGE (Giảm theo %)</option>
                  <option value='FIXED_AMOUNT'>
                    FIXED_AMOUNT (Giảm số tiền cố định)
                  </option>
                  <option value='SEASONAL'>
                    SEASONAL (Giảm % + Thưởng thêm 5% nếu ở ≥ 3 đêm)
                  </option>
                </select>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Giá trị giảm (
                  {vDiscountType === 'FIXED_AMOUNT' ? 'VNĐ' : '%'}) *
                </label>
                <input
                  type='number'
                  required
                  value={vDiscountValue}
                  onChange={(e) => setVDiscountValue(e.target.value)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Giá trị đơn tối thiểu (VNĐ)
                </label>
                <input
                  type='number'
                  value={vMinOrderValue}
                  onChange={(e) => setVMinOrderValue(e.target.value)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>
            </div>

            {/* Room Type Scope Selector */}
            <div className='rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 space-y-2.5'>
              <label className='block text-xs font-bold text-slate-800'>
                Phạm vi Loại phòng áp dụng Voucher:
              </label>

              <div className='flex gap-4 text-xs'>
                <label className='flex cursor-pointer items-center gap-2 font-semibold text-slate-800'>
                  <input
                    type='radio'
                    checked={vApplyAllRooms}
                    onChange={() => setVApplyAllRooms(true)}
                  />
                  Áp dụng cho Tất cả phòng (ALL)
                </label>
                <label className='flex cursor-pointer items-center gap-2 font-semibold text-slate-800'>
                  <input
                    type='radio'
                    checked={!vApplyAllRooms}
                    onChange={() => setVApplyAllRooms(false)}
                  />
                  Chọn theo Hạng phòng cụ thể
                </label>
              </div>

              {!vApplyAllRooms && (
                <div className='flex flex-wrap gap-2 pt-1'>
                  {categories.map((cat) => {
                    const checked = vSelectedRoomTypes.includes(cat.code)
                    return (
                      <label
                        key={cat.id}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                          checked
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type='checkbox'
                          checked={checked}
                          onChange={() => toggleVoucherRoomType(cat.code)}
                          className='hidden'
                        />
                        <span>
                          {checked ? '✓ ' : '+ '}
                          {cat.code} ({cat.name})
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Ngày bắt đầu *
                </label>
                <VnDateInput
                  required
                  value={vValidFrom}
                  onChange={(val) => setVValidFrom(val)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-bold text-slate-700'>
                  Ngày kết thúc *
                </label>
                <VnDateInput
                  required
                  value={vValidTo}
                  onChange={(val) => setVValidTo(val)}
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
                />
              </div>
            </div>

            <label className='flex items-center gap-2 text-xs font-bold text-slate-700'>
              <input
                type='checkbox'
                checked={vActive}
                onChange={(e) => setVActive(e.target.checked)}
              />
              Kích hoạt mã giảm giá này ngay
            </label>

            <div className='flex justify-end gap-2 border-t border-slate-100 pt-4'>
              <button
                type='button'
                onClick={() => setIsVoucherModalOpen(false)}
                className='rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700'
              >
                Đóng
              </button>
              <button
                type='submit'
                className='rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700'
              >
                {editingVoucherId ? 'Lưu cập nhật' : 'Tạo Voucher'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: ADD / EDIT USER                                            */}
      {/* =================================================================== */}
      {isUserModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm'>
          <form
            onSubmit={handleSaveUser}
            className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4'
          >
            <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
              <h3 className='text-lg font-extrabold text-slate-900'>
                {editingUserId
                  ? 'Chỉnh sửa Thông tin Người dùng'
                  : 'Thêm Người dùng Mới'}
              </h3>
              <button
                type='button'
                onClick={() => setIsUserModalOpen(false)}
                className='text-slate-400 hover:text-slate-700'
              >
                ✕
              </button>
            </div>

            <div>
              <label className='mb-1 block text-xs font-bold text-slate-700'>
                Họ và tên *
              </label>
              <input
                type='text'
                required
                value={uFullName}
                onChange={(e) => setUFullName(e.target.value)}
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
              />
            </div>

            <div>
              <label className='mb-1 block text-xs font-bold text-slate-700'>
                Email *
              </label>
              <input
                type='email'
                required
                value={uEmail}
                onChange={(e) => setUEmail(e.target.value)}
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
              />
            </div>

            <div>
              <label className='mb-1 block text-xs font-bold text-slate-700'>
                Số điện thoại
              </label>
              <input
                type='text'
                value={uPhone}
                onChange={(e) => setUPhone(e.target.value)}
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
              />
            </div>

            <div>
              <label className='mb-1 block text-xs font-bold text-slate-700'>
                {editingUserId
                  ? 'Mật khẩu mới (để trống nếu giữ nguyên)'
                  : 'Mật khẩu *'}
              </label>
              <input
                type='password'
                required={!editingUserId}
                value={uPassword}
                onChange={(e) => setUPassword(e.target.value)}
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs'
              />
            </div>

            <div>
              <label className='mb-1 block text-xs font-bold text-slate-700'>
                Phân quyền hệ thống
              </label>
              <select
                value={uRole}
                onChange={(e) => setURole(e.target.value as RoleType)}
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold'
              >
                <option value='ROLE_USER'>ROLE_USER (Khách hàng)</option>
                <option value='ROLE_ADMIN'>ROLE_ADMIN (Quản trị viên)</option>
              </select>
            </div>

            <div className='flex justify-end gap-2 border-t border-slate-100 pt-4'>
              <button
                type='button'
                onClick={() => setIsUserModalOpen(false)}
                className='rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700'
              >
                Đóng
              </button>
              <button
                type='submit'
                className='rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700'
              >
                {editingUserId ? 'Lưu thay đổi' : 'Tạo Người dùng'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 5: VIEW USER DETAIL & BOOKING HISTORY                         */}
      {/* =================================================================== */}
      {detailUser && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm'>
          <div className='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl space-y-5'>
            <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
              <div>
                <span className='text-xs font-bold text-indigo-600'>
                  Hồ sơ Người dùng #{detailUser.id}
                </span>
                <h3 className='text-lg font-extrabold text-slate-900'>
                  {detailUser.fullName}
                </h3>
              </div>
              <button
                type='button'
                onClick={() => setDetailUser(null)}
                className='text-slate-400 hover:text-slate-700'
              >
                ✕
              </button>
            </div>

            <div className='grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-xs sm:grid-cols-3'>
              <div>
                <span className='block text-slate-400'>Email</span>
                <strong className='text-slate-800'>{detailUser.email}</strong>
              </div>
              <div>
                <span className='block text-slate-400'>Số điện thoại</span>
                <strong className='text-slate-800'>
                  {detailUser.phone || 'Chưa cập nhật'}
                </strong>
              </div>
              <div>
                <span className='block text-slate-400'>Vai trò</span>
                <strong className='text-indigo-600'>{detailUser.role}</strong>
              </div>
              <div>
                <span className='block text-slate-400'>Trạng thái TK</span>
                <strong
                  className={
                    detailUser.locked ? 'text-red-600' : 'text-emerald-600'
                  }
                >
                  {detailUser.locked ? 'Đã khóa' : 'Đang hoạt động'}
                </strong>
              </div>
              <div>
                <span className='block text-slate-400'>Tổng số đơn đã đặt</span>
                <strong className='text-slate-900'>
                  {detailUser.totalBookings} đơn
                </strong>
              </div>
              <div>
                <span className='block text-slate-400'>Tổng chi tiêu</span>
                <strong className='text-indigo-600'>
                  {formatVnd(detailUser.totalSpent)}
                </strong>
              </div>
            </div>

            <div>
              <h4 className='text-xs font-bold uppercase text-slate-500'>
                Lịch sử Đặt phòng của Người dùng ({detailUser.bookings.length})
              </h4>
              {detailUser.bookings.length === 0 ? (
                <p className='mt-2 text-xs text-slate-400'>
                  Người dùng này chưa có đơn đặt phòng nào.
                </p>
              ) : (
                <div className='mt-2 space-y-2'>
                  {detailUser.bookings.map((b) => (
                    <div
                      key={b.id}
                      className='flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs'
                    >
                      <div>
                        <p className='font-bold text-slate-900'>
                          #{b.bookingCode} — {b.roomName} (Phòng {b.roomNumber})
                        </p>
                        <p className='text-slate-500'>
                          {formatDateVn(b.checkInDate)} → {formatDateVn(b.checkOutDate)} ({b.nights} đêm)
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-extrabold text-indigo-600'>
                          {formatVnd(b.totalAmount)}
                        </p>
                        <span className='text-[11px] font-bold text-slate-600'>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='flex justify-end'>
              <button
                type='button'
                onClick={() => setDetailUser(null)}
                className='rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white'
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 6: VIEW BOOKING DETAIL                                        */}
      {/* =================================================================== */}
      {detailBooking && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm'>
          <div className='max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl space-y-4 text-xs'>
            <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
              <div>
                <span className='font-bold text-indigo-600'>
                  Chi tiết Hóa đơn Đặt phòng #{detailBooking.bookingCode}
                </span>
                <h3 className='text-lg font-extrabold text-slate-900'>
                  {detailBooking.roomName} (Phòng #{detailBooking.roomNumber})
                </h3>
              </div>
              <button
                type='button'
                onClick={() => setDetailBooking(null)}
                className='text-slate-400 hover:text-slate-700'
              >
                ✕
              </button>
            </div>

            <div className='grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4'>
              <div>
                <span className='block text-slate-400'>Khách hàng</span>
                <strong className='text-slate-900'>
                  {detailBooking.customerName}
                </strong>
                <p className='text-slate-500'>{detailBooking.customerEmail}</p>
                <p className='text-slate-500'>{detailBooking.customerPhone}</p>
              </div>
              <div>
                <span className='block text-slate-400'>Thông tin lưu trú</span>
                <p>
                  Nhận phòng: <strong>{formatDateVn(detailBooking.checkInDate)}</strong>
                </p>
                <p>
                  Trả phòng: <strong>{formatDateVn(detailBooking.checkOutDate)}</strong> (
                  {detailBooking.nights} đêm)
                </p>
                <p>
                  Số lượng khách:{' '}
                  <strong>{detailBooking.guestCount} khách</strong>
                </p>
              </div>
            </div>

            <div className='rounded-xl border border-slate-200 p-4 space-y-2'>
              <p className='font-bold text-slate-900'>
                Cấu trúc chi phí (Decorator & Strategy Pattern):
              </p>
              <p className='italic text-slate-600'>
                {detailBooking.costBreakdownDescription}
              </p>
              <div className='border-t border-slate-100 pt-2 space-y-1'>
                <div className='flex justify-between'>
                  <span>Tiền phòng cơ bản:</span>
                  <strong>{formatVnd(detailBooking.baseRoomCost)}</strong>
                </div>
                <div className='flex justify-between'>
                  <span>Dịch vụ đi kèm (Add-ons):</span>
                  <strong>+{formatVnd(detailBooking.addonServicesCost)}</strong>
                </div>
                <div className='flex justify-between text-emerald-700'>
                  <span>
                    Giảm giá Voucher ({detailBooking.voucherCode || 'Không'}):
                  </span>
                  <strong>-{formatVnd(detailBooking.discountAmount)}</strong>
                </div>
                <div className='flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-indigo-600'>
                  <span>Tổng cộng thanh toán:</span>
                  <span>{formatVnd(detailBooking.totalAmount)}</span>
                </div>
              </div>
            </div>

            {detailBooking.specialRequests && (
              <div className='rounded-xl bg-amber-50 p-3 text-amber-900'>
                <strong>Ghi chú đặc biệt:</strong>{' '}
                {detailBooking.specialRequests}
              </div>
            )}

            <div className='flex justify-end'>
              <button
                type='button'
                onClick={() => setDetailBooking(null)}
                className='rounded-xl bg-slate-900 px-5 py-2 font-bold text-white'
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 7: VIEW ROOM DETAIL                                           */}
      {/* =================================================================== */}
      {detailRoom && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm'>
          <div className='max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl space-y-4 text-xs'>
            <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
              <div>
                <span className='font-bold text-indigo-600'>
                  Phòng #{detailRoom.roomNumber} • Hạng {detailRoom.roomType}
                </span>
                <h3 className='text-lg font-extrabold text-slate-900'>
                  {detailRoom.name}
                </h3>
              </div>
              <button
                type='button'
                onClick={() => setDetailRoom(null)}
                className='text-slate-400 hover:text-slate-700'
              >
                ✕
              </button>
            </div>

            {detailRoom.images.length > 0 && (
              <div className='grid grid-cols-2 gap-2'>
                {detailRoom.images.map((img) => (
                  <img
                    key={img}
                    src={img}
                    alt={detailRoom.name}
                    className='h-36 w-full rounded-xl object-cover'
                  />
                ))}
              </div>
            )}

            <div className='grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3'>
              <p>
                📍 Địa điểm: <strong>{detailRoom.location}</strong>
              </p>
              <p>
                💰 Giá/đêm:{' '}
                <strong className='text-indigo-600'>
                  {formatVnd(detailRoom.pricePerNight)}
                </strong>
              </p>
              <p>
                👥 Sức chứa: <strong>{detailRoom.capacity} khách</strong>
              </p>
              <p>
                🛏️ Giường: <strong>{detailRoom.bedType}</strong>
              </p>
            </div>

            <p className='text-slate-600'>{detailRoom.description}</p>

            <div className='flex flex-wrap gap-1.5'>
              {detailRoom.amenities.map((a) => (
                <span
                  key={a}
                  className='rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700'
                >
                  ✓ {a}
                </span>
              ))}
            </div>

            <div className='flex justify-end'>
              <button
                type='button'
                onClick={() => setDetailRoom(null)}
                className='rounded-xl bg-slate-900 px-5 py-2 font-bold text-white'
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
