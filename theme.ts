'use client'

import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
  },
  shape: {
    borderRadius: 10,
  },
})
