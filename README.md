# Nexus OS

A mobile-first, browser-based operating-system prototype with 33 app windows.

## App collection

- **Everyday:** Browser, File Manager, Calculator, Clock & Alarms, Weather, Calendar, Day Planner, Smart Reminder, Notes, Tasks, Widgets, Settings, Themes.
- **Media & creativity:** YouTube search/player, Online Music previews, Gallery, Camera, Voice Recorder, Paint, Photo & Video Studio, PDF Viewer, Book Reader, FM/Internet Radio, Mini Match.
- **Communication & discovery:** Phone Dialer handoff, Message Drafts, News Reader, Maps & Directions, Shop Finder, SOS & Emergency Help, Feedback.
- **Developer & utilities:** Safe demo Terminal, Security Center, Storage Cleaner, Screen Share & Casting, Nexus AI Companion UI, Mini App Store.

## What works in the web prototype

- App launcher and app search
- Local browser storage for notes, tasks, reminders, planner items, feedback, drafts, and camera captures
- Calculator, focus timer, paint canvas, poster creation, PDF selection, text-file reading, music previews, weather lookup, YouTube search, and browser-based camera/microphone/screen-share requests where supported
- Theme preferences saved on the current device
- Calls and SMS hand off to the phone app for user confirmation

## Important limitations

Nexus OS is a website, not a replacement Android operating system. Wi-Fi/Bluetooth switches are visual demos; websites cannot silently control Android settings, scan the whole device, lock other apps, record phone calls, or mirror the screen to a TV without native Android support and permissions. Nexus AI is currently a UI prototype and is not connected to a language model. Embedded sites and videos may be blocked by their providers.

## Run

Open the [live prototype](https://rameshkannan1472014-star.github.io/Nexus-OS/?v=25). The API source is in `server.py`; YouTube search requires the `YOUTUBE_API_KEY` environment variable on the backend.
