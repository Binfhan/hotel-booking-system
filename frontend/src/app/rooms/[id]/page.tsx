'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatDateVn, formatVnd, hotelApi } from '@/lib/api'
import { VnDateInput } from '@/components/VnDateInput'
import { useAuth } from '@/context/AuthContext'
import type {
  AddonServiceType,
  PaymentMethodType,
  PriceBreakdown,
  RoomItem,
  VoucherItem
} from '@/types/hotel'

const ADDON_SERVICE_OPTIONS: Array<{
  type: AddonServiceType
  title: string
  subtitle: string
}> = [
  {
    type: 'BREAKFAST',
    title: 'Buffet sáng quốc tế (BreakfastDecorator)',
    subtitle: '150.000 VNĐ / khách / đêm'
  },
  {
    type: 'AIRPORT_PICKUP',
    title: 'Xe riêng đưa đón sân bay 2 chiều (AirportPickupDecorator)',
    subtitle: '350.000 VNĐ / chuyến cố định'
  },
  {
    type: 'EXTRA_BED',
    title: 'Giường phụ Extra Bed (ExtraBedDecorator)',
    subtitle: '300.000 VNĐ / đêm'
  },
  {
    type: 'SPA',
    title: 'Gói thư giãn Spa & Sauna (SpaDecorator)',
    subtitle: '400.000 VNĐ / khách'
  }
]

const getDefaultDates = (): { checkIn: string; checkOut: string } => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const twoDaysLater = new Date()
  twoDaysLater.setDate(twoDaysLater.getDate() + 3)

  return {
    checkIn: tomorrow.toISOString().split('T')[0],
    checkOut: twoDaysLater.toISOString().split('T')[0]
  }
}

const RoomDetailPage = (): React.JSX.Element => {
  const params = useParams<{ id: string }>()
  const roomId = Number(params.id)
  const router = useRouter()
  const { user } = useAuth()

  const defaults = getDefaultDates()

  const [room, setRoom] = useState<RoomItem | null>(null)
  const [vouchers, setVouchers] = useState<VoucherItem[]>([])
  const [activeImage, setActiveImage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const [checkInDate, setCheckInDate] = useState<string>(defaults.checkIn)
  const [checkOutDate, setCheckOutDate] = useState<string>(defaults.checkOut)
  const [guestCount, setGuestCount] = useState<number>(2)
  const [selectedServices, setSelectedServices] = useState<AddonServiceType[]>(
    []
  )
  const [voucherCode, setVoucherCode] = useState<string>('')
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodType>('E_WALLET')
  const [specialRequests, setSpecialRequests] = useState<string>('')

  const [preview, setPreview] = useState<PriceBreakdown | null>(null)
  const [previewError, setPreviewError] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false)
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242')
  const [cardHolder, setCardHolder] = useState<string>('NGUYEN VAN A')
  const [cardExpiry, setCardExpiry] = useState<string>('12/28')
  const [cardCvv, setCardCvv] = useState<string>('888')

  useEffect(() => {
    const loadRoomAndVouchers = async (): Promise<void> => {
      setLoading(true)
      try {
        const [roomData, voucherList] = await Promise.all([
          hotelApi.getRoomById(roomId),
          hotelApi.getActiveVouchers()
        ])
        setRoom(roomData)
        setVouchers(voucherList)
        setGuestCount(Math.min(2, roomData.capacity))
        if (roomData.images?.[0]) {
          setActiveImage(roomData.images[0])
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Không thể tải thông tin phòng'
        )
      } finally {
        setLoading(false)
      }
    }

    if (roomId) {
      void loadRoomAndVouchers()
    }
  }, [roomId])

  const loadPricePreview = useCallback(async (): Promise<void> => {
    if (!roomId || !checkInDate || !checkOutDate) {
      return
    }
    setPreviewError('')
    try {
      const result = await hotelApi.previewBookingPrice({
        roomId,
        checkInDate,
        checkOutDate,
        guestCount,
        addonServices: selectedServices,
        voucherCode: voucherCode.trim() || undefined
      })
      setPreview(result)
    } catch (err) {
      setPreview(null)
      setPreviewError(
        err instanceof Error ? err.message : 'Không thể tính giá đặt phòng'
      )
    }
  }, [
    roomId,
    checkInDate,
    checkOutDate,
    guestCount,
    selectedServices,
    voucherCode
  ])

  useEffect(() => {
    void loadPricePreview()
  }, [loadPricePreview])

  const toggleAddonService = (service: AddonServiceType): void => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((item) => item !== service)
        : [...prev, service]
    )
  }

  const executeBookingSubmission = async (): Promise<void> => {
    setSubmitting(true)
    setPreviewError('')
    try {
      await hotelApi.createBooking({
        roomId,
        checkInDate,
        checkOutDate,
        guestCount,
        addonServices: selectedServices,
        voucherCode: voucherCode.trim() || undefined,
        paymentMethod,
        specialRequests
      })
      setShowPaymentModal(false)
      router.push('/my-bookings')
    } catch (err) {
      setShowPaymentModal(false)
      setPreviewError(
        err instanceof Error ? err.message : 'Đặt phòng thất bại'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handlePlaceBooking = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!user) {
      router.push('/login')
      return
    }
    if (paymentMethod === 'E_WALLET' || paymentMethod === 'CREDIT_CARD') {
      setShowPaymentModal(true)
      return
    }
    await executeBookingSubmission()
  }

  if (loading) {
    return (
      <div className='h-96 animate-pulse rounded-2xl bg-slate-200 p-8' />
    )
  }

  if (error || !room) {
    return (
      <div className='rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700'>
        {error || 'Không tìm thấy phòng'}
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
      {/* Left 2 Columns: Room Gallery & Details */}
      <div className='space-y-6 lg:col-span-2'>
        <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='relative h-80 w-full bg-slate-100 sm:h-96'>
            {activeImage ? (
              <img
                src={activeImage}
                alt={room.name}
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='flex h-full items-center justify-center text-slate-400'>
                Chưa có hình ảnh
              </div>
            )}
            <div className='absolute left-4 top-4 flex gap-2'>
              <span className='rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold text-white'>
                Hạng {room.roomType}
              </span>
              <span className='rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800'>
                📍 {room.location}
              </span>
            </div>
          </div>

          {room.images.length > 1 && (
            <div className='flex gap-3 overflow-x-auto p-4'>
              {room.images.map((imgUrl) => (
                <button
                  key={imgUrl}
                  type='button'
                  onClick={() => setActiveImage(imgUrl)}
                  className={`h-20 w-28 overflow-hidden rounded-lg border-2 transition ${
                    activeImage === imgUrl
                      ? 'border-indigo-600'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt='Room thumbnail'
                    className='h-full w-full object-cover'
                  />
                </button>
              ))}
            </div>
          )}

          <div className='space-y-4 border-t border-slate-100 p-6'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div>
                <p className='text-xs font-semibold uppercase text-slate-500'>
                  Số phòng #{room.roomNumber}
                </p>
                <h1 className='text-2xl font-extrabold text-slate-900'>
                  {room.name}
                </h1>
              </div>
              <div className='text-right'>
                <span className='block text-xs text-slate-500'>
                  Giá niêm yết / đêm
                </span>
                <span className='text-2xl font-extrabold text-indigo-600'>
                  {formatVnd(room.pricePerNight)}
                </span>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3'>
              <div>
                <span className='block text-xs text-slate-500'>Loại giường</span>
                <span className='font-semibold text-slate-800'>
                  🛏️ {room.bedType}
                </span>
              </div>
              <div>
                <span className='block text-xs text-slate-500'>
                  Sức chứa tối đa
                </span>
                <span className='font-semibold text-slate-800'>
                  👥 {room.capacity} khách
                </span>
              </div>
              <div>
                <span className='block text-xs text-slate-500'>
                  Trạng thái phòng
                </span>
                <span
                  className={`font-bold ${
                    room.status === 'AVAILABLE'
                      ? 'text-emerald-600'
                      : room.status === 'OCCUPIED'
                        ? 'text-indigo-600'
                        : 'text-amber-600'
                  }`}
                >
                  {room.status === 'AVAILABLE'
                    ? '● Sẵn sàng đón khách'
                    : room.status === 'OCCUPIED'
                      ? '● Đang có khách lưu trú'
                      : '● Đang bảo trì'}
                </span>
              </div>
            </div>

            <div>
              <h2 className='text-sm font-bold text-slate-900'>
                Mô tả chi tiết phòng
              </h2>
              <p className='mt-1 text-sm leading-relaxed text-slate-600'>
                {room.description}
              </p>
            </div>

            <div>
              <h2 className='text-sm font-bold text-slate-900'>
                Tiện nghi trang bị trong phòng
              </h2>
              <div className='mt-2 flex flex-wrap gap-2'>
                {room.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700'
                  >
                    ✓ {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Online Booking & Decorator/Strategy/Facade Checkout */}
      <div className='space-y-6'>
        <form
          onSubmit={handlePlaceBooking}
          className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'
        >
          <h2 className='text-lg font-bold text-slate-900'>
            Đặt phòng Trực tuyến
          </h2>
          <p className='text-xs text-slate-500'>
            Tích hợp Builder + Decorator + Strategy + Facade Pattern
          </p>

          <div className='mt-4 space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='mb-1 block text-xs font-semibold text-slate-700'>
                  Ngày nhận phòng
                </label>
                <VnDateInput
                  required
                  value={checkInDate}
                  onChange={(val) => setCheckInDate(val)}
                  className='w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus-within:border-indigo-600'
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-semibold text-slate-700'>
                  Ngày trả phòng
                </label>
                <VnDateInput
                  required
                  value={checkOutDate}
                  onChange={(val) => setCheckOutDate(val)}
                  className='w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus-within:border-indigo-600'
                />
              </div>
            </div>

            <div>
              <label className='mb-1 block text-xs font-semibold text-slate-700'>
                Số lượng khách (Tối đa {room.capacity} khách)
              </label>
              <input
                type='number'
                min={1}
                max={room.capacity}
                required
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none'
              />
            </div>

            {/* Decorator Pattern: Add-on Services */}
            <div>
              <label className='mb-1.5 block text-xs font-bold text-slate-800'>
                Dịch vụ đi kèm (Decorator Pattern):
              </label>
              <div className='space-y-2'>
                {ADDON_SERVICE_OPTIONS.map((opt) => {
                  const checked = selectedServices.includes(opt.type)
                  return (
                    <label
                      key={opt.type}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 text-xs transition ${
                        checked
                          ? 'border-indigo-600 bg-indigo-50/60'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={() => toggleAddonService(opt.type)}
                        className='mt-0.5 rounded text-indigo-600'
                      />
                      <div>
                        <span className='block font-semibold text-slate-800'>
                          {opt.title}
                        </span>
                        <span className='text-slate-500'>{opt.subtitle}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Strategy Pattern: Voucher Discount */}
            <div>
              <label className='mb-1 block text-xs font-bold text-slate-800'>
                Mã giảm giá (Strategy Pattern):
              </label>
              <input
                type='text'
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder='Nhập hoặc chọn mã bên dưới'
                className='w-full rounded-lg border border-slate-300 px-3 py-2 text-xs uppercase focus:border-indigo-600 focus:outline-none'
              />
              {vouchers.length > 0 ? (
                <div className='mt-2 flex flex-wrap gap-1.5'>
                  {vouchers
                    .filter((v) => {
                      const scope = v.applicableRoomTypes || 'ALL'
                      if (scope.toUpperCase() === 'ALL') {
                        return true
                      }
                      return scope
                        .split(',')
                        .map((s) => s.trim().toUpperCase())
                        .includes(room.roomType.toUpperCase())
                    })
                    .map((v) => (
                      <button
                        key={v.id}
                        type='button'
                        onClick={() =>
                          setVoucherCode(voucherCode === v.code ? '' : v.code)
                        }
                        className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                          voucherCode === v.code
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {v.code} (
                        {v.discountType === 'FIXED_AMOUNT'
                          ? `-${formatVnd(v.discountValue)}`
                          : `-${v.discountValue}%`}
                        {' • '}
                        {v.applicableRoomTypes === 'ALL'
                          ? 'Mọi phòng'
                          : v.applicableRoomTypes}
                        )
                      </button>
                    ))}
                </div>
              ) : (
                <p className='mt-1 text-[11px] text-slate-400'>
                  Hiện chưa có voucher nào đang mở (Admin có thể thêm trong mục
                  Quản lý Voucher).
                </p>
              )}
            </div>

            {/* Strategy Pattern: Payment Method */}
            <div>
              <label className='mb-1 block text-xs font-bold text-slate-800'>
                Phương thức Thanh toán (PaymentStrategy):
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethodType)
                }
                className='w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium focus:border-indigo-600 focus:outline-none'
              >
                <option value='E_WALLET'>
                  Ví điện tử VNPay / MoMo (Tự động duyệt CONFIRMED)
                </option>
                <option value='CREDIT_CARD'>
                  Thẻ Tín dụng Quốc tế Visa/Master (Tự động duyệt CONFIRMED)
                </option>
                <option value='PAY_AT_HOTEL'>
                  Thanh toán tại khách sạn (Trạng thái chờ duyệt PENDING)
                </option>
              </select>
            </div>

            <div>
              <label className='mb-1 block text-xs font-semibold text-slate-700'>
                Ghi chú đặc biệt
              </label>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder='VD: Phòng tầng cao, nhận phòng muộn...'
                className='w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none'
              />
            </div>

            {/* Live Price Breakdown */}
            {previewError && (
              <div className='rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700'>
                {previewError}
              </div>
            )}

            {preview && (
              <div className='space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs'>
                <div className='flex justify-between text-slate-600'>
                  <span>Tiền phòng gốc ({preview.nights} đêm):</span>
                  <span className='font-semibold text-slate-900'>
                    {formatVnd(preview.baseRoomCost)}
                  </span>
                </div>
                <div className='flex justify-between text-slate-600'>
                  <span>Dịch vụ đi kèm (Decorator):</span>
                  <span className='font-semibold text-slate-900'>
                    +{formatVnd(preview.addonServicesCost)}
                  </span>
                </div>
                {preview.discountAmount > 0 && (
                  <div className='flex justify-between text-emerald-700'>
                    <span>Giảm giá ({preview.appliedVoucherCode}):</span>
                    <span className='font-bold'>
                      -{formatVnd(preview.discountAmount)}
                    </span>
                  </div>
                )}
                <div className='border-t border-indigo-200 pt-2 flex justify-between text-sm font-extrabold text-indigo-900'>
                  <span>Tổng thanh toán:</span>
                  <span>{formatVnd(preview.totalAmount)}</span>
                </div>
                <p className='text-[11px] italic text-slate-500'>
                  Chuỗi Decorator: {preview.decoratorDescription}
                </p>
              </div>
            )}

            <button
              type='submit'
              disabled={submitting || room.status === 'MAINTENANCE' || !!previewError}
              className='w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50'
            >
              {submitting
                ? 'Đang xử lý đặt phòng...'
                : !user
                  ? 'Đăng nhập để Đặt phòng'
                  : paymentMethod === 'PAY_AT_HOTEL'
                    ? 'Xác nhận Đặt phòng (Thanh toán tại quầy)'
                    : 'Tiếp tục tới Cổng Thanh toán Online'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Cổng Thanh toán Trực tuyến (VietQR E-Wallet & Credit Card Sandbox) */}
      {showPaymentModal && preview && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm'>
          <div className='w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl'>
            <div className='flex items-center justify-between bg-indigo-900 px-6 py-4 text-white'>
              <div>
                <span className='text-[11px] font-semibold uppercase tracking-wider text-indigo-200'>
                  Strategy Pattern • Online Payment Gateway
                </span>
                <h3 className='text-base font-bold'>
                  {paymentMethod === 'E_WALLET'
                    ? 'Cổng Thanh toán QR Ví điện tử / Ngân hàng'
                    : 'Cổng Thanh toán Thẻ Quốc tế Visa / Master'}
                </h3>
              </div>
              <button
                type='button'
                onClick={() => setShowPaymentModal(false)}
                className='rounded-lg p-1 text-indigo-200 hover:bg-indigo-800 hover:text-white'
              >
                ✕
              </button>
            </div>

            <div className='space-y-4 p-6 text-xs text-slate-700'>
              <div className='rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-1.5'>
                <div className='flex justify-between'>
                  <span className='text-slate-500'>Phòng đặt:</span>
                  <span className='font-bold text-slate-900'>
                    #{room.roomNumber} - {room.name}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-slate-500'>Lịch lưu trú:</span>
                  <span className='font-semibold'>
                    {formatDateVn(checkInDate)} → {formatDateVn(checkOutDate)} ({preview.nights} đêm)
                  </span>
                </div>
                <div className='flex justify-between border-t border-slate-200 pt-1.5 text-sm font-extrabold text-indigo-700'>
                  <span>Số tiền thanh toán:</span>
                  <span>{formatVnd(preview.totalAmount)}</span>
                </div>
              </div>

              {paymentMethod === 'E_WALLET' ? (
                <div className='flex flex-col items-center space-y-3 text-center'>
                  <div className='overflow-hidden rounded-2xl border-2 border-indigo-600 bg-white p-2 shadow-sm'>
                    <img
                      src={`https://img.vietqr.io/image/MB-0333666999-compact2.png?amount=${preview.totalAmount}&addInfo=${encodeURIComponent(
                        `BOOKING ${room.roomNumber} ${checkInDate}`
                      )}&accountName=${encodeURIComponent('HOTEL BOOKING SYSTEM')}`}
                      alt='VietQR Payment Code'
                      className='h-56 w-56 object-contain'
                    />
                  </div>
                  <p className='text-[11px] text-slate-500'>
                    Mã QR đã tự động điền số tiền{' '}
                    <strong className='text-slate-800'>
                      {formatVnd(preview.totalAmount)}
                    </strong>{' '}
                    và nội dung đặt phòng{' '}
                    <strong className='text-slate-800'>
                      BOOKING {room.roomNumber}
                    </strong>
                    .
                  </p>
                  <div className='w-full rounded-lg bg-emerald-50 p-2.5 text-[11px] font-medium text-emerald-800 border border-emerald-200'>
                    ✓ Sau khi bấm xác nhận bên dưới,{' '}
                    <strong>EWalletPaymentStrategy</strong> sẽ ghi nhận trạng
                    thái <strong>PAID</strong>, tự động duyệt đơn sang{' '}
                    <strong>CONFIRMED</strong> và gửi Email hóa đơn chi tiết.
                  </div>
                </div>
              ) : (
                <div className='space-y-3'>
                  <div>
                    <label className='mb-1 block text-xs font-semibold text-slate-700'>
                      Số thẻ Tín dụng / Ghi nợ Quốc tế (Thẻ Sandbox)
                    </label>
                    <input
                      type='text'
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className='w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-indigo-600 focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='mb-1 block text-xs font-semibold text-slate-700'>
                      Tên in trên thẻ
                    </label>
                    <input
                      type='text'
                      value={cardHolder}
                      onChange={(e) =>
                        setCardHolder(e.target.value.toUpperCase())
                      }
                      className='w-full rounded-lg border border-slate-300 px-3 py-2 uppercase text-xs focus:border-indigo-600 focus:outline-none'
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <label className='mb-1 block text-xs font-semibold text-slate-700'>
                        Ngày hết hạn (MM/YY)
                      </label>
                      <input
                        type='text'
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className='w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-indigo-600 focus:outline-none'
                      />
                    </div>
                    <div>
                      <label className='mb-1 block text-xs font-semibold text-slate-700'>
                        Mã bảo mật CVV
                      </label>
                      <input
                        type='password'
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className='w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-indigo-600 focus:outline-none'
                      />
                    </div>
                  </div>
                  <div className='rounded-lg bg-emerald-50 p-2.5 text-[11px] font-medium text-emerald-800 border border-emerald-200'>
                    ✓ Khi bấm thanh toán,{' '}
                    <strong>CreditCardPaymentStrategy</strong> sẽ xử lý giao
                    dịch <strong>PAID</strong>, tự động chuyển trạng thái đơn
                    sang <strong>CONFIRMED</strong> và gửi Email hóa đơn.
                  </div>
                </div>
              )}

              <div className='flex gap-3 pt-2'>
                <button
                  type='button'
                  disabled={submitting}
                  onClick={() => setShowPaymentModal(false)}
                  className='w-1/3 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50'
                >
                  Quay lại
                </button>
                <button
                  type='button'
                  disabled={submitting}
                  onClick={() => void executeBookingSubmission()}
                  className='w-2/3 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50'
                >
                  {submitting
                    ? 'Đang xác thực giao dịch...'
                    : `Xác nhận Đã Thanh toán (${formatVnd(preview.totalAmount)})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoomDetailPage
