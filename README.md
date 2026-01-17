# CowTracker Web Application 🐄

A modern, cattle tracking system that provides real-time monitoring of livestock.

## Live Demo
You can view the web application at [http://18.170.252.93:3001/](http://18.170.252.93:3001/). Please note that this demo displays the UI only, as data fetching is currently disabled due to workplace policies and public sharing.

## Features

- **Real-time Cow Tracking**: Live GPS tracking with WebSocket updates
- **Interactive Map**: Leaflet-based map with custom cow markers and fence polygons
- **Cow Management**: Detailed cow information including health status, battery levels, and sensor data
- **Herd Organization**: Group cows into herds for better management
- **Fence Monitoring**: Visual fence boundaries with alarm zones
- **LED Control**: Remote LED color control for cow collars
- **Responsive Design**: Works both on desktop and mobile devices

### Key Files

- **`public/js/script.mjs`**: Main application logic
- **`public/css/style.css`**: CSS with responsive design
- **`public/index.html`**: HTML structure
- **`server.mjs`**: Express.js server with mock data for development

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd CowTrackerWeb-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the application:
   - The server is pre-configured to use **mock data mode** by default
   - Mock data is located in `public/data/cow_data.json` and `public/data/card_data.json`
   - To switch between mock and real API data, edit `server.mjs`:
     ```javascript
     const USE_MOCK_DATA = true;  // Set to false to use real API if you have a correct token
     ```

4. Start the server:
   ```bash
   node server.mjs
   ```
   
   **Windows users**: If you encounter "node.exe not found", use the full path:
   ```powershell
   & "C:\Program Files\nodejs\node.exe" server.mjs
   ```
   
   Or use the provided batch file:
   ```bash
   start_win.bat
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3001
   ```

### Quick Start with Mock Data

The application comes with pre-loaded mock data for 10 cows with realistic GPS tracking, temperature, and sensor data. This allows you to explore all features without connecting to external APIs:

- ✅ Real-time cow tracking on map
- ✅ Cow details and sensor data
- ✅ Fence and herd management
- ✅ LED controls (simulated)
- ✅ WebSocket updates every 5 seconds

Simply start the server and the application will work immediately with sample data!

## Development

### Mock Data vs Real API

The application supports two modes:

**Mock Data Mode (Default)**
- Set `USE_MOCK_DATA = true` in `server.mjs`
- Uses local JSON files for all data
- Perfect for development and testing
- No external API connection required

**Real API Mode**
- Set `USE_MOCK_DATA = false` in `server.mjs`
- Requires valid API token in `server.mjs`:
  ```javascript
  const token = 'Bearer YOUR_TOKEN_HERE';
  ```
- Connects to external API at `http://77.93.196.15:18080`

### Real-time Data Integration

The application connects to live API endpoints for real-time cow tracking:

- **Live Cow Data**: Real-time collar sensor data via WebSocket connection
- **API Integration**: Direct connection to cattle tracking backend
- **Card Data**: Additional cow information and health records

### Environment Configuration

Edit `CONFIG` object in `script.mjs` for:

- WebSocket connection settings (default: `ws://localhost:8764`)
- API endpoint configuration (default: `http://localhost:3001/api`)
- Map default location and zoom
- UI timing and animation settings

### API Endpoints

The server provides these endpoints (work with both mock and real data):

**GET Endpoints:**
- `/api/gateways/1` - Gateway and collar information
- `/api/collars/:id/battery_data` - Battery sensor data
- `/api/collars/:id/gps_data` - GPS location data  
- `/api/collars/:id/temperature_data` - Temperature sensor data

**POST Endpoints:**
- `/api/collars/give_shock` - Send shock command
- `/api/collars/play_sound` - Send sound command
- `/api/collars/led` - Change LED color

**WebSocket:**
- `ws://localhost:8764` - Real-time collar updates (every 5 seconds)

All endpoints automatically use mock data when `USE_MOCK_DATA = true` in `server.mjs`.

## UI Features

### Panel Management

- **Fences Panel**: Fence boundaries
- **Herds Panel**: Cows in groups
- **Details Panel**: Detailed cow information and controls

### Interactive Controls

- **LED Control**: Change collar LED colors remotely
- **Sound/Shock Commands**: Send commands to cow collars
- **Sensor Monitoring**: View temperature, activity, and location data
- **Sorting & Filtering**: Sort cows by various criteria
- **Card**: Each cow has its own Card with detailed information, veterinary logs and stored documents (Still in development)

### Keyboard Shortcuts

- **`Escape`**: Close panels and deselec
- **`Ctrl+R`**: Refresh data

## Troubleshooting

### Common Issues

1. **"node.exe is not recognized" (Windows)**:
   ```powershell
   # Use the full path to Node.js
   & "C:\Program Files\nodejs\node.exe" server.mjs
   
   # Or add Node.js to your PATH environment variable
   # Or use the start_win.bat file
   ```

2. **Port Already in Use**:
   ```bash
   # Windows
   netstat -ano | findstr :3001
   taskkill /PID <process_id> /F
   
   # macOS/Linux
   lsof -ti:3001 | xargs kill -9
   ```

3. **WebSocket Port Already in Use (8764)**:
   ```bash
   # Windows
   netstat -ano | findstr :8764
   taskkill /PID <process_id> /F
   
   # macOS/Linux  
   lsof -ti:8764 | xargs kill -9
   ```

4. **Map Not Loading**:
   - Check internet connection (OpenStreetMap tiles require internet)
   - Verify Leaflet CSS and JS are loaded
   - Check browser console for errors

5. **No Cows Appearing**:
   - Ensure server is running (`node server.mjs`)
   - Check that `USE_MOCK_DATA = true` in `server.mjs`
   - Verify mock data files exist in `public/data/`
   - Check browser console for WebSocket connection errors

6. **WebSocket Connection Failed**:
   - Ensure server is running on port 8764
   - Check firewall settings
   - Verify WebSocket URL in browser console

### Development Mode

Enable debug logging by setting `CONFIG.development.debugMode = true` in the script.

## 📱 Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the established architecture
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## Acknowledgments

- Leaflet.js for the mapping library
- OpenStreetMap for map tiles
- WebSocket API for real-time communication
- Express.js for the server framework