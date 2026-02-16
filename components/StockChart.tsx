'use client'

import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  CandlestickData,
  CandlestickSeries,
  ISeriesApi,
} from 'lightweight-charts'
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

interface Props {
  symbol: string
}

export default function StockChart({ symbol }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [resolution, setResolution] = useState('D')
  const [error, setError] = useState<string | null>(null)

  // Create chart once
  useEffect(() => {
    if (!chartContainerRef.current) return

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1e293b' },
        textColor: '#ffffff',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#2e3c54' },
        horzLines: { color: '#2e3c54' },
      },
    })

    seriesRef.current = chartRef.current.addSeries(CandlestickSeries)

    const handleResize = () => {
      chartRef.current?.applyOptions({
        width: chartContainerRef.current!.clientWidth,
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartRef.current?.remove()
    }
  }, [])

  // Fetch data when symbol or resolution changes
  useEffect(() => {
    if (!seriesRef.current) return

    const fetchData = async () => {
      setError(null)
      const res = await fetch(
        `/api/candles?symbol=${symbol}&resolution=${resolution}`
      )
      const data = await res.json()

      console.log('Candle data:', data)

      if (data.error) {
        setError('Intraday data requires premium API. Showing daily data.')
        if (resolution !== 'D') {
          setResolution('D')
        }
        return
      }

      if (data.s !== 'ok') {
        console.error('Failed to fetch candle data:', data)
        setError('Failed to fetch chart data')
        return
      }

      const formatted: CandlestickData[] = data.t.map(
        (time: number, index: number) => ({
          time,
          open: data.o[index],
          high: data.h[index],
          low: data.l[index],
          close: data.c[index],
        })
      )

      seriesRef.current?.setData(formatted)
    }

    fetchData()
  }, [symbol, resolution])

  return (
    <Box>
      {error && (
        <Typography color="warning.main" sx={{ mb: 1, fontSize: '0.875rem' }}>
          {error}
        </Typography>
      )}
      <ToggleButtonGroup
        value={resolution}
        exclusive
        onChange={(_, value) => {
          if (value) setResolution(value)
        }}
        size="small"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="D">1D</ToggleButton>
        <ToggleButton value="W">1W</ToggleButton>
        <ToggleButton value="M">1M</ToggleButton>
      </ToggleButtonGroup>

      <Box ref={chartContainerRef} />
    </Box>
  )
}
