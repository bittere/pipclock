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
  showPipNotifications: boolean
  onShowPipNotificationsChange: (value: boolean) => void
}

function getLuminance(hex: string) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance;
}

export function SettingsModal({ open, onOpenChange, isDark, toggleTheme, showPipNotifications, onShowPipNotificationsChange }: SettingsModalProps) {
  const [primaryColor, setPrimaryColor] = useState("#000000")

  // Load saved colors on mount
  useEffect(() => {
    const savedPrimary = localStorage.getItem("primaryColor")
    
    if (savedPrimary) {
      setPrimaryColor(savedPrimary)
      document.documentElement.style.setProperty("--primary", savedPrimary)
      const primaryLuminance = getLuminance(savedPrimary)
      const primaryForegroundColor = primaryLuminance > 0.5 ? "#18181b" : "#fafafa"
      document.documentElement.style.setProperty("--primary-foreground", primaryForegroundColor)
    }
  }, [])

  const handlePrimaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setPrimaryColor(color)
    document.documentElement.style.setProperty("--primary", color)
    localStorage.setItem("primaryColor", color)

    // Dynamically set foreground color
    const luminance = getLuminance(color)
    const foregroundColor = luminance > 0.5 ? "#18181b" : "#fafafa"
    document.documentElement.style.setProperty("--primary-foreground", foregroundColor)
  }

  const resetColors = () => {
    document.documentElement.style.removeProperty("--primary")
    document.documentElement.style.removeProperty("--primary-foreground")
    localStorage.removeItem("primaryColor")
    setPrimaryColor("#000000") // Reset to default (or whatever default is)
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
          <div className="flex items-center justify-between">
            <Label htmlFor="pip-notifications" className="text-right">
              Show PiP Notifications
            </Label>
            <Switch
              id="pip-notifications"
              checked={showPipNotifications}
              onCheckedChange={onShowPipNotificationsChange}
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
          <Button variant="outline" onClick={resetColors} className="mt-2">
            Reset to Defaults
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}