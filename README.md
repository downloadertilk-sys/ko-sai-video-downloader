# Ko Sai Video

Mobile-first video discovery and media utility UI built with Vite and Capacitor.

## Current features
- YouTube-inspired responsive video feed layout
- Search opens YouTube's official search page
- Official YouTube privacy-enhanced embed player for a supplied video URL
- MP3 quality selector: 128/192/256/320 kbps
- MP4 resolution selector: 360p/480p/720p/1080p/2K/4K
- Local history UI and dark/light theme

## Important limitations
- In-app YouTube search results require a YouTube Data API key and a backend/proxy to protect that key. The current UI opens official YouTube search instead.
- Quality selectors are UI only. Actual transcoding/export requires a media processing engine and must be used only with media the user owns or is authorized to download/convert. YouTube protected streams are not bypassed.
- YouTube playback uses the official embedded player.

## Development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
