'use client'

import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
} from '@mui/material'
import { useState } from 'react'

export default function QATab() {
  const [question, setQuestion] = useState('')

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Ask About Your Position
      </Typography>

      <Stack spacing={2} maxWidth={600}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Your question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <Button variant="contained">
          Ask AI
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
        AI Response
      </Box>
    </Box>
  )
}
