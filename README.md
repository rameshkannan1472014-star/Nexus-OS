# Nexus OS

A mobile-first, browser-based operating-system prototype with 33 app windows.

## App collection

- **Everyday:** Browser, File Manager, Calculator, Clock & Alarms, Weather, Calendar, Day Planner, Smart Reminder, Notes, Tasks, Widgets, Settings, Themes.
- **Media & creativity:** YouTube search/player, Online Music previews, Gallery, Camera, Voice Recorder, Paint, Photo & Video Studio, PDF Viewer, Book Reader, FM/Internet Radio, Mini Match.
- **Communication & discovery:** Phone Dialer handoff, Message Drafts, News Reader, Maps & Directions, Shop Finder, SOS & Emergency Help, Feedback.
- **Developer & utilities:** Safe demo Terminal, Security Center, Storage Cleaner, Screen Share & Casting, Nexus AI Companion UI, Mini App Store.

## New app design (v40, Batch 1)

YouTube, Files, Terminal, Browser, Calculator, Reminder, Weather and Settings use the new Nexus design from the UI reference board. The code lives in `nexus-apps.js` and `nexus-apps.css`, and every other app keeps its old window until its batch is redesigned.

- **YouTube:** home feed, Shorts row, Trending, subscriptions, and a watch history saved on the device
- **Files:** keeps the files you add on the device (IndexedDB) and groups them into categories, with storage use, search and preview
- **Terminal:** 3 tabs, a pretend file system saved on the device, mini Python, `neofetch`, and `open <app>`
- **Browser:** tabs, bookmarks, history, and a message for sites that block being shown inside apps
- **Calculator:** Basic, Scientific and Programmer modes, plus History, a unit Converter and a Graph plotter (uses a safe math parser, no `eval`)
- **Reminder:** All, Today and Upcoming lists, a calendar view, repeating reminders, and notifications
- **Weather:** live data from Open-Meteo, a GPS location button, the next 24 hours, 7 days, and updates to the home-screen weather card
- **Settings:** live connection and battery info, dark mode, brightness, accent colour, storage, permissions, and your name

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
