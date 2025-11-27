import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isDark: boolean
  toggleTheme: () => void
}

export function SettingsModal({ open, onOpenChange, isDark, toggleTheme }: SettingsModalProps) {
  const [primaryColor, setPrimaryColor] = useState("#000000")
  const [accentColor, setAccentColor] = useState("#ffffff")

  // Load saved colors on mount
  useEffect(() => {
    const savedPrimary = localStorage.getItem("primaryColor")
    const savedAccent = localStorage.getItem("accentColor")
    
    if (savedPrimary) {
      setPrimaryColor(savedPrimary)
      document.documentElement.style.setProperty("--primary", savedPrimary)
      // Also update ring/border to match if desired, or keep them separate
    }
    
    if (savedAccent) {
      setAccentColor(savedAccent)
      document.documentElement.style.setProperty("--accent", savedAccent)
    }
  }, [])

  const handlePrimaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setPrimaryColor(color)
    document.documentElement.style.setProperty("--primary", color)
    localStorage.setItem("primaryColor", color)
  }

  const handleAccentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setAccentColor(color)
    document.documentElement.style.setProperty("--accent", color)
    localStorage.setItem("accentColor", color)
  }

  const resetColors = () => {
    document.documentElement.style.removeProperty("--primary")
    document.documentElement.style.removeProperty("--accent")
    localStorage.removeItem("primaryColor")
    localStorage.removeItem("accentColor")
    setPrimaryColor("#000000") // Reset to default (or whatever default is)
    setAccentColor("#ffffff")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Appearance Settings</DialogTitle>
          <DialogDescription>
            Customize the look and feel of your clock.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="text-right">
              Dark Mode
            </Label>
            <Switch
              id="dark-mode"
              checked={isDark}
              onCheckedChange={toggleTheme}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="primary-color" className="text-right">
              Primary
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={handlePrimaryChange}
                className="w-12 h-8 p-1 cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{primaryColor}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="accent-color" className="text-right">
              Accent
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="accent-color"
                type="color"
                value={accentColor}
                onChange={handleAccentChange}
                className="w-12 h-8 p-1 cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{accentColor}</span>
            </div>
          </div>
          <Button variant="outline" onClick={resetColors} className="mt-2">
            Reset to Defaults
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
