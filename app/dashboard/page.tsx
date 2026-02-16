import { cookies } from 'next/headers'
import DashboardClient from '@/components/DashboardClient'
import DashboardLogin from './DashboardLogin'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('chartwise_auth')?.value

  if (auth !== 'authorized') {
    return <DashboardLogin />
  }

  return <DashboardClient />
}
