'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  createChart,
  ColorType,
  CandlestickData,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
  ISeriesApi,
} from 'lightweight-charts'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { EMA, RSI } from 'technicalindicators'
import ReactMarkdown from 'react-markdown'

interface Props {
  symbol: string
}

export interface StockChartHandle {
  getChartImages: () => {
    mainChart?: string
    rsiChart?: string
  }
  getResolution: () => string
  getStockData: () => any
}

const StockChart = forwardRef<StockChartHandle, Props>(function StockChart(
  { symbol },
  ref
) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const rsiContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const rsiChartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [resolution, setResolution] = useState('60')
  const [syncInterval, setSyncInterval] = useState<'0' | '1' | '10' | '30'>('0')
  const [error, setError] = useState<string | null>(null)
  const [autoPatternMessage, setAutoPatternMessage] = useState<string>('')
  const [autoPatternTime, setAutoPatternTime] = useState<number | null>(null)
  const [autoPatternLoading, setAutoPatternLoading] = useState(false)
  const [indicatorSelections, setIndicatorSelections] = useState<string[]>([
    'EMA',
    'Volume',
  ])
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const chartsDisposedRef = useRef(false)
  const syncingRef = useRef(false)
  const latestChartDataRef = useRef<any>(null)
  const showEma = indicatorSelections.includes('EMA')
  const showVolume = indicatorSelections.includes('Volume')

  useImperativeHandle(ref, () => ({
    getChartImages: () => {
      const mainCanvas = chartRef.current?.takeScreenshot?.() as
        | HTMLCanvasElement
        | undefined
      const rsiCanvas = rsiChartRef.current?.takeScreenshot?.() as
        | HTMLCanvasElement
        | undefined

      return {
        mainChart: mainCanvas?.toDataURL('image/png'),
        rsiChart: rsiCanvas?.toDataURL('image/png'),
      }
    },
    getResolution: () => resolution,
    getStockData: () => latestChartDataRef.current,
  }))

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

    volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
      priceScaleId: 'volume',
      color: 'rgba(34,197,94,0.6)',
    })

    chartRef.current.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
      visible: false,
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

  useEffect(() => {
    emaSeriesRef.current?.applyOptions({ visible: showEma })
  }, [showEma])

  useEffect(() => {
    volumeSeriesRef.current?.applyOptions({ visible: showVolume })
  }, [showVolume])

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

    const candles = Array.isArray(data?.candles) ? data.candles : []
    if (candles.length === 0) {
      setError('No candle data available for this symbol.')
      return
    }

    seriesRef.current?.setData(candles)
    const closes = candles.map((c: CandlestickData) => c.close)

    const emaValues = EMA.calculate({
      period: 20,
      values: closes,
    })

    const emaFormatted = candles
      .slice(20 - 1)
      .map((c: CandlestickData, i: number) => ({
        time: c.time,
        value: emaValues[i],
      }))

    emaSeriesRef.current!.setData(emaFormatted)

    const volumeFormatted = candles.map((c: CandlestickData) => {
      const candle = c as CandlestickData & { volume?: number }
      const volume = candle.volume ?? 0
      return {
        time: candle.time,
        value: volume,
        color:
          candle.close >= candle.open
            ? 'rgba(34,197,94,0.6)'
            : 'rgba(239,68,68,0.6)',
      }
    })

    volumeSeriesRef.current?.setData(volumeFormatted as any)

    const rsiPeriod = 14
    const rsiValues = RSI.calculate({
      period: rsiPeriod,
      values: closes,
    })

    const rsiFormatted = candles.map((c: CandlestickData, i: number) => {
      if (i < rsiPeriod) {
        return { time: c.time }
      }
      return {
        time: c.time,
        value: rsiValues[i - rsiPeriod],
      }
    })

    rsiSeriesRef.current?.setData(rsiFormatted as any)

    const latest = candles[candles.length - 1]
    const last30 = candles.slice(-30).map((c: CandlestickData) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))

    latestChartDataRef.current = {
      symbol,
      resolution,
      asOf: latest?.time ? new Date(latest.time * 1000).toISOString() : null,
      latestClose: latest?.close ?? null,
      latestRsi: rsiValues.length ? rsiValues[rsiValues.length - 1] : null,
      latestEma: emaValues.length ? emaValues[emaValues.length - 1] : null,
      last30,
    }
  }, [symbol, resolution])

  const runAutoPatternAnalysis = useCallback(async () => {
    const images = {
      mainChart: chartRef.current?.takeScreenshot?.()?.toDataURL('image/png'),
      rsiChart: rsiChartRef.current?.takeScreenshot?.()?.toDataURL('image/png'),
    }

    if (!images.mainChart || !images.rsiChart || !latestChartDataRef.current) {
      setAutoPatternMessage('Auto analysis unavailable (chart not ready).')
      setAutoPatternTime(Date.now())
      return
    }

    setAutoPatternLoading(true)
    try {
      const res = await fetch('/api/pattern-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...latestChartDataRef.current,
          mainChart: images.mainChart,
          rsiChart: images.rsiChart,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(
          data?.error || `Auto analysis failed (status ${res.status})`
        )
      }

      setAutoPatternMessage(data?.content || 'No response returned.')
      setAutoPatternTime(Date.now())
    } catch (err) {
      setAutoPatternMessage(
        err instanceof Error
          ? err.message
          : 'Auto analysis failed. Please try again.'
      )
      setAutoPatternTime(Date.now())
    } finally {
      setAutoPatternLoading(false)
    }
  }, [])

  // Fetch data when symbol or resolution changes
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-sync refresh
  useEffect(() => {
    if (syncInterval === '0') return
    const minutes = Number(syncInterval)
    const id = window.setInterval(() => {
      fetchData().then(() => runAutoPatternAnalysis())
    }, minutes * 60 * 1000)

    return () => window.clearInterval(id)
  }, [fetchData, runAutoPatternAnalysis, syncInterval])

  return (
    <Box>
      {error && (
        <Typography color="warning.main" sx={{ mb: 1, fontSize: '0.875rem' }}>
          {error}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          mb: 2,
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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


          <Button
            variant="outlined"
            size="small"
            onClick={async () => {
              await fetchData()
              await runAutoPatternAnalysis()
            }}
          >
            Refresh
          </Button>

          
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="indicators-label">Indicators</InputLabel>
            <Select
              labelId="indicators-label"
              multiple
              value={indicatorSelections}
              onChange={(event) => {
                const value = event.target.value
                setIndicatorSelections(
                  typeof value === 'string' ? value.split(',') : value
                )
              }}
              label="Indicators"
              renderValue={(selected) =>
                (selected as string[]).length
                  ? (selected as string[]).join(', ')
                  : 'None'
              }
            >
              <MenuItem value="EMA">
                <Checkbox checked={showEma} />
                <ListItemText primary="EMA" />
              </MenuItem>
              <MenuItem value="Volume">
                <Checkbox checked={showVolume} />
                <ListItemText primary="Volume" />
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        
      </Box>

      <Box ref={chartContainerRef} />
      <Box ref={rsiContainerRef} sx={{ mt: 2, mb: 2 }} />
      <Box
          sx={{
            minWidth: 320,
            maxWidth: "100%",
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: 2,
          }}
        >
          <Box
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              whiteSpace: 'pre-line',
            }}
          >
            {autoPatternLoading ? (
              'Analyzing...'
            ) : autoPatternMessage ? (
              <div className="stockchart-markdown">
                <ReactMarkdown>{autoPatternMessage}</ReactMarkdown>
              </div>
            ) : (
              'Waiting for next refresh.'
            )}
          </Box>
          {autoPatternTime && (
            <Typography variant="caption" color="text.secondary">
              {new Date(autoPatternTime).toLocaleTimeString()}
            </Typography>
          )}
        </Box>
    </Box>
  )
})

export default StockChart
