import type { ReactNode } from 'react'

interface BookingLayoutProps {
  sidebar: ReactNode
  children: ReactNode
}

export function BookingLayout({ sidebar, children }: BookingLayoutProps) {
  return (
    <div className="flex min-h-full flex-col bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-6 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
            IAI
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              IAI Lab Booking
            </h1>
            <p className="text-xs text-slate-500">Admin console</p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-6 py-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-72">{sidebar}</aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
