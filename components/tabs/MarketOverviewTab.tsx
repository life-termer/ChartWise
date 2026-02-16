'use client'

import {
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAppStore } from '@/store/useAppStore'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

export default function MarketOverviewTab() {
  const {
    marketOverviewMessages,
    addMarketOverviewMessage,
    removeMarketOverviewMessage,
  } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/market-overview', {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data?.error ||
            `Failed to analyze market (status ${res.status})`
        )
      }

      addMarketOverviewMessage({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: data?.content || 'No response returned.',
        createdAt: Date.now(),
      })
    } catch (error) {
      addMarketOverviewMessage({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text:
          error instanceof Error
            ? error.message
            : 'Failed to analyze market. Please try again.',
        createdAt: Date.now(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Market Overview
      </Typography>

      <Button variant="contained" onClick={handleAnalyze} disabled={isLoading}>
        {isLoading ? 'Analyzing...' : 'Analyze'}
      </Button>

      <Divider sx={{ my: 2 }} />

      {marketOverviewMessages.length === 0 ? (
        <Typography color="text.secondary">
          No analysis messages yet.
        </Typography>
      ) : (
        <List>
          {marketOverviewMessages.map((msg) => (
            <ListItem key={msg.id} divider>
              <ListItemText
                primary={
                  <Box sx={{
                    '& p': { m: 0, mb: 1, lineHeight: 1.5 },
                    '& ul': { pl: 2, mb: 1, mt: 0 },
                    '& li': { mb: 0.5 },
                    '& strong': { fontWeight: 600 },
                  }}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </Box>
                }
                secondary={new Date(msg.createdAt).toLocaleString()}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => removeMarketOverviewMessage(msg.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
}
