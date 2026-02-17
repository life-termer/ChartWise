'use client'

import { useState } from 'react'

import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Button,
  TextField,
} from '@mui/material'

import DashboardIcon from '@mui/icons-material/Dashboard'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import MonitorIcon from '@mui/icons-material/Monitor'
import InsightsIcon from '@mui/icons-material/Insights'
import StockSearch from './StockSearch'

import { useAppStore } from '@/store/useAppStore'
import { NavigationTab } from '@/types/navigation'
import Favorites from './Favorites'

const drawerWidth = 260

const navItems: {
  label: string
  value: NavigationTab
  icon: React.ReactNode
}[] = [
  { label: 'Overview', value: 'overview', icon: <DashboardIcon /> },
  { label: 'Market Overview', value: 'market-overview', icon: <InsightsIcon /> },
  { label: 'Swing Plan', value: 'swing', icon: <TrendingUpIcon /> },
  { label: 'Q&A', value: 'qa', icon: <QuestionAnswerIcon /> },
  { label: 'Monitor', value: 'monitor', icon: <MonitorIcon /> },
]

export default function Sidebar() {
  const {
    activeTab,
    setActiveTab,
    favorites,
    setSelectedStock,
  } = useAppStore()

  const [customSymbol, setCustomSymbol] = useState('')

  const handleAddCustomSymbol = () => {
    const symbol = customSymbol.trim().toUpperCase()
    if (!symbol) return
    setSelectedStock(symbol)
    setCustomSymbol('')
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          ChartWise
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            label="Custom stock"
            value={customSymbol}
            onChange={(e) => setCustomSymbol(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddCustomSymbol()
              }
            }}
            fullWidth
          />
          <Button
            variant="outlined"
            size="small"
            onClick={handleAddCustomSymbol}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add
          </Button>
        </Box>

        <StockSearch />

        {/* Favorites */}
        {favorites.length > 0 && (
          <Favorites />
        )}

        <Divider sx={{ my: 2 }} />

        {/* Navigation */}
        <List>
          {navItems.map((item) => (
            <ListItemButton
              key={item.value}
              selected={activeTab === item.value}
              onClick={() => setActiveTab(item.value)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>

        <Button
          variant="outlined"
          size="small"
          sx={{ mt: 2 }}
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.reload()
          }}
        >
          Sign out
        </Button>
      </Box>
    </Drawer>
  )
}
