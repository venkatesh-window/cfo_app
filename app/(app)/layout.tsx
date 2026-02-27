import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppSidebar from '@/components/app-sidebar'
import MobileNav from '@/components/mobile-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar userName={user.name} />
      <div className="flex flex-col flex-1 min-w-0">
        <MobileNav userName={user.name} />
        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
