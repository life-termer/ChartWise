'use client'

import { useState } from 'react'
import { Box, Button, TextField, Typography } from '@mui/material'

export default function DashboardLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Invalid password')
      }
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Box
        sx={{
          width: 360,
          maxWidth: '100%',
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 3,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Dashboard Login
        </Typography>

        <TextField
          label="Password"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleLogin()
          }}
          sx={{ mb: 2 }}
        />

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          fullWidth
          onClick={handleLogin}
          disabled={loading || !password}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </Box>
    </Box>
  )
}
