'use client'

import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAppStore } from '@/store/useAppStore'
import { useState } from 'react'

export default function SwingTab() {
  const {
    selectedStock,
    swingPlanMessages = [],
    addSwingPlanMessage,
    removeSwingPlanMessage,
  } = useAppStore()
  const [capital, setCapital] = useState('')
  const [risk, setRisk] = useState('')
  const [stock, setStock] = useState(selectedStock || '')
  // userPrompt intentionally left empty for now

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Swing Trading Plan
      </Typography>

      <Stack spacing={2} maxWidth={400}>
        <TextField
          label="Stock name"
          value={stock}
          onChange={e => setStock(e.target.value)}
        />
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
        <Typography variant="subtitle1" gutterBottom>
          Swing Plan Output
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {swingPlanMessages.length === 0 ? (
          <Typography color="text.secondary">
            No swing plan messages yet.
          </Typography>
        ) : (
          <List>
            {swingPlanMessages.map((msg) => (
              <ListItem key={msg.id} divider>
                <ListItemText
                  primary={msg.text}
                  secondary={new Date(msg.createdAt).toLocaleString()}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => removeSwingPlanMessage(msg.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  )
}
