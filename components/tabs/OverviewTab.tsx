'use client'

import { Box, Typography } from '@mui/material'
import { useAppStore } from '@/store/useAppStore'

export default function OverviewTab() {
  const { selectedStock } = useAppStore()

  if (!selectedStock) {
    return <Typography>Select a stock to see overview.</Typography>
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {selectedStock} Overview
      </Typography>

      <Box
        sx={{
          height: 400,
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 2,
        }}
      >
        Chart Area (TradingView will go here)
      </Box>

      <Box
        sx={{
          mt: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 2,
        }}
      >
        AI Analysis Output
      </Box>
    </Box>
  )
}
