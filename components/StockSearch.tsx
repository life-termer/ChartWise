'use client'

import {
  TextField,
  Autocomplete,
  CircularProgress,
  IconButton,
  Box,
} from '@mui/material'
import StarIcon from '@mui/icons-material/Star'
import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

interface StockResult {
  description: string
  symbol: string
}

export default function StockSearch() {
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<StockResult[]>([])
  const [loading, setLoading] = useState(false)

  const {
    setSelectedStock,
    addFavorite,
    favorites,
  } = useAppStore()

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (!inputValue) return

      setLoading(true)

      fetch(`/api/search?q=${inputValue}`)
        .then((res) => res.json())
        .then((data) => {
          setOptions(data.result || [])
          console.log('Search results:', data.result)
        })
        .finally(() => setLoading(false))
    }, 500)

    return () => clearTimeout(delayDebounce)
  }, [inputValue])

  return (
    <Autocomplete
      freeSolo
      options={options}
      getOptionLabel={(option) =>
        typeof option === 'string'
          ? option
          : `${option.symbol} - ${option.description}`
      }
      loading={loading}
      onInputChange={(_, newInputValue) =>
        setInputValue(newInputValue)
      }
      onChange={(_, value) => {
        if (typeof value !== 'string' && value?.symbol) {
          setSelectedStock(value.symbol)
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder="Search stock..."
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress size={18} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        const isFavorite = favorites.includes(option.symbol)
        const { key, ...otherProps } = props

        return (
          <li key={key} {...otherProps}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center',
              }}
            >
              {option.symbol} - {option.description}

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  addFavorite(option.symbol)
                }}
              >
                <StarIcon
                  fontSize="small"
                  color={isFavorite ? 'warning' : 'disabled'}
                />
              </IconButton>
            </Box>
          </li>
        )
      }}
    />
  )
}
