import React from 'react'
import type { Metadata } from 'next'
import '@/app/globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Grand Luxury Hotel - Hệ thống Quản lý Đặt phòng Khách sạn',
  description:
    'Hệ thống quản lý đặt phòng khách sạn trực tuyến với Java Spring Boot, MySQL và 6+ Design Patterns'
}

export interface RootLayoutProps {
  children: React.ReactNode
}

const RootLayout = ({ children }: RootLayoutProps): React.JSX.Element => {
  return (
    <html lang='vi'>
      <body className='min-h-screen bg-slate-50 text-slate-900 antialiased'>
        <AuthProvider>
          <Navbar>{children}</Navbar>
        </AuthProvider>
      </body>
    </html>
  )
}

export default RootLayout
