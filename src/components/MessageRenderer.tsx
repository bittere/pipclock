import { cn } from '@/lib/utils'

interface MessageRendererProps {
  content: string
  className?: string
}

export default function MessageRenderer({ content, className }: MessageRendererProps) {
  // Check if content is HTML (starts with <) or plain text
  const isHtml = /<[a-z][\s\S]*>/i.test(content)

  // Helper to check if string is only emojis
  const isOnlyEmojis = (str: string) => {
    // Remove HTML tags if present to check content
    const textContent = str.replace(/<[^>]*>/g, '').trim()
    if (!textContent) return false
    
    // Remove all whitespace for checking
    const noSpaces = textContent.replace(/\s+/g, '')
    if (!noSpaces) return false
    
    // Simple but effective emoji detection
    // Check if every character is an emoji by testing against emoji ranges
    // This covers most common emojis including skin tones and combined emojis
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{200D}]/gu
    const hasEmoji = emojiRegex.test(noSpaces)
    
    // Check if it's ONLY emojis by removing all emoji characters and seeing if anything is left
    const withoutEmojis = noSpaces.replace(emojiRegex, '')
    
    return hasEmoji && withoutEmojis.length === 0
  }

  const isEmojiOnly = isOnlyEmojis(content)

  if (!isHtml) {
    return (
      <span className={cn(
        "whitespace-pre-wrap break-words", 
        isEmojiOnly && "text-4xl leading-relaxed",
        className
      )}>
        {content}
      </span>
    )
  }

  return (
    <div 
      className={cn(
        "prose dark:prose-invert max-w-none break-words",
        !isEmojiOnly && "prose-sm",
        "prose-p:my-1 prose-p:leading-normal",
        "prose-pre:bg-muted prose-pre:p-2 prose-pre:rounded-md prose-pre:my-1",
        "prose-code:bg-muted/50 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-ul:my-1 prose-ul:pl-4",
        "prose-ol:my-1 prose-ol:pl-4",
        "prose-li:my-0",
        "prose-blockquote:border-l-2 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-1",
        isEmojiOnly && "text-5xl leading-relaxed",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
