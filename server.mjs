import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { log } from 'console';

// Utility function to log messages to a file with the current date
function logToFile(message) {
    const logDir = 'logs';
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);  // Create logs directory if it doesn't exist
    }

    const date = new Date().toISOString().split('T')[0];  // Get the current date (YYYY-MM-DD)
    const logFile = path.join(logDir, `server-${date}.log`);
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}\n`;

    fs.appendFileSync(logFile, logMessage);  // Append log message to the file
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const token = 'Bearer secret963_aaaa-1234'; // only for testing
const USE_MOCK_DATA = true; // Set to true to use mock data instead of external API

// Load mock data
let mockGatewayData = null;
let mockCowData = null;
let mockCardData = null;

if (USE_MOCK_DATA) {
    try {
        mockCowData = JSON.parse(fs.readFileSync('./public/data/cow_data.json', 'utf8'));
        mockCardData = JSON.parse(fs.readFileSync('./public/data/card_data.json', 'utf8'));
        logToFile('Mock data loaded successfully');
    } catch (error) {
        logToFile(`Error loading mock data: ${error.message}`);
    }
    
    // Mock gateway data structure
    mockGatewayData = {
        "id": 1,
        "name": "Gateway 1",
        "device_id": "074315000045",
        "device_type": "EDC150",
        "gps_lat": 49.9250783,
        "gps_lon": 16.6040000,
        "collars": [
            { "id": 1, "device_id": "COL001", "device_type": "Collar", "led_color": "#00ff00", "fences_ids": [1], "animal": { "id": 1, "name": "Cow 1", "animal_type": "Cattle", "breed_type": "Holstein", "animal_code": "HU3198392301", "birth_date": "2023-10-31", "has_image": true } },
            { "id": 2, "device_id": "COL002", "device_type": "Collar", "led_color": "#00ff00", "fences_ids": [1], "animal": { "id": 2, "name": "Cow 2", "animal_type": "Cattle", "breed_type": "Charolais", "animal_code": "HU3198392302", "birth_date": "2023-09-15", "has_image": true } },
            { "id": 3, "device_id": "COL003", "device_type": "Collar", "led_color": "#00ff00", "fences_ids": [1], "animal": { "id": 3, "name": "Cow 3", "animal_type": "Cattle", "breed_type": "Angus", "animal_code": "HU3198392303", "birth_date": "2023-08-20", "has_image": true } },
            { "id": 4, "device_id": "COL004", "device_type": "Collar", "led_color": "#00ff00", "fences_ids": [1], "animal": { "id": 4, "name": "Cow 4", "animal_type": "Cattle", "breed_type": "Hereford", "animal_code": "HU3198392304", "birth_date": "2023-07-10", "has_image": true } },
            { "id": 5, "device_id": "COL005", "device_type": "Collar", "led_color": "#00ff00", "fences_ids": [1], "animal": { "id": 5, "name": "Cow 5", "animal_type": "Cattle", "breed_type": "Simmental", "animal_code": "HU3198392305", "birth_date": "2023-06-05", "has_image": true } },
            { "id": 6, "device_id": "COL006", "device_type": "Collar", "led_color": "#00ff00", "fences_ids": [1], "animal": { "id": 6, "name": "Cow 6", "animal_type": "Cattle", "breed_type": "Jersey", "animal_code": "HU3198392306", "birth_date": "2023-05-18", "has_image": true } },
            { "id": 7, "device_id": "COL007", "device_type": "Collar", "led_color": "#00ff00", "fences_ids": [1], "animal": { "id": 7, "name": "Cow 7", "animal_type": "Cattle", "breed_type": "Brown Swiss", "animal_code": "HU3198392307", "birth_date": "2023-04-22", "has_image": true } },
            { "id": 8, "device_id": "COL008", "device_type": "Collar", "led_color": "#00ff00", "fences_ids": [1], "animal": { "id": 8, "name": "Cow 8", "animal_type": "Cattle", "breed_type": "Limousin", "animal_code": "HU3198392308", "birth_date": "2023-03-14", "has_image": true } },
            { "id": 9, "device_id": "COL009", "device_type": "Collar", "led_color": "#ff0000", "fences_ids": [2], "animal": { "id": 9, "name": "Cow 9", "animal_type": "Cattle", "breed_type": "Brahman", "animal_code": "HU3198392309", "birth_date": "2023-02-08", "has_image": true } },
            { "id": 10, "device_id": "COL010", "device_type": "Collar", "led_color": "#00ff00", "fences_ids": [1], "animal": { "id": 10, "name": "Cow 10", "animal_type": "Cattle", "breed_type": "Shorthorn", "animal_code": "HU3198392310", "birth_date": "2023-01-25", "has_image": true } }
        ]
    };
}

// Log each request to the server
app.use((req, res, next) => {
    logToFile(`Received request: ${req.method} ${req.url}`);
    next();
});

// Gateway route
app.get('/api/gateways/1', (req, res) => {
    logToFile('Fetching gateway data');
    
    if (USE_MOCK_DATA) {
        logToFile('Using mock gateway data');
        res.json(mockGatewayData);
        return;
    }
    
    fetch('http://77.93.196.15:18080/api/gateways/1', {
        method: 'GET',
        headers: {
            Authorization: token,
            'Content-Type': 'application/json',
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            logToFile(`Fetched gateway data: ${JSON.stringify(data)}`);
            res.json(data);
        })
        .catch((error) => {
            logToFile(`Error fetching gateway data: ${error.message}, falling back to mock data`);
            if (mockGatewayData) {
                res.json(mockGatewayData);
            } else {
                res.status(500).json({ error: error.message });
            }
        });
});

// Route for fetching battery data for collars by ID
app.get('/api/collars/:id/battery_data', (req, res) => {
	const { id } = req.params; // Extract ID from the route parameter
	const { page, limit, date_from, date_to } = req.query; // Extract query parameters

    logToFile(`Fetching battery data for collar ID: ${id}`);
    
    if (USE_MOCK_DATA) {
        logToFile(`Using mock battery data for collar ID: ${id}`);
        // Generate mock battery data
        const mockBatteryData = {
            data: Array.from({ length: parseInt(limit) || 10 }, (_, i) => ({
                collar_id: parseInt(id),
                battery_level: 85 - Math.floor(Math.random() * 20),
                voltage: 3.7 + (Math.random() * 0.5 - 0.25),
                datetime: new Date(Date.now() - i * 3600000).toISOString()
            })),
            total: 100,
            page: parseInt(page) || 0,
            limit: parseInt(limit) || 10
        };
        res.json(mockBatteryData);
        return;
    }
    
	const url = `http://77.93.196.15:18080/api/collars/${id}/battery_data?page=${page}&limit=${limit}&date_from=${date_from}&date_to=${date_to}`

	fetch(url, {
		method: 'GET',
		headers: {
		Authorization: token, // Replace with a valid token if required
		'Content-Type': 'application/json',
		},
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			return response.json();
		})
		.then((data) => {
			logToFile(`Fetched battery data for collar ID ${req.params.id}: ${JSON.stringify(data)}`);
			res.json(data);
		})
		.catch((error) => {
			logToFile(`Error fetching battery data for collar ID ${req.params.id}: ${error.message}`);
			res.status(500).json({ error: error.message });
		});
});

app.get('/api/collars/:id/gps_data', (req, res) => {
	const { id } = req.params; // Extract ID from the route parameter
	const { page, limit, date_from, date_to } = req.query; // Extract query parameters

	logToFile(`Fetching GPS data for collar ID: ${id}`);
	
	if (USE_MOCK_DATA && mockCowData) {
	    logToFile(`Using mock GPS data for collar ID: ${id}`);
	    const cowData = mockCowData.find(cow => cow.id === parseInt(id));
	    if (cowData) {
	        const filteredRecords = cowData.records.filter(record => {
	            if (!date_from || !date_to) return true;
	            const recordDate = new Date(record.datetime);
	            return recordDate >= new Date(date_from) && recordDate <= new Date(date_to);
	        });
	        
	        const pageNum = parseInt(page) || 0;
	        const limitNum = parseInt(limit) || 100;
	        const startIdx = pageNum * limitNum;
	        const endIdx = startIdx + limitNum;
	        
	        const response = {
	            data: filteredRecords.slice(startIdx, endIdx).map(record => ({
	                collar_id: parseInt(id),
	                latitude: record.latitude,
	                longitude: record.longitude,
	                speed: Math.random() * 2,
	                accuracy: 5 + Math.random() * 5,
	                altitude: 300 + Math.random() * 50,
	                datetime: record.datetime
	            })),
	            total: filteredRecords.length,
	            page: pageNum,
	            limit: limitNum
	        };
	        res.json(response);
	        return;
	    }
	}
	
	// 'http://77.93.196.15:18080//api/collars/2/temperature_data?page=0&limit=100&date_from=2024-11-01&date_to=2024-12-02'
	const url = `http://77.93.196.15:18080/api/collars/${id}/gps_data?page=${page}&limit=${limit}&date_from=${date_from}&date_to=${date_to}`;
	fetch(url, {
		method: 'GET',
		headers: {
			Authorization: token,
			'Content-Type': 'application/json',
		}
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			return response.json();
		})
		.then((data) => {
			logToFile(`Fetched GPS data for collar ID ${req.params.id}: ${JSON.stringify(data)}`);
			res.json(data);
		})
		.catch((error) => {
			logToFile(`Error fetching GPS data for collar ID ${req.params.id}: ${error.message}`);
			res.status(500).json({ error: error.message });
		});
});

app.get('/api/collars/:id/temperature_data', (req, res) => {
	const { id } = req.params; // Extract ID from the route parameter
	const { page, limit, date_from, date_to } = req.query; // Extract query parameters
	logToFile(`Fetching temperature data for collar ID: ${id}`);

	if (USE_MOCK_DATA && mockCowData) {
	    logToFile(`Using mock temperature data for collar ID: ${id}`);
	    const cowData = mockCowData.find(cow => cow.id === parseInt(id));
	    if (cowData) {
	        const filteredRecords = cowData.records.filter(record => {
	            if (!date_from || !date_to) return true;
	            const recordDate = new Date(record.datetime);
	            return recordDate >= new Date(date_from) && recordDate <= new Date(date_to);
	        });
	        
	        const pageNum = parseInt(page) || 0;
	        const limitNum = parseInt(limit) || 100;
	        const startIdx = pageNum * limitNum;
	        const endIdx = startIdx + limitNum;
	        
	        const response = {
	            data: filteredRecords.slice(startIdx, endIdx).map(record => ({
	                collar_id: parseInt(id),
	                temp1: record.temp1,
	                temp2: record.temp2,
	                datetime: record.datetime
	            })),
	            total: filteredRecords.length,
	            page: pageNum,
	            limit: limitNum
	        };
	        res.json(response);
	        return;
	    }
	}

	const url = `http://77.93.196.15:18080/api/collars/${id}/temperature_data?page=${page}&limit=${limit}&date_from=${date_from}&date_to=${date_to}`;
	fetch(url, {
		method: 'GET',
		headers: {
			Authorization: token,
			'Content-Type': 'application/json',
		}
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			return response.json();
		})
		.then((data) => {
			logToFile(`Fetched temperature data for collar ID ${req.params.id}: ${JSON.stringify(data)}`);
			res.json(data);
		})
		.catch((error) => {
			logToFile(`Error fetching temperature data for collar ID ${req.params.id}: ${error.message}`);
			res.status(500).json({ error: error.message });
		});
});

// Give Shock
app.post('/api/collars/give_shock', (req, res) => {
    logToFile(`Received give shock payload: ${JSON.stringify(req.body)}`);
    
    if (USE_MOCK_DATA) {
        logToFile('Mock mode: Simulating give shock');
        res.json({ success: true, message: 'Shock command sent (mock mode)' });
        return;
    }

    fetch('http://77.93.196.15:18080/api/collars/give_shock', {
        method: 'POST',
        headers: {
            Authorization: token,
            'Content-Type': 'application/json',
        
        },
        body: JSON.stringify(req.body),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`External API Error: ${response.status}`);
        }
        return response.json();
    })
        .then((data) => {
            logToFile(`Give Shock update response: ${JSON.stringify(data)}`);
            res.json(data);
        })
        .catch((error) => {
            logToFile(`Error communicating with Give Shock API: ${error.message}`);
            res.status(500).json({ error: error.message });
        });
});

// Play Sound
app.post('/api/collars/play_sound', (req, res) => {
    logToFile(`Received play sound payload: ${JSON.stringify(req.body)}`);
    
    if (USE_MOCK_DATA) {
        logToFile('Mock mode: Simulating play sound');
        res.json({ success: true, message: 'Sound command sent (mock mode)' });
        return;
    }

    fetch('http://77.93.196.15:18080/api/collars/play_sound', {
        method: 'POST',
        headers: {
            Authorization: token,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`External API Error: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            logToFile(`Play Sound update response: ${JSON.stringify(data)}`);
            res.json(data);
        })
        .catch((error) => {
            logToFile(`Error communicating with Play Sound API: ${error.message}`);
            res.status(500).json({ error: error.message });
        });
});

// Change LED
app.post('/api/collars/led', (req, res) => {
    logToFile(`Received LED update payload: ${JSON.stringify(req.body)}`);
    
    if (USE_MOCK_DATA) {
        logToFile('Mock mode: Simulating LED change');
        res.json({ success: true, message: 'LED command sent (mock mode)' });
        return;
    }

    fetch('http://77.93.196.15:18080/api/collars/led', {
        method: 'POST',
        headers: {
            Authorization: token,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`External API Error: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            logToFile(`LED update response: ${JSON.stringify(data)}`);
            res.json(data);
        })
        .catch((error) => {
            logToFile(`Error communicating with LED API: ${error.message}`);
            res.status(500).json({ error: error.message });
        });
});

const wss = new WebSocketServer({ port: 8764 });

wss.on('connection', (ws) => {
    logToFile('Client connected via WebSocket');
    async function fetchAndSendCollarsGpsData() {
        logToFile('Fetching collars GPS data');
        
        if (USE_MOCK_DATA && mockCowData && mockGatewayData) {
            logToFile('Using mock collars GPS data');
            const mockLastGpsData = {
                data: mockCowData.slice(0, 10).map(cow => {
                    const lastRecord = cow.records[cow.records.length - 1];
                    const collarInfo = mockGatewayData.collars.find(c => c.id === cow.id);
                    return {
                        id: cow.id,
                        name: collarInfo?.animal?.name || `Cow ${cow.id}`,
                        gps_lat: lastRecord.latitude,
                        gps_lon: lastRecord.longitude,
                        gps_speed: Math.random() * 2,
                        gps_accuracy: 5 + Math.random() * 5,
                        gps_altitude: 300 + Math.random() * 50,
                        time: lastRecord.datetime,
                        alarm: cow.id === 9 ? 'out of fence' : 'ok',
                        led_color: collarInfo?.led_color || '#00ff00',
                        breed_type: collarInfo?.animal?.breed_type || 'Unknown',
                        birth_date: collarInfo?.animal?.birth_date || '2021-01-01',
                        battery: 85 - Math.floor(Math.random() * 20),
                        tpulser: 0
                    };
                })
            };
            ws.send(JSON.stringify(mockLastGpsData));
            return;
        }
        
        // http://77.93.196.15:18080/api/collars/last-gps-data/1,2,5,6,7,8,9,10
        fetch('http://77.93.196.15:18080/api/collars/last-gps-data/1,2,3,4,5,6,7,8,9,10', {
            method: 'GET',
            headers: {
                Authorization: token,
                'Content-Type': 'application/json',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                logToFile(`Fetched collars GPS data: ${JSON.stringify(data)}`);
                ws.send(JSON.stringify(data));
            })
            .catch((error) => {
                logToFile(`Error fetching collars GPS data: ${error.message}`);
            });
    }

    fetchAndSendCollarsGpsData();
    const interval = setInterval(fetchAndSendCollarsGpsData, 5000);

    ws.on('close', () => {
        logToFile('Client disconnected from WebSocket');
        clearInterval(interval);  // Stop sending data when the client disconnects
    });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    logToFile(`Server is running on port ${PORT}`);
});
