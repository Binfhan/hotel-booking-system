'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { formatVnd, hotelApi } from '@/lib/api'
import { VnDateInput } from '@/components/VnDateInput'
import type { RoomCategoryItem, RoomFilterParams, RoomItem } from '@/types/hotel'

const HomePage = (): React.JSX.Element => {
  const [rooms, setRooms] = useState<RoomItem[]>([])
  const [categories, setCategories] = useState<RoomCategoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const [keyword, setKeyword] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [roomType, setRoomType] = useState<string>('')
  const [minGuests, setMinGuests] = useState<string>('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [checkInDate, setCheckInDate] = useState<string>('')
  const [checkOutDate, setCheckOutDate] = useState<string>('')

  const fetchRooms = useCallback(
    async (filters?: RoomFilterParams): Promise<void> => {
      setLoading(true)
      setError('')
      try {
        const data = await hotelApi.getRooms(filters)
        setRooms(data)
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Không thể kết nối tới Backend Spring Boot (http://localhost:8080)'
        setError(msg)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    void fetchRooms()
    hotelApi
      .getRoomCategories()
      .then((cats) => setCategories(cats))
      .catch(() => {})
  }, [fetchRooms])

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault()
    void fetchRooms({
      keyword,
      location,
      roomType,
      minGuests,
      minPrice,
      maxPrice,
      checkInDate,
      checkOutDate
    })
  }

  const handleReset = (): void => {
    setKeyword('')
    setLocation('')
    setRoomType('')
    setMinGuests('')
    setMinPrice('')
    setMaxPrice('')
    setCheckInDate('')
    setCheckOutDate('')
    void fetchRooms()
  }

  return (
    <div className='space-y-8'>
      {/* Hero Banner */}
      <section className='rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 text-white shadow-lg'>
        <div className='max-w-3xl space-y-3'>
          <span className='inline-block rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-200'>
            Kiến trúc Spring Boot MVC + 6+ Design Patterns
          </span>
          <h1 className='text-3xl font-extrabold tracking-tight sm:text-4xl'>
            Trải nghiệm kỳ nghỉ đẳng cấp tại Grand Luxury Hotel
          </h1>
          <p className='text-sm text-indigo-100 sm:text-base'>
            Tìm kiếm phòng theo tên hoặc địa điểm, lọc theo sức chứa, khoảng giá
            và ngày lưu trú. Đặt phòng trực tuyến kèm các dịch vụ phụ trợ linh
            hoạt và áp dụng mã ưu đãi tức thì.
          </p>
        </div>

        {/* Multi-criteria Filter Form (Builder Pattern: RoomSearchCriteria) */}
        <form
          onSubmit={handleSearch}
          className='mt-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 text-slate-800 shadow-md sm:grid-cols-2 lg:grid-cols-4'
        >
          <div>
            <label className='mb-1 block text-xs font-semibold text-slate-600'>
              Tên phòng / Từ khóa
            </label>
            <input
              type='text'
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder='VD: Ocean, Suite, P101...'
              className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none'
            />
          </div>

          <div>
            <label className='mb-1 block text-xs font-semibold text-slate-600'>
              Địa điểm / Chi nhánh
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none'
            >
              <option value=''>Tất cả địa điểm</option>
              <option value='Đà Nẵng'>Đà Nẵng</option>
              <option value='Nha Trang'>Nha Trang</option>
              <option value='Đà Lạt'>Đà Lạt</option>
              <option value='Phú Quốc'>Phú Quốc</option>
              <option value='TP. Hồ Chí Minh'>TP. Hồ Chí Minh</option>
            </select>
          </div>

          <div>
            <label className='mb-1 block text-xs font-semibold text-slate-600'>
              Hạng phòng (Factory Type)
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none'
            >
              <option value=''>Tất cả hạng phòng</option>
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.code}>
                    {cat.code} ({cat.name})
                  </option>
                ))
              ) : (
                <>
                  <option value='STANDARD'>STANDARD (Tiêu chuẩn)</option>
                  <option value='DELUXE'>DELUXE (Cao cấp)</option>
                  <option value='SUITE'>SUITE (Thượng hạng)</option>
                </>
              )}
            </select>
          </div>

          <div className='grid grid-cols-3 gap-2'>
            <div>
              <label className='mb-1 block text-xs font-semibold text-slate-600'>
                Số khách
              </label>
              <input
                type='number'
                min={1}
                max={10}
                value={minGuests}
                onChange={(e) => setMinGuests(e.target.value)}
                placeholder='VD: 2'
                className='w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:border-indigo-600 focus:outline-none'
              />
            </div>
            <div>
              <label className='mb-1 block text-xs font-semibold text-slate-600'>
                Giá từ (VNĐ)
              </label>
              <input
                type='number'
                step={100000}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder='800k'
                className='w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:border-indigo-600 focus:outline-none'
              />
            </div>
            <div>
              <label className='mb-1 block text-xs font-semibold text-slate-600'>
                Giá đến (VNĐ)
              </label>
              <input
                type='number'
                step={100000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder='3tr'
                className='w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:border-indigo-600 focus:outline-none'
              />
            </div>
          </div>

          <div>
            <label className='mb-1 block text-xs font-semibold text-slate-600'>
              Ngày nhận phòng (Check-in)
            </label>
            <VnDateInput
              value={checkInDate}
              onChange={(val) => setCheckInDate(val)}
              placeholder='Chọn ngày (dd/mm/yyyy)'
              className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-within:border-indigo-600'
            />
          </div>

          <div>
            <label className='mb-1 block text-xs font-semibold text-slate-600'>
              Ngày trả phòng (Check-out)
            </label>
            <VnDateInput
              value={checkOutDate}
              onChange={(val) => setCheckOutDate(val)}
              placeholder='Chọn ngày (dd/mm/yyyy)'
              className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-within:border-indigo-600'
            />
          </div>

          <div className='flex items-end gap-2 sm:col-span-2'>
            <button
              type='submit'
              className='flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700'
            >
              Tìm kiếm & Lọc phòng
            </button>
            <button
              type='button'
              onClick={handleReset}
              className='rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100'
            >
              Đặt lại
            </button>
          </div>
        </form>
      </section>

      {/* Room List */}
      <section className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-bold text-slate-900'>
              Danh sách Phòng Khách sạn ({rooms.length} phòng)
            </h2>
            <p className='text-xs text-slate-500'>
              Bộ lọc tìm kiếm được xử lý qua Builder Pattern
              (RoomSearchCriteria) tại tầng Backend
            </p>
          </div>
        </div>

        {error && (
          <div className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
            <p className='font-semibold'>Không thể tải dữ liệu từ Backend:</p>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className='h-80 animate-pulse rounded-2xl bg-slate-200'
              />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className='rounded-2xl border border-slate-200 bg-white p-12 text-center'>
            <p className='text-base font-semibold text-slate-700'>
              Không tìm thấy phòng phù hợp với tiêu chí lọc.
            </p>
            <p className='mt-1 text-sm text-slate-500'>
              Hãy thử nới lỏng khoảng giá hoặc chọn địa điểm khác.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {rooms.map((room) => (
              <div
                key={room.id}
                className='group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md'
              >
                <div className='relative h-52 w-full overflow-hidden bg-slate-100'>
                  {room.images?.[0] ? (
                    <img
                      src={room.images[0]}
                      alt={room.name}
                      className='h-full w-full object-cover transition duration-300 group-hover:scale-105'
                    />
                  ) : (
                    <div className='flex h-full items-center justify-center text-sm text-slate-400'>
                      Chưa có hình ảnh
                    </div>
                  )}
                  <div className='absolute left-3 top-3 flex gap-2'>
                    <span className='rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur'>
                      {room.roomType}
                    </span>
                    <span className='rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm'>
                      📍 {room.location}
                    </span>
                  </div>
                  <div className='absolute right-3 top-3'>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        room.status === 'AVAILABLE'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {room.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Bảo trì'}
                    </span>
                  </div>
                </div>

                <div className='flex flex-1 flex-col justify-between p-5'>
                  <div className='space-y-2.5'>
                    <div className='flex items-center justify-between text-xs text-slate-500'>
                      <span>Mã phòng: #{room.roomNumber}</span>
                      <span>👥 Tối đa {room.capacity} khách</span>
                    </div>
                    <h3 className='text-lg font-bold text-slate-900'>
                      {room.name}
                    </h3>
                    <p className='text-xs font-medium text-indigo-600'>
                      🛏️ {room.bedType}
                    </p>
                    <p className='line-clamp-2 text-xs text-slate-600'>
                      {room.description}
                    </p>

                    <div className='flex flex-wrap gap-1.5 pt-1'>
                      {room.amenities.slice(0, 4).map((amenity) => (
                        <span
                          key={amenity}
                          className='rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600'
                        >
                          {amenity}
                        </span>
                      ))}
                      {room.amenities.length > 4 && (
                        <span className='rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600'>
                          +{room.amenities.length - 4} tiện nghi
                        </span>
                      )}
                    </div>
                  </div>

                  <div className='mt-5 flex items-center justify-between border-t border-slate-100 pt-4'>
                    <div>
                      <span className='block text-xs text-slate-500'>
                        Giá mỗi đêm
                      </span>
                      <span className='text-lg font-extrabold text-indigo-600'>
                        {formatVnd(room.pricePerNight)}
                      </span>
                    </div>
                    <Link
                      href={`/rooms/${room.id}`}
                      className='rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-600'
                    >
                      Xem chi tiết & Đặt phòng
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default HomePage
