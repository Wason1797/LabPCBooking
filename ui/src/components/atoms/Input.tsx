import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export function Input({ invalid, className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-md border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-2 focus:outline-offset-0 ${
        invalid
          ? 'border-rose-400 focus:outline-rose-500'
          : 'border-slate-300 focus:outline-indigo-500'
      } ${className}`}
      {...props}
    />
  )
}
