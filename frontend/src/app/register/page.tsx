'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { hotelApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const RegisterPage = (): React.JSX.Element => {
  const [fullName, setFullName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const { saveSession } = useAuth()
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const authData = await hotelApi.register(fullName, email, password, phone)
      saveSession(authData)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='mx-auto max-w-md py-10'>
      <div className='rounded-2xl border border-slate-200 bg-white p-8 shadow-sm'>
        <h1 className='text-2xl font-bold text-slate-900'>Đăng ký Tài khoản</h1>
        <p className='mt-1 text-sm text-slate-500'>
          Tạo tài khoản khách hàng để đặt phòng và nhận ưu đãi.
        </p>

        {error && (
          <div className='mt-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700'>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className='mt-5 space-y-4'>
          <div>
            <label className='mb-1 block text-xs font-semibold text-slate-700'>
              Họ và tên
            </label>
            <input
              type='text'
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder='Nguyễn Văn A'
              className='w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none'
            />
          </div>

          <div>
            <label className='mb-1 block text-xs font-semibold text-slate-700'>
              Email
            </label>
            <input
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='ban@example.com'
              className='w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none'
            />
          </div>

          <div>
            <label className='mb-1 block text-xs font-semibold text-slate-700'>
              Số điện thoại
            </label>
            <input
              type='text'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder='0901234567'
              className='w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none'
            />
          </div>

          <div>
            <label className='mb-1 block text-xs font-semibold text-slate-700'>
              Mật khẩu (tối thiểu 6 ký tự)
            </label>
            <input
              type='password'
              required
              minLength={6}
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
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
          </button>
        </form>

        <p className='mt-5 text-center text-xs text-slate-500'>
          Đã có tài khoản?{' '}
          <Link
            href='/login'
            className='font-semibold text-indigo-600 hover:underline'
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
