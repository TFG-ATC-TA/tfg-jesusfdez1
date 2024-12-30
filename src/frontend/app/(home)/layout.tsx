'use client'

import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/layout/sidebar'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  if (!session) {
    return null
  }

  return (
    <div className="flex">
      <div className={cn('hidden lg:block')}>
        <Sidebar />
      </div>
      <main className="w-full flex-1 overflow-hidden p-5 sm:p-0 lg:mb-0 lg:mx-4 md:mx-4">
        {children}
      </main>
      <div className={cn('lg:hidden z-50')}>
        <MobileSidebar />
      </div>
    </div>
  )
}