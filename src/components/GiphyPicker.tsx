import { useState, useCallback, useMemo } from 'react'
import { Grid } from '@giphy/react-components'
import { GiphyFetch } from '@giphy/js-fetch-api'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface GiphyPickerProps {
  onGifSelect: (gifUrl: string, gifId: string) => void
  apiKey: string
}

export default function GiphyPicker({ onGifSelect, apiKey }: GiphyPickerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const giphyFetch = useMemo(() => new GiphyFetch(apiKey), [apiKey])

  const fetchGifs = useCallback(
    (offset: number) => {
      if (searchTerm.trim()) {
        return giphyFetch.search(searchTerm, { offset, limit: 20 })
      }
      return giphyFetch.trending({ offset, limit: 20 })
    },
    [searchTerm, giphyFetch]
  )

  const handleGifSelect = (gif: any, e?: React.MouseEvent) => {
    // Prevent default Giphy navigation
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    // Use fixed_width rendition for preview in grid, but send downsized for actual use
    const gifUrl = gif.images.downsized_medium?.url || gif.images.downsized?.url || gif.images.original?.url
    onGifSelect(gifUrl, gif.id)
  }

  const handleGridClick = (e: React.MouseEvent) => {
    // Prevent any link navigation within the grid
    const target = e.target as HTMLElement
    if (target.closest('a')) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-background rounded-lg border border-border/50 w-full min-w-[420px]">
      <div className="relative">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search GIFs..."
          className="rounded-lg bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="giphy-grid-wrapper max-h-[400px]" onClick={handleGridClick}>
        <Grid
          key={searchTerm}
          width={370}
          columns={2}
          gutter={6}
          fetchGifs={fetchGifs}
          onGifClick={(gif, e) => handleGifSelect(gif, e as any)}
          hideAttribution={false}
          noResultsMessage={
            <div className="text-center py-8 text-muted-foreground text-sm">
              No GIFs found for "{searchTerm}"
            </div>
          }
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Powered by GIPHY
      </p>
    </div>
  )
}
