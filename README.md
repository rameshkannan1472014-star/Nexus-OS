# Nexus OS

A mobile-first, browser-based operating-system prototype with 33 app windows.

## App collection

- **Everyday:** Browser, File Manager, Calculator, Clock & Alarms, Weather, Calendar, Day Planner, Smart Reminder, Notes, Tasks, Widgets, Settings, Themes.
- **Media & creativity:** YouTube search/player, Online Music previews, Gallery, Camera, Voice Recorder, Paint, Photo & Video Studio, PDF Viewer, Book Reader, FM/Internet Radio, Mini Match.
- **Communication & discovery:** Phone Dialer handoff, Message Drafts, News Reader, Maps & Directions, Shop Finder, SOS & Emergency Help, Feedback.
- **Developer & utilities:** Safe demo Terminal, Security Center, Storage Cleaner, Screen Share & Casting, Nexus AI Companion UI, Mini App Store.

## New app design (v41, all apps)

All 38 apps now use the new Nexus design from the UI reference board: dark navy background, electric-blue accent, cards, tabs and bottom navigation.

| File | Apps |
|---|---|
| `nexus-apps.js` | Shared framework, YouTube, Files, Terminal, Browser, Calculator, Reminder, Weather, Settings |
| `nexus-apps-2.js` | Music, Clock (alarm, world clock, timer, stopwatch), News, Camera |
| `nexus-apps-3.js` | Phone (calls and contacts), Messages, Gallery, Themes |
| `nexus-apps-4.js` | Widgets, Nexus AI, Paint, PDF Viewer |
| `nexus-apps-5.js` | Maps, Photo & Video Generator, Day Planner, Calendar |
| `nexus-apps-6.js` | FM Radio, Store, Shop Finder, Feedback, Security (PIN lock), Mirror Casting |
| `nexus-apps-7.js` | Notes, Tasks, Recorder, Games, Books, SOS, Cleaner |
| `nexus-apps.css`, `nexus-apps-more.css` | Design tokens and styles |

Highlights:

- **Nexus AI** gives real answers (free Pollinations text AI, with a Wikipedia fallback) and can control Nexus: "open camera", "set alarm 6:30 am", "remind me to study at 7 pm", "play Anirudh songs", "weather in Chennai", "draw a robot on Mars".
- **Camera, Paint, Recorder and the Generator** save into Files, and their photos and videos show up in **Gallery**.
- **Music** plays 30-second iTunes previews, and **FM Radio** streams live Indian and world stations.
- **Phone and Messages** share one contact list. Calls and texts are handed to the phone's own dialler and SMS app.
- **Themes** changes the wallpaper (including your own photo), accent colour and icon shape. **Widgets** turns home-screen panels on or off.
- **Security** runs a safety check and can lock Nexus with a 4-digit PIN. **SOS** has a hold-to-call 112 button, location sharing, a torch and a siren.
- **Maps and Shop Finder** use OpenStreetMap. **Books** uses Open Library, and free books open in the Internet Archive reader.

Limits: free AI images are limited to about one a minute per network. Alarms ring only while Nexus is open. A website can't change Wi-Fi, Bluetooth or other phone system settings.

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
