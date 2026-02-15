'use client'

import { Box, Typography, Switch, Stack } from '@mui/material'
import { useState } from 'react'

export default function MonitorTab() {
  const [enabled, setEnabled] = useState(false)

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Real-Time Monitor
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center">
        <Typography>Enable AI Monitoring</Typography>
        <Switch
          checked={enabled}
          onChange={() => setEnabled(!enabled)}
        />
      </Stack>

      <Box
        sx={{
          mt: 4,
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 2,
        }}
      >
        Monitoring Status & Alerts
      </Box>
    </Box>
  )
}
