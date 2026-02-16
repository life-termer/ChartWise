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
  TextField,
  Typography,
} from '@mui/material'
import { useAppStore } from '@/store/useAppStore'
import StockChart from '../StockChart'
import { useRef, useState } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import ReactMarkdown from 'react-markdown'
import { StockChartHandle } from '../StockChart'

export default function OverviewTab() {
  const {
    selectedStock,
    stockAnalysisMessages,
    addStockAnalysisMessage,
    removeStockAnalysisMessage,
  } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isPatternLoading, setIsPatternLoading] = useState(false)
  const [shares, setShares] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const chartRef = useRef<StockChartHandle | null>(null)

  if (!selectedStock) {
    return <Typography>Select a stock to see overview.</Typography>
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {selectedStock} Overview
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <StockChart symbol={selectedStock} ref={chartRef} />
        </Box>

        <Box
          sx={{
            width: 280,
            minWidth: 240,
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: 2,
          }}
        >
          <Button
            variant="contained"
            fullWidth
            onClick={async () => {
              if (!selectedStock) return
              const images = chartRef.current?.getChartImages?.()
              if (!images?.mainChart || !images?.rsiChart) {
                addStockAnalysisMessage({
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  symbol: selectedStock,
                  text: 'Chart images not ready. Please try again.',
                  createdAt: Date.now(),
                })
                return
              }

              const stockData = chartRef.current?.getStockData?.()

              setIsLoading(true)
              try {
                const res = await fetch('/api/stock-analysis', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    mainChart: images.mainChart,
                    rsiChart: images.rsiChart,
                    ...stockData,
                  }),
                })
                const data = await res.json()
                console.log('stockData:', stockData)

                if (!res.ok) {
                  throw new Error(
                    data?.error ||
                      `Failed to analyze (status ${res.status})`
                  )
                }

                addStockAnalysisMessage({
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  symbol: selectedStock,
                  text: data?.content || 'No response returned.',
                  createdAt: Date.now(),
                })
              } catch (error) {
                addStockAnalysisMessage({
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  symbol: selectedStock,
                  text:
                    error instanceof Error
                      ? error.message
                      : 'Failed to analyze chart. Please try again.',
                  createdAt: Date.now(),
                })
              } finally {
                setIsLoading(false)
              }
            }}
            disabled={isLoading}
            sx={{ mb: 2 }}
          >
            {isLoading ? 'Analyzing...' : 'Analyze current chart'}
          </Button>

          <Typography variant="subtitle1" gutterBottom>
            Position & Pattern Analysis
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              size="small"
              label="Shares"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
            />

            <TextField
              size="small"
              label="Entry price"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
            />

            <TextField
              size="small"
              label="Stop loss"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
            />

            <Button
              variant="outlined"
              onClick={async () => {
                if (!selectedStock) return
                const images = chartRef.current?.getChartImages?.()
                if (!images?.mainChart || !images?.rsiChart) {
                  addStockAnalysisMessage({
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    symbol: selectedStock,
                    text: 'Chart images not ready. Please try again.',
                    createdAt: Date.now(),
                  })
                  return
                }

                setIsPatternLoading(true)
                try {
                  const res = await fetch('/api/pattern-analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      symbol: selectedStock,
                      shares,
                      entryPrice,
                      stopLoss,
                      resolution: chartRef.current?.getResolution?.(),
                      mainChart: images.mainChart,
                      rsiChart: images.rsiChart,
                    }),
                  })
                  const data = await res.json()

                  if (!res.ok) {
                    throw new Error(
                      data?.error ||
                        `Failed to analyze patterns (status ${res.status})`
                    )
                  }

                  addStockAnalysisMessage({
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    symbol: selectedStock,
                    text: data?.content || 'No response returned.',
                    createdAt: Date.now(),
                  })
                } catch (error) {
                  addStockAnalysisMessage({
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    symbol: selectedStock,
                    text:
                      error instanceof Error
                        ? error.message
                        : 'Failed to analyze patterns. Please try again.',
                    createdAt: Date.now(),
                  })
                } finally {
                  setIsPatternLoading(false)
                }
              }}
              disabled={isPatternLoading}
            >
              {isPatternLoading ? 'Analyzing patterns...' : 'Analyze patterns'}
            </Button>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          AI Analysis Output
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {stockAnalysisMessages.filter((m) => m.symbol === selectedStock)
          .length === 0 ? (
          <Typography color="text.secondary">
            No analysis messages yet.
          </Typography>
        ) : (
          <List>
            {stockAnalysisMessages
              .filter((m) => m.symbol === selectedStock)
              .map((msg) => (
                <ListItem key={msg.id} divider>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          fontSize: 15,
                          '& p': { m: 0, mb: 0.75, lineHeight: 1.4 },
                          '& ul': { pl: 2, mb: 0.75, mt: 0 },
                          '& li': { mb: 0.5 },
                          '& strong': { fontWeight: 600 },
                        }}
                      >
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </Box>
                    }
                    secondary={new Date(msg.createdAt).toLocaleString()}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => removeStockAnalysisMessage(msg.id)}
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
