'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  CandlestickData,
  CandlestickSeries,
  LineSeries,
  LineStyle,
  ISeriesApi,
} from 'lightweight-charts'
import {
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { EMA, RSI } from 'technicalindicators'

interface Props {
  symbol: string
}

export default function StockChart({ symbol }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const rsiContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const rsiChartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [resolution, setResolution] = useState('60')
  const [syncInterval, setSyncInterval] = useState<'0' | '1' | '10' | '30'>('0')
  const [error, setError] = useState<string | null>(null)
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const chartsDisposedRef = useRef(false)
  const syncingRef = useRef(false)

  // Create chart once
  useEffect(() => {
    chartsDisposedRef.current = false
    if (!chartContainerRef.current || !rsiContainerRef.current) return

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
    emaSeriesRef.current = chartRef.current.addSeries(LineSeries, {
      color: '#2962FF',
      lineWidth: 2,
    })

    rsiChartRef.current = createChart(rsiContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#ffffff',
      },
      width: rsiContainerRef.current.clientWidth,
      height: 150,
      grid: {
        vertLines: { color: '#1f2a44' },
        horzLines: { color: '#1f2a44' },
      },
    })

    rsiSeriesRef.current = rsiChartRef.current.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 2,
    })

    rsiSeriesRef.current.createPriceLine({
      price: 70,
      color: '#ef4444',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
    })

    rsiSeriesRef.current.createPriceLine({
      price: 30,
      color: '#22c55e',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
    })

    const handleResize = () => {
      chartRef.current?.applyOptions({
        width: chartContainerRef.current!.clientWidth,
      })
      rsiChartRef.current?.applyOptions({
        width: rsiContainerRef.current!.clientWidth,
      })
    }

    const handleMainRangeChange = () => {
      if (chartsDisposedRef.current || syncingRef.current) return
      const mainTimeScale = chartRef.current?.timeScale()
      const rsiTimeScale = rsiChartRef.current?.timeScale()
      if (!mainTimeScale || !rsiTimeScale) return
      const logicalRange = mainTimeScale.getVisibleLogicalRange()
      if (!logicalRange) return
      syncingRef.current = true
      rsiTimeScale.setVisibleLogicalRange(logicalRange)
      syncingRef.current = false
    }

    const handleRsiRangeChange = () => {
      if (chartsDisposedRef.current || syncingRef.current) return
      const mainTimeScale = chartRef.current?.timeScale()
      const rsiTimeScale = rsiChartRef.current?.timeScale()
      if (!mainTimeScale || !rsiTimeScale) return
      const logicalRange = rsiTimeScale.getVisibleLogicalRange()
      if (!logicalRange) return
      syncingRef.current = true
      mainTimeScale.setVisibleLogicalRange(logicalRange)
      syncingRef.current = false
    }

    chartRef.current.timeScale().subscribeVisibleTimeRangeChange(handleMainRangeChange)
    rsiChartRef.current.timeScale().subscribeVisibleTimeRangeChange(handleRsiRangeChange)

    window.addEventListener('resize', handleResize)

    return () => {
      chartsDisposedRef.current = true
      window.removeEventListener('resize', handleResize)
      chartRef.current
        ?.timeScale()
        .unsubscribeVisibleTimeRangeChange(handleMainRangeChange)
      rsiChartRef.current
        ?.timeScale()
        .unsubscribeVisibleTimeRangeChange(handleRsiRangeChange)
      chartRef.current?.remove()
      rsiChartRef.current?.remove()
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (!seriesRef.current) return

    setError(null)
    const res = await fetch(
      `/api/candles?symbol=${symbol}&resolution=${resolution}`
    )
    const data = await res.json()

    if (data.error) {
      setError('Intraday data requires premium API. Showing daily data.')
      if (resolution !== 'D') {
        setResolution('D')
      }
      return
    }

    seriesRef.current?.setData(data.candles)
    const closes = data.candles.map((c: CandlestickData) => c.close)

    const emaValues = EMA.calculate({
      period: 20,
      values: closes,
    })

    const emaFormatted = data.candles
      .slice(20 - 1)
      .map((c: CandlestickData, i: number) => ({
        time: c.time,
        value: emaValues[i],
      }))

    emaSeriesRef.current!.setData(emaFormatted)

    const rsiPeriod = 14
    const rsiValues = RSI.calculate({
      period: rsiPeriod,
      values: closes,
    })

    const rsiFormatted = data.candles.map((c: CandlestickData, i: number) => {
      if (i < rsiPeriod) {
        return { time: c.time }
      }
      return {
        time: c.time,
        value: rsiValues[i - rsiPeriod],
      }
    })

    rsiSeriesRef.current?.setData(rsiFormatted as any)

  }, [symbol, resolution])

  // Fetch data when symbol or resolution changes
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-sync refresh
  useEffect(() => {
    if (syncInterval === '0') return
    const minutes = Number(syncInterval)
    const id = window.setInterval(() => {
      fetchData()
    }, minutes * 60 * 1000)

    return () => window.clearInterval(id)
  }, [fetchData, syncInterval])

  return (
    <Box>
      {error && (
        <Typography color="warning.main" sx={{ mb: 1, fontSize: '0.875rem' }}>
          {error}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <ToggleButtonGroup
          value={resolution}
          exclusive
          onChange={(_, value) => {
            if (value) setResolution(value)
          }}
          size="small"
        >
          <ToggleButton value="5">5m</ToggleButton>
          <ToggleButton value="15">15m</ToggleButton>
          <ToggleButton value="60">1h</ToggleButton>
          <ToggleButton value="D">1D</ToggleButton>
          <ToggleButton value="W">1W</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          value={syncInterval}
          exclusive
          onChange={(_, value) => {
            if (value) setSyncInterval(value)
          }}
          size="small"
        >
          <ToggleButton value="0">No sync</ToggleButton>
          <ToggleButton value="1">1m</ToggleButton>
          <ToggleButton value="10">10m</ToggleButton>
          <ToggleButton value="30">30m</ToggleButton>
        </ToggleButtonGroup>

        <Button variant="outlined" size="small" onClick={fetchData}>
          Refresh
        </Button>
      </Box>

      <Box ref={chartContainerRef} />
      <Box ref={rsiContainerRef} sx={{ mt: 2 }} />
    </Box>
  )
}
