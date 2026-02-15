'use client'

import { Box } from '@mui/material'
import Sidebar from '@/components/Sidebar'
import TabRenderer from '@/components/TabRenderer'

export default function DashboardPage() {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          overflow: 'auto',
        }}
      >
        <TabRenderer />
      </Box>
    </Box>
  )
}
