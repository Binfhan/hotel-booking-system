'use client'

import React, { useRef } from 'react'
import { formatDateVn } from '@/lib/api'

export interface VnDateInputProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  min?: string
  placeholder?: string
  className?: string
}

export const VnDateInput = ({
  value,
  onChange,
  required = false,
  min,
  placeholder = 'dd/mm/yyyy',
  className = ''
}: VnDateInputProps): React.JSX.Element => {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleOpenPicker = (): void => {
    const el = inputRef.current
    if (!el) {
      return
    }
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker()
        return
      } catch {
        // Fallback to focus
      }
    }
    el.focus()
  }

  return (
    <div
      onClick={handleOpenPicker}
      className={`relative flex cursor-pointer items-center justify-between bg-white ${className}`}
    >
      <span
        className={`select-none ${
          value ? 'text-slate-900 font-medium' : 'text-slate-400'
        }`}
      >
        {value ? formatDateVn(value) : placeholder}
      </span>
      <span className='pointer-events-none ml-2 text-slate-500'>📅</span>
      <input
        ref={inputRef}
        type='date'
        required={required}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
      />
    </div>
  )
}
