'use client'

import { useAppStore } from '@/store/useAppStore'
import OverviewTab from './tabs/OverviewTab'
import SwingTab from './tabs/SwingTab'
import QATab from './tabs/QATab'
import MonitorTab from './tabs/MonitorTab'

export default function TabRenderer() {
  const { activeTab } = useAppStore()

  switch (activeTab) {
    case 'overview':
      return <OverviewTab />
    case 'swing':
      return <SwingTab />
    case 'qa':
      return <QATab />
    case 'monitor':
      return <MonitorTab />
    default:
      return <OverviewTab />
  }
}
