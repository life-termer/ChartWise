'use client'

import {
  List,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Box,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useAppStore } from '@/store/useAppStore'

export default function Favorites() {
  const { favorites, setSelectedStock, removeFavorite } = useAppStore()

  if (favorites.length === 0) return null

  return (
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
              pr: 1,
            }}
          >
            <ListItemText primary={fav} />
            <IconButton
              size="small"
              edge="end"
              onClick={(e) => {
                e.stopPropagation()
                removeFavorite(fav)
              }}
              sx={{ ml: 1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </ListItemButton>
        ))}
      </List>
    </>
  )
}
