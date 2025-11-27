import { useEffect, useRef } from 'react'
import 'emoji-picker-element'

interface EmojiPickerProps {
  onEmojiClick: (emoji: string) => void
}

export default function EmojiPicker({ onEmojiClick }: EmojiPickerProps) {
  const pickerRef = useRef<any>(null)

  useEffect(() => {
    const picker = pickerRef.current
    if (!picker) return

    const handleEmojiClick = (event: Event) => {
      const customEvent = event as CustomEvent
      onEmojiClick(customEvent.detail.unicode)
    }

    picker.addEventListener('emoji-click', handleEmojiClick)
    return () => picker.removeEventListener('emoji-click', handleEmojiClick)
  }, [onEmojiClick])

  return (
    <div style={{ contain: 'content' }}>
      <emoji-picker ref={pickerRef} />
    </div>
  )
}
