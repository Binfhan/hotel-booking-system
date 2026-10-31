'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatVnd, hotelApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { BookingItem, NotificationItem } from '@/types/hotel'

const statusBadgeStyle = (status: string): string => {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-emerald-100 text-emerald-800'
    case 'CHECKED_IN':
      return 'bg-blue-100 text-blue-800'
    case 'CHECKED_OUT':
      return 'bg-slate-200 text-slate-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-amber-100 text-amber-800'
  }
}

const MyBookingsPage = (): React.JSX.Element => {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(
    null
  )
  const [loadingData, setLoadingData] = useState<boolean>(true)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  const loadData = useCallback(async (): Promise<void> => {
    setLoadingData(true)
    try {
      const [bookingList, notificationList] = await Promise.all([
        hotelApi.getMyBookings(),
        hotelApi.getMyNotifications()
      ])
      setBookings(bookingList)
      setNotifications(notificationList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải lịch sử đặt phòng')
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      void loadData()
    }
  }, [user, isLoading, router, loadData])

  const handleCancelBooking = async (bookingId: number): Promise<void> => {
    setError('')
    setMessage('')
    try {
      const updated = await hotelApi.cancelMyBooking(bookingId)
      setMessage(
        `Đã hủy và xóa đơn đặt phòng #${updated.bookingCode} thành công (State Pattern).`
      )
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(null)
      }
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể hủy đơn')
    }
  }

  const handleMarkNotificationRead = async (id: number): Promise<void> => {
    try {
      await hotelApi.markNotificationAsRead(id)
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      )
    } catch {
      // Ignore silent read update error
    }
  }

  const handleMarkAllRead = async (): Promise<void> => {
    try {
      const updated = await hotelApi.markAllNotificationsAsRead()
      setNotifications(updated)
    } catch {
      // Ignore silent read update error
    }
  }

  const filteredBookings = bookings.filter((b) =>
    statusFilter === 'ALL' ? true : b.status === statusFilter
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-2xl font-extrabold text-slate-900'>
          Lịch sử Đặt phòng & Thông báo của tôi
        </h1>
        <p className='text-sm text-slate-500'>
          Theo dõi trạng thái đơn đặt phòng (State Pattern) và thông báo tự động
          (Observer Pattern)
        </p>
      </div>

      {message && (
        <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800'>
          {message}
        </div>
      )}
      {error && (
        <div className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700'>
          {error}
        </div>
      )}

      <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
        {/* Bookings List */}
        <div className='space-y-4 lg:col-span-2'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <h2 className='text-lg font-bold text-slate-900'>
              Đơn đặt phòng đã đặt ({filteredBookings.length})
            </h2>
            <div className='flex flex-wrap gap-1.5'>
              {(['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type='button'
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st === 'ALL' ? 'Tất cả' : st}
                  </button>
                )
              )}
            </div>
          </div>

          {loadingData ? (
            <div className='h-60 animate-pulse rounded-2xl bg-slate-200' />
          ) : filteredBookings.length === 0 ? (
            <div className='rounded-2xl border border-slate-200 bg-white p-10 text-center'>
              <p className='font-semibold text-slate-700'>
                Không có đơn đặt phòng nào trong mục này.
              </p>
              <Link
                href='/'
                className='mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white'
              >
                Khám phá danh sách phòng ngay
              </Link>
            </div>
          ) : (
            filteredBookings.map((b) => (
              <div
                key={b.id}
                className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200'
              >
                <div className='flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3'>
                  <div>
                    <span className='text-xs font-bold text-indigo-600'>
                      Mã đơn: #{b.bookingCode}
                    </span>
                    <h3 className='text-base font-bold text-slate-900'>
                      {b.roomName} (Phòng {b.roomNumber} • {b.roomLocation})
                    </h3>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeStyle(
                        b.status
                      )}`}
                    >
                      {b.status}
                    </span>
                    {b.payment && (
                      <span className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700'>
                        TT: {b.payment.paymentStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div className='mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600 sm:grid-cols-4'>
                  <div>
                    <span className='block text-slate-400'>Nhận phòng</span>
                    <span className='font-semibold text-slate-800'>
                      {b.checkInDate}
                    </span>
                  </div>
                  <div>
                    <span className='block text-slate-400'>Trả phòng</span>
                    <span className='font-semibold text-slate-800'>
                      {b.checkOutDate} ({b.nights} đêm)
                    </span>
                  </div>
                  <div>
                    <span className='block text-slate-400'>Số khách</span>
                    <span className='font-semibold text-slate-800'>
                      {b.guestCount} khách
                    </span>
                  </div>
                  <div>
                    <span className='block text-slate-400'>Tổng cộng</span>
                    <span className='text-sm font-extrabold text-indigo-600'>
                      {formatVnd(b.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className='mt-4 flex flex-wrap items-center justify-between gap-2 pt-2'>
                  <button
                    type='button'
                    onClick={() =>
                      setSelectedBooking(
                        selectedBooking?.id === b.id ? null : b
                      )
                    }
                    className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50'
                  >
                    {selectedBooking?.id === b.id
                      ? 'Ẩn chi tiết'
                      : 'Xem chi tiết Booking'}
                  </button>

                  {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                    <button
                      type='button'
                      onClick={() => void handleCancelBooking(b.id)}
                      className='rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100'
                    >
                      Hủy đặt phòng
                    </button>
                  )}
                </div>

                {selectedBooking?.id === b.id && (
                  <div className='mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-700'>
                    <p className='font-bold text-slate-900'>
                      Chi tiết cấu thành chi phí (Decorator & Strategy):
                    </p>
                    <p className='italic text-slate-600'>
                      {b.costBreakdownDescription}
                    </p>
                    <div className='grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4'>
                      <div>
                        Tiền phòng gốc:{' '}
                        <strong>{formatVnd(b.baseRoomCost)}</strong>
                      </div>
                      <div>
                        Dịch vụ đi kèm:{' '}
                        <strong>{formatVnd(b.addonServicesCost)}</strong>
                      </div>
                      <div>
                        Mã giảm giá ({b.voucherCode || 'Không'}):{' '}
                        <strong className='text-emerald-700'>
                          -{formatVnd(b.discountAmount)}
                        </strong>
                      </div>
                      <div>
                        Phương thức TT:{' '}
                        <strong>
                          {b.payment?.paymentMethod} ({b.payment?.transactionRef}
                          )
                        </strong>
                      </div>
                    </div>
                    {b.specialRequests && (
                      <p>
                        Ghi chú khách hàng: <strong>{b.specialRequests}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Notifications Column (Observer Pattern) */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-bold text-slate-900'>
              Thông báo Hệ thống ({unreadCount} mới / {notifications.length})
            </h2>
            {unreadCount > 0 && (
              <button
                type='button'
                onClick={() => void handleMarkAllRead()}
                className='text-xs font-semibold text-indigo-600 hover:underline'
              >
                Đọc tất cả
              </button>
            )}
          </div>
          <div className='space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
            {notifications.length === 0 ? (
              <p className='text-xs text-slate-500'>Chưa có thông báo mới.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-xl border p-3 text-xs transition ${
                    n.read
                      ? 'border-slate-100 bg-slate-50/70 opacity-80'
                      : 'border-indigo-200 bg-indigo-50/60 shadow-sm'
                  }`}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <p className='font-bold text-slate-900'>
                      {!n.read && (
                        <span className='mr-1.5 inline-block h-2 w-2 rounded-full bg-indigo-600' />
                      )}
                      {n.title}
                    </p>
                    {!n.read && (
                      <button
                        type='button'
                        onClick={() => void handleMarkNotificationRead(n.id)}
                        className='shrink-0 rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
                      >
                        Đã đọc
                      </button>
                    )}
                  </div>
                  <p className='mt-1 text-slate-600'>{n.message}</p>
                  <p className='mt-1.5 text-[10px] text-slate-400'>
                    {new Date(n.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyBookingsPage
