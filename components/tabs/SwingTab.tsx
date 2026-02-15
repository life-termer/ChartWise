'use client'

import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
} from '@mui/material'
import { useState } from 'react'

export default function SwingTab() {
  const [capital, setCapital] = useState('')
  const [risk, setRisk] = useState('')

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Swing Trading Plan
      </Typography>

      <Stack spacing={2} maxWidth={400}>
        <TextField
          label="Available Capital"
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
        />

        <TextField
          label="Risk per Trade (%)"
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
        />

        <Button variant="contained">
          Generate Plan
        </Button>
      </Stack>

      <Box
        sx={{
          mt: 4,
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 2,
        }}
      >
        AI Swing Plan Output
      </Box>
    </Box>
  )
}
