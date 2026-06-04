# iL3 MuziQ

Zambia's Finest Music Experience - A modern music player with Zambian cultural aesthetics.

## Features

- 3D animated "iL3 MuziQ" logo
- Victoria Falls waterfall animations
- Zambian cultural color theme (Green, Red, Black, Orange)
- Audio visualizer with African drum pulse effects
- ReplayGain support (Track/Album normalization)
- Gapless playback with Web Audio API
- Queue management with shuffle/repeat
- Search across artists, albums, and tracks
- Responsive design for mobile and desktop

## Tech Stack

- Vue 3 + TypeScript
- Vite
- Pinia (State Management)
- Bootstrap 5
- Web Audio API

## Getting Started

### Prerequisites

You need a **Subsonic-compatible music server** to use iL3 MuziQ. We recommend **Navidrome**.

### Setting Up Navidrome (Music Server)

#### Option 1: Docker (Recommended)

```bash
docker run -d \
  --name navidrome \
  --restart=unless-stopped \
  -v /path/to/music:/music:ro \
  -v /path/to/data:/data \
  -p 4533:4533 \
  deluan/navidrome:latest
```

#### Option 2: Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: "3"
services:
  navidrome:
    image: deluan/navidrome:latest
    container_name: navidrome
    restart: unless-stopped
    ports:
      - "4533:4533"
    volumes:
      - /path/to/music:/music:ro
      - /path/to/data:/data
    environment:
      ND_SCANSCHEDULE: 1h
      ND_LOGLEVEL: info
      ND_BASEURL: ""
```

Run with:
```bash
docker-compose up -d
```

#### Option 3: Direct Installation

1. Download from [Navidrome Releases](https://github.com/navidrome/navidrome/releases)
2. Extract and run the binary
3. Configure with environment variables or config file

### Initial Navidrome Setup

1. Open `http://localhost:4533` in your browser
2. Create an admin account
3. Add your music folder path in Settings
4. Wait for the initial scan to complete

### Running iL3 MuziQ

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open `http://localhost:5173` in your browser

4. Login with your Navidrome credentials:
   - Server: `http://your-server-ip:4533`
   - Username: Your Navidrome username
   - Password: Your Navidrome password

## Music Server Compatibility

iL3 MuziQ supports any Subsonic-compatible server:

- **Navidrome** (Recommended) - Modern, fast, open source
- **Airsonic / Airsonic-Advanced** - Java-based fork
- **Subsonic** - Original server
- **Gonic** - Go-based server
- **Ampache** - PHP-based with Subsonic API

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
ilemuziq/
├── public/              # Static assets
├── src/
│   ├── api/            # Subsonic API client
│   │   ├── client.ts   # API methods
│   │   └── types.ts    # TypeScript interfaces
│   ├── audio/          # Web Audio engine
│   │   └── engine.ts   # AudioController class
│   ├── components/     # Vue components
│   │   ├── Logo3D.vue  # 3D animated logo
│   │   ├── PlayerBar.vue
│   │   └── Sidebar.vue
│   ├── router/         # Vue Router config
│   ├── stores/         # Pinia stores
│   │   ├── app.ts      # App state
│   │   └── player.ts   # Player state
│   ├── views/          # Page components
│   │   ├── Home.vue    # Discover/Home page
│   │   ├── Library.vue # Albums & Artists
│   │   ├── Login.vue   # Login with Vic Falls
│   │   ├── Queue.vue   # Play queue
│   │   └── Search.vue  # Search page
│   ├── App.vue         # Root component
│   └── main.ts         # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Zambian Cultural Theme

The app features:

- **Colors**: Zambia flag colors (Green, Red, Black, Orange)
- **Victoria Falls**: Animated waterfall background on login
- **African Patterns**: Subtle geometric patterns throughout UI
- **3D Logo**: Floating animated "iL3 MuziQ" branding
- **Audio Visualizer**: Drum-inspired pulsing bars

## License

MIT

---

Made with pride in Zambia
