'use client'

import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  TextField,
} from '@mui/material'

import DashboardIcon from '@mui/icons-material/Dashboard'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import MonitorIcon from '@mui/icons-material/Monitor'
import StockSearch from './StockSearch'

import { useAppStore } from '@/store/useAppStore'
import { NavigationTab } from '@/types/navigation'

const drawerWidth = 260

const navItems: {
  label: string
  value: NavigationTab
  icon: React.ReactNode
}[] = [
  { label: 'Overview', value: 'overview', icon: <DashboardIcon /> },
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

        <StockSearch />

        {/* Favorites */}
        {favorites.length > 0 && (
          <>
            <Typography
              variant="caption"
              sx={{ mt: 2, display: 'block' }}
            >
              Favorites
            </Typography>

            <List dense>
                {favorites.map((fav) => (
                    <ListItemButton
                    key={fav}
                    onClick={() => setSelectedStock(fav)}
                    sx={{
                        borderRadius: 1,
                        mb: 0.5,
                    }}
                    >
                    <ListItemText primary={fav} />
                    </ListItemButton>
                ))}
                </List>

          </>
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
      </Box>
    </Drawer>
  )
}
