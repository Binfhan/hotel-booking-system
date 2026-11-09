'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export interface AppShellProps {
  children: React.ReactNode
}

export const Navbar = ({ children }: AppShellProps): React.JSX.Element => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isAdminRoute = pathname?.startsWith('/admin')

  const handleLogout = (): void => {
    logout()
    router.push('/login')
  }

  // Standalone full-screen layout for Admin Portal (no Customer Header)
  if (isAdminRoute) {
    return <div className='min-h-screen bg-slate-100'>{children}</div>
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <header className='sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur'>
        <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6'>
          <div className='flex items-center gap-8'>
            <Link href='/' className='flex items-center gap-2.5'>
              <div>
                <span className='block text-base font-bold tracking-tight text-slate-900'>
                  Grand Luxury Hotel
                </span>
              </div>
            </Link>

            <nav className='hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex'>
              <Link href='/' className='transition hover:text-indigo-600'>
                Danh sách Phòng
              </Link>
              {user && (
                <Link
                  href='/my-bookings'
                  className='transition hover:text-indigo-600'
                >
                  Lịch sử Đặt phòng & Thông báo
                </Link>
              )}
              {user?.role === 'ROLE_ADMIN' && (
                <Link
                  href='/admin'
                  className='rounded-full bg-amber-50 px-3.5 py-1.5 font-semibold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100'
                >
                  Vào Trang Quản trị (Admin)
                </Link>
              )}
            </nav>
          </div>

          <div className='flex items-center gap-3'>
            {user ? (
              <div className='flex items-center gap-3'>
                <div className='text-right text-xs sm:block'>
                  <p className='font-semibold text-slate-900'>
                    {user.fullName}
                  </p>
                  <p className='text-slate-500'>
                    {user.role === 'ROLE_ADMIN'
                      ? 'Quản trị viên'
                      : 'Khách hàng'}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={handleLogout}
                  className='rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100'
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className='flex items-center gap-2.5'>
                <Link
                  href='/login'
                  className='rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'
                >
                  Đăng nhập
                </Link>
                <Link
                  href='/register'
                  className='rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700'
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6'>{children}</main>
    </div>
  )
}
