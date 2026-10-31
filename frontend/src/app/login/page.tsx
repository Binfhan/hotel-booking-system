'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { hotelApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const LoginPage = (): React.JSX.Element => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const { saveSession } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const authData = await hotelApi.login(email, password)
      saveSession(authData)
      if (authData.role === 'ROLE_ADMIN') {
        router.push('/admin')
        return
      }
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoAccount = (demoEmail: string, demoPass: string): void => {
    setEmail(demoEmail)
    setPassword(demoPass)
  }

  return (
    <div className='mx-auto max-w-md py-10'>
      <div className='rounded-2xl border border-slate-200 bg-white p-8 shadow-sm'>
        <h1 className='text-2xl font-bold text-slate-900'>
          Đăng nhập Hệ thống
        </h1>
        <p className='mt-1 text-sm text-slate-500'>
          Sử dụng tài khoản Khách hàng hoặc Quản trị viên để tiếp tục.
        </p>

        {/* Quick Demo Credentials */}
        <div className='mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600'>
          <p className='font-semibold text-slate-800'>
            Tài khoản Demo tạo sẵn (DataSeeder):
          </p>
          <div className='mt-2 flex gap-2'>
            <button
              type='button'
              onClick={() => fillDemoAccount('admin@hotel.com', 'admin123')}
              className='flex-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 font-semibold text-amber-800 hover:bg-amber-100'
            >
              Điền Admin (admin@hotel.com)
            </button>
            <button
              type='button'
              onClick={() => fillDemoAccount('user@hotel.com', 'user123')}
              className='flex-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 font-semibold text-indigo-700 hover:bg-indigo-100'
            >
              Điền User (user@hotel.com)
            </button>
          </div>
        </div>

        {error && (
          <div className='mt-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700'>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className='mt-5 space-y-4'>
          <div>
            <label className='mb-1 block text-xs font-semibold text-slate-700'>
              Email
            </label>
            <input
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='you@example.com'
              className='w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none'
            />
          </div>

          <div>
            <label className='mb-1 block text-xs font-semibold text-slate-700'>
              Mật khẩu
            </label>
            <input
              type='password'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='••••••••'
              className='w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none'
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50'
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <p className='mt-5 text-center text-xs text-slate-500'>
          Chưa có tài khoản?{' '}
          <Link
            href='/register'
            className='font-semibold text-indigo-600 hover:underline'
          >
            Đăng ký tài khoản mới
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
