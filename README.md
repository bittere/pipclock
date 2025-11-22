# PiP Clock

A simple picture-in-picture clock that displays the current time in 12-hour format (HH:MM).

## Features

- Big, clean clock display using Inter font
- Picture-in-Picture mode for a floating clock window
- High-resolution rendering for crisp text
- Compact PiP window with minimal padding

## Usage

1. **Start a local server:**
   ```bash
   python -m http.server 8000
   ```

2. **Open in browser:**
   Navigate to `http://localhost:8000`

3. **Enter Picture-in-Picture:**
   Click the "Enter Picture-in-Picture" button to pop out the clock into a floating window that stays on top while you work

## Technical Details

- Plain HTML, CSS, and JavaScript (no dependencies)
- Uses Canvas API to render clock for video stream
- Picture-in-Picture API for floating window
- Updates every second
- 12-hour format with zero-padded hours and minutes

## Browser Support

Requires a browser that supports the Picture-in-Picture API (Chrome, Edge, Safari, etc.)
