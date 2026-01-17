// https://cors-anywhere.herokuapp.com/corsdemo



/* General cow structure:
{
	"id": 1,
	"name": "Cow 1",
	"alarm": "ok",
	"ledColor": "#00ff00",
	"age": "2021-01-01",
	"breed": "Holstein",
	"birthDate": "2021-01-01",
	"gps": {
		"lat": 49.9250783,
		"lon": 15.0994944,
		"time": "2021-06-01 12:00:00",
		"speed": 0.5,
		"accur": 5,
		"alt": 300
	},

*/

// import fs


document.addEventListener("DOMContentLoaded", function () {
	const TO_OPEN_POPUP = 500;
	const TO_CLOSE_POPUP = 2000;

	let allCows = [];
	let markers = [];
	let mapMarkers = [];
	let listItems = {};
	let indexes = {};
	let polyline = null;
	let heatLayer = null;
	let currentCow;
	let ws;

	const devMode = false; // Set to true to enable development mode (without data fetching)

	let cardCowData = [];  // To store data from card_data.json

	let currentCowID = null; // Track the current cow ID for the details panel

	let polygonFenceData = [
		[49.9268967, 16.6038257],
		[49.9253633, 16.6038149],
		[49.9238369, 16.6038739],
		[49.9240372, 16.6062504],
		[49.9239646, 16.6080582],
		[49.9251907, 16.6079348],
		[49.9255153, 16.6081279],
		[49.9260851, 16.6080099],
		[49.9265375, 16.6055905]
	];

	let polygonAlarmData = [
		[49.9267649, 16.6040152],
		[49.9253522, 16.6040929],
		[49.9239620, 16.6040740],
		[49.9242168, 16.6062380],
		[49.9240958, 16.6078678],
		[49.9252031, 16.6076569],
		[49.9254811, 16.6078545],
		[49.9259835, 16.6077801],
		[49.9263649, 16.6056687]
	];

	let herdData = {
		herd1: {
			name: 'Herd 1',
			id: 1,
			color: 'brown',
			cows: [1, 2, 3, 4, 5]
		},
		herd2: {
			name: 'Herd 2',
			id: 2,
			color: 'black',
			cows: [6, 7, 8]
		},
		herd3: {
			name: 'Herd 3',
			id: 3,
			color: 'purple',
			cows: [9, 10]
		}
	}

	let fenceData = {
		fence1: {
			name: 'Normal Fence',
			id: 1,
			color: 'green',
			polygon: [
				{ lat: 49.9244411, lon: 16.6044249 },
				{ lat: 49.9242305, lon: 16.605365 },
				{ lat: 49.9244411, lon: 16.605365 },
				{ lat: 49.9242305, lon: 16.6044249 }
			],
			cows: [1, 2, 3, 4, 5, 6, 7, 8, 10]
		},
		fence2: {
			name: 'Alarm Fence',
			id: 2,
			color: 'red',
			polygon: [
				{ lat: 49.9244411, lon: 16.6044249 },
				{ lat: 49.9242305, lon: 16.605365 },
				{ lat: 49.9244411, lon: 16.605365 },
				{ lat: 49.9242305, lon: 16.6044249 }
			],
			cows: [9]
		}
	}

	const smallIcon = L.icon({
		iconUrl: 'css/icons/dot.png',
		iconSize: [20, 20],    // Size of the icon [width, height]
		iconAnchor: [10, 10],  // Point of the icon which will correspond to marker's location
		popupAnchor: [0, -20]  // Point from which the popup should open relative to the iconAnchor
	});

	const toggleDetailsBtn = document.getElementById('details-btn');
	const toggleDetailsArrow = document.getElementById('toggle-details-btn');
	const toggleDetailsArrowPanel = document.getElementById('toggle-details-btn-panel');
	const detailsPanel = document.getElementById('cow-details');

	const showCowCardButton = document.getElementById('cow-card-button');

	const showButton = document.getElementById('show-locations-btn');
	const clearButton = document.getElementById('clear-locations-btn')
	const moreDetailsButton = document.getElementById('more-details-btn');
	const moreDetails = document.getElementById('more-details');
	const collarList = document.getElementById('collar-list');

	const ledButton = document.getElementById('cow-led-button');
	const ledMenu = document.getElementById('led-menu');

	const soundButton = document.getElementById('cow-sound-button');
	const shockButton = document.getElementById('cow-shock-button');

	const battBtn = document.getElementById('batt-btn');
	const tempBtn = document.getElementById('temp-btn');
	const speedBtn = document.getElementById('speed-btn');
	const accuBtn = document.getElementById('accuracy-btn');
	const altBtn = document.getElementById('altitude-btn');
	const activityBtn = document.getElementById('activity-btn');
	const ruminationBtn = document.getElementById('rumination-btn');
	const pressBtn = document.getElementById('press-btn');

	const battBtnModal = document.getElementById('batt-btn-modal');
	const tempBtnModal = document.getElementById('temp-btn-modal');
	const speedBtnModal = document.getElementById('speed-btn-modal');
	const accuBtnModal = document.getElementById('accuracy-btn-modal');
	const altBtnModal = document.getElementById('altitude-btn-modal');
	const activityBtnModal = document.getElementById('activity-btn-modal');
	const ruminationBtnModal = document.getElementById('rumination-btn-modal');
	const pressBtnModal = document.getElementById('press-btn-modal');

	const fencesButton = document.getElementById('fences-btn');
	const fencesPanel = document.getElementById('fences-panel');
	const fenceList = document.getElementById('fence-list');

	const herdsButton = document.getElementById('herds-btn');
	const herdsPanel = document.getElementById('herds-panel');
	const herdList = document.getElementById('herd-list');

	let map = L.map('map').setView([49.9250783, 15.0994944], 13);
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);

	function initializeWebSocket() {
		ws = new WebSocket('ws://localhost:8764');  // Connect to WebSocket server

		ws.onopen = function () {
			console.log('WebSocket connection established');
		};

		ws.onmessage = function (event) {
			const data = JSON.parse(event.data);
			if (!data.data || data.data.length < 1) {
				console.error('No data received from server:', data);
				return;
			} else {
				loadCollarDetails(data);
			}
		};

		ws.onclose = function () {
			console.log('WebSocket connection closed');
		};

		ws.onerror = function (error) {
			console.error('WebSocket error:', error);
		};
	}

	function drawFencePolygon(coordinates) {
		let fencePolygon = L.polygon(coordinates, { color: "red", weight: 1 }).addTo(map);
		map.fitBounds(fencePolygon.getBounds());
	}

	function drawAlarmPolygon(coordinates) {
		let alarmPolygon = L.polygon(coordinates, { color: "green", weight: 1 }).addTo(map);
		map.fitBounds(alarmPolygon.getBounds());
	}

	drawFencePolygon(polygonFenceData);
	drawAlarmPolygon(polygonAlarmData);

	function setAlarmLabel(cowID, alarm, cowAlarmElement) {
		if (!alarm) {
			console.log('No alarm data found for cow:', cowID);
			alarm = 'no alarm';
		}
		
		if (!cowAlarmElement) {
			console.error('Cow alarm element not found:', cowID);
			return;
		}

		// Update the alarm text and color based on the cow's alarm status
		if (alarm === 'ok') {
			cowAlarmElement.textContent = 'OK';
			cowAlarmElement.style.color = 'green';
		} else if (alarm === 'warning zone') {
			cowAlarmElement.textContent = 'Warning zone';
			cowAlarmElement.style.color = 'orange';
		} else if (alarm === 'out of fence') {
			cowAlarmElement.textContent = 'Out of Fence';
			cowAlarmElement.style.color = 'red';
		} else {
			cowAlarmElement.textContent = 'No alarm';
			cowAlarmElement.style.color = '#555';
		}
		// set also font size and font type for the cow alarm
		cowAlarmElement.style.fontSize = '1rem';
		cowAlarmElement.style.fontFamily = 'Manrope, sans-serif';
	}

	function addCowToList(cow) {
		const collarList = document.getElementById('collar-list');
		const toggleDetailsArrow = document.getElementById('toggle-details-btn');
		const toggleDetailsArrowPanel = document.getElementById('toggle-details-btn-panel');
		const detailsPanel = document.getElementById('cow-details');

		if (!collarList) {
			console.error('Collar list element not found.');
			return;
		}

		// Ensure cow and animal exist
		if (!cow) {
			console.error('Invalid cow data:', cow);
			return;
		}

		// Check if the cow already exists in the list
		let cowElement = document.getElementById(`cow-id-${cow.id}`);

		currentCow = cow;
		if (cowElement) {
			// cow exist update only the alarm status
			const cowNameElement = cowElement.querySelector('.cow-name');
			const cowIDElement = cowElement.querySelector('.cow-id');
			const cowAlarmElement = cowElement.querySelector('.cow-alarm');

			cowNameElement.textContent = cow.name || 'Unknown Name';
			cowIDElement.textContent = `ID: ${cow.id}`;

			// check if cow.alarm exist and if not set it to no alarm
			if (!cow.alarm) {
				cow.alarm = 'no alarm';
			}
			
			setAlarmLabel(cow.id, cow.alarm, cowAlarmElement);

			// Optionally update any other information here
		} else {
			// Create a new list item for the cow
			const listItem = document.createElement('li');
			const icon = document.createElement('img');
			const textContent = document.createElement('div');
			const cowName = document.createElement('div');
			const cowID = document.createElement('div');
			const cowAlarm = document.createElement('div');
			const infoButton = document.createElement('button');

			// Set classes and text content
			icon.className = 'cow-icon';  // Optionally add a class for styling
			icon.src = `css/icons/cows/${cow.id}.jpg`;
			icon.alt = '?';

			textContent.className = 'text-content';
			cowName.className = 'cow-name';
			cowID.className = 'cow-id';
			cowAlarm.className = 'cow-alarm';
			infoButton.className = 'details-btn';

			cowName.textContent = cow.name || 'Unknown Name';
			// if alarm is ok, set the color to green, if warning set to orange, if danger set to red

			if (!cow.alarm) {
				cow.alarm = 'no alarm';
			}
			setAlarmLabel(cow.id, cow.alarm, cowAlarm);

			cowID.textContent = `ID: ${cow.id}`;

			infoButton.classList.add('info');
			toggleDetailsArrowPanel.classList.add('hidden-btn');
			detailsPanel.classList.add('hidden');

			// Set attributes for the list item
			listItem.id = `cow-id-${cow.id}`;
			listItem.dataset.id = cow.id;
			listItem.className = 'collar-list-item';

			// Append the created elements to the list item
			textContent.appendChild(cowName);
			textContent.appendChild(cowAlarm);
			textContent.appendChild(cowID);
			listItem.appendChild(icon);
			listItem.appendChild(textContent);
			listItem.appendChild(infoButton);

			// Append the new list item to the collar list
			collarList.appendChild(listItem);

			// Store the new list item for future reference
			listItems[cow.id] = listItem;
			indexes[cow.id] = allCows.findIndex(msg => msg.id === cow.id);

			infoButton.addEventListener('click', function (e) {
				const cowID = e.target.closest('li').dataset.id;
				console.log('Info button clicked:', cowID);
				const cow = allCows.find(cow => cow.id === parseInt(cowID, 10));

				if (!cow) {
					console.error('Cow not found:', cowID);
					return;
				}
				currentCow = cow;

				// If the same cow button is clicked again, toggle the panel visibility
				if (currentCowID === cowID) {
					// Hide the panel if it's the same cow
					toggleDetailsArrow.classList.remove('hidden-btn');
					toggleDetailsArrowPanel.classList.add('hidden-btn');
					detailsPanel.classList.add('hidden');
					currentCowID = null; // Reset the currentCowID as we are hiding the panel
					console.log('Details panel hidden for the same cow');
				} else {
					// Update the panel for the new cow or show it if it was hidden
					toggleDetailsArrow.classList.add('hidden-btn'); // Hide the original button

					toggleDetailsArrowPanel.classList.remove('hidden-btn'); // Show the panel toggle button
					detailsPanel.classList.remove('hidden'); // Make sure the details panel is visible

					// Now update the panel with the cow details
					showCowDetails(cow);
					currentCowID = cowID; // Set the currentCowID to track the newly shown cow
					console.log('Details panel shown for cow ID:', cowID);
				}
			});
		}
		// also update the cow details panel
		setCowDetails(cow);
	}

	function getIconForCow(ledColor) {
		// colors: #00ffff,  #ff0000, #ffff00, #ff00ff, #00ff00
		// names of icons are: gps-cyan.svg, gps-red.svg, gps-yellow.svg, gps-purple.svg, gps-green.svg

		// Check the LED color and return the corresponding icon
		let icon;
		switch (ledColor) {
			case '#00ff00': // Green
				icon = 'gps-green.svg';
				return icon;
			case '#ff0000': // Red
				icon = 'gps-red.svg';
				return icon;
			case '#ffff00': // Yellow
				icon = 'gps-yellow.svg';
				return icon;
			case '#00ffff': // Cyan
				icon = 'gps-cyan.svg';
				return icon;
			case '#ff00ff': // Purple
				icon = 'gps-purple.svg';
				return icon;
			default:
				icon = 'gps.svg'; // Default cow icon
				return icon;
		}
	}

	function updateMarkerForCow(cow) {
		if (!cow || !cow.gps || !cow.gps.lat || !cow.gps.lon) {
			console.error('Invalid cow data:', cow);
			return;
		}

		// Check if the cow marker exists
		if (!markers[cow.id]) {
			console.error('Cow marker not found:', cow);
			return;
		}

		let gpsIcon;
		let ledColor = cow.ledColor;
		// check if the ledColor is valid and if not set it to default
		if (!ledColor) {
			ledColor = '#000000';
		}
		gpsIcon = getIconForCow(ledColor);

		const combinedIcon = L.divIcon({
			className: 'custom-marker-icon', // custom CSS class for styling
			html: `
			<div class="icon-container">
				<img src="css/icons/${gpsIcon}" class="gps-icon"/>
				<img src="css/icons/cows/${cow.id}.jpg" class="cow-icon"/>
			</div>
			`,
			iconSize: [60, 60], // Size of the combined icon
			iconAnchor: [20, 40], // Anchor of the icon (where it points on the map)
			popupAnchor: [0, -40]
		});

		// Update the marker position and the icon

		markers[cow.id].setLatLng([cow.gps.lat, cow.gps.lon]);
		markers[cow.id].setIcon(combinedIcon);

		// dont forget to update the popup content
		markers[cow.id].bindPopup(`${cow.name}<br> ID: ${cow.id}<br> ${cow.gps.lon}, ${cow.gps.lat}`);

	}

	// Add functionality to the details button if it exist in the list
	function addMarkerToMap(cow) {
		// check if the marker already exist and if so update it, otherwise create a new marker
		if (markers[cow.id]) {
			updateMarkerForCow(cow);
			return;
		}

		if (!cow.gps || !cow.gps.lat || !cow.gps.lon) {
			console.error('GPS data missing for cow:', cow);
			return null; // Early return if GPS data is missing
		}

		// first check the color of the cow icon based on the led color
		let gpsIcon;
		let ledColor = cow.ledColor;
		gpsIcon = getIconForCow(ledColor);
		
		// Create a custom DivIcon with GPS icon as background and cow image in the center
		const combinedIcon = L.divIcon({
			className: 'custom-marker-icon', // custom CSS class for styling
			html: `
            <div class="icon-container">
                <img src="css/icons/${gpsIcon}" class="gps-icon"/>
                <img src="css/icons/cows/${cow.id}.jpg" class="cow-icon"/>
            </div>
        `,
			iconSize: [60, 60], // Size of the combined icon
			iconAnchor: [20, 40], // Anchor of the icon (where it points on the map)
			popupAnchor: [0, -40]
		});

		// Create a new marker with the custom icon where the previous custom icon is used and inside is the picture of the cow
		const marker = L.marker([cow.gps.lat, cow.gps.lon], { icon: combinedIcon }).addTo(map);

		if (!marker.getElement) {
			console.error('Marker getElement method is missing.');
			return marker; // Return the marker without setting opacity
		}

		marker.getElement().style.opacity = 0.5; // Set initial opacity
		marker.cowData = cow;
		// if marker in markes, update it, otherwise add it to the markers
		markers[cow.id] = marker;

		// Add event listener for marker hover (mouseover)
		marker.on('mouseover', function () {
			const popup = L.popup({ offset: L.point(0, -40) })
				.setLatLng([marker.cowData.gps.lat, marker.cowData.gps.lon])
				.setContent(`${cow.name}<br> ID: ${cow.id}<br> ${cow.gps.lon}, ${cow.gps.lat}`);

			setTimeout(() => popup.openOn(map), TO_OPEN_POPUP);
			setTimeout(() => map.closePopup(popup), TO_CLOSE_POPUP);
		});

		// Add click event listener for marker click
		marker.on('click', function () {
			const listItem = listItems[cow.id];
			if (!listItem) {
				console.error(`List item for cow ID ${cow.id} not found.`);
				return;
			}
			selectedCow(listItem, cow);
		});

		return marker; // Return the marker object
	}

	function selectedCow(listItem, cow) {
		currentCow = cow;
		console.log('List item:', listItem);
		console.log('Current cow:', currentCow);

		// Check if markers object contains the cow marker
		if (!markers[currentCow.id]) {
			console.error(`Marker for cow ID ${currentCow.id} not found.`);
			return;
		}

		// Handle opacity for all markers
		for (const key in markers) {
			if (markers[key].getElement) {
				markers[key].getElement().style.opacity = 0.5; // Set opacity for all markers
			} else {
				console.error(`Marker element for key ${key} not found.`);
			}
		}
		// Set the opacity of the selected marker
		if (markers[currentCow.id] && markers[currentCow.id].getElement) {
			markers[currentCow.id].getElement().style.opacity = 1;
		}

		// Deselect the previous selected cow in the list
		const selectedListItem = document.querySelector('.selected');
		if (selectedListItem) {
			selectedListItem.classList.remove('selected');
		}

		// Check if listItem exists and is valid before modifying its classList
		if (listItem) {
			listItem.classList.add('selected');
		} else {
			console.error('List item not found.');
		}

		// Make sure the marker exists and has the correct method
		if (markers[currentCow.id] && markers[currentCow.id].getElement) {
			markers[currentCow.id].getElement().style.opacity = 1;  // Highlight the selected marker
		} else {
			console.error(`Marker or getElement for cow ID ${currentCow.id} is missing.`);
		}

		// Fly to the cow's GPS location
		if (currentCow.gps) {
			// flyTo(<LatLng> latlng, <Number> zoom?, <Zoom/pan options> options?)
			map.flyTo([currentCow.gps.lat, currentCow.gps.lon], 18, { duration: 1, easeLinearity: 0.5 });
		} else {
			console.error(`GPS data for cow ID ${currentCow.id} is missing.`);
		}

		// Show cow details in the UI
		//showCowDetails(cow);
	}

	function setCowDetails(cow) {
		if (!cow) {
			console.error('No cow data found.');
			return;
		}

		const detailsPanel = document.getElementById('cow-details');
		const cowID = document.getElementById('cow-id');
		const cowAlarm = document.getElementById('cow-alarm');
		const nameElement = document.getElementById('cow-name');
		const locationElement = document.getElementById('cow-location');
		const lastUpdateElement = document.getElementById('cow-last-update');
		const heartRateElement = document.getElementById('cow-heart-rate');
		const ageElement = document.getElementById('cow-age');
		const breedElement = document.getElementById('cow-breed');
		const battElement = document.getElementById('cow-battery');
		const ledColorElement = document.getElementById('led-color');

		// Update general information
		nameElement.textContent = cow.name || '';
		cowID.textContent = `ID: ${cow.id}`;

		if (cow.alarm === 'ok') {
			cowAlarm.textContent = 'OK';
			cowAlarm.style.color = 'green';
		} else if (cow.alarm === 'warning zone') {
			cowAlarm.textContent = 'Warning zone';
			cowAlarm.style.color = 'orange';
		}
		else if (cow.alarm === 'out of fence') {
			cowAlarm.textContent = 'Out of Fence';
			cowAlarm.style.color = 'red';
		} else {
			cowAlarm.textContent = 'No alarm';
			cowAlarm.style.color = '#555';
		}

		// set also font size and font type for the cow alarm
		cowAlarm.style.fontSize = '1rem';
		cowAlarm.style.fontFamily = 'Manrope, sans-serif';

		ledColorElement.textContent = `LED: ${cow.ledColor}`;
		locationElement.textContent = `Lon/Lat: ${cow.gps?.lon}, ${cow.gps?.lat}`;
		lastUpdateElement.textContent = `Last update: ${cow.gps?.time}`;
		heartRateElement.textContent = `TPulser: ${cow.gps?.tpulser}`;
		ageElement.textContent = `Birth date: ${cow.birthDate}`;
		breedElement.textContent = `Breed: ${cow.breed}`;

		// Check for `bat` data and update fields if present
		if (cow.bat) {
			battElement.textContent = `${cow.bat["%"]} %`;
		} else {
			// Clear the fields if there's no `bat` data
			battElement.textContent = '100 %';
		}

		// style the battery element based on the battery percentage based on the battElement value
		// first extract the battery percentage from the battElement text content
		// remove the % sign from the text content and convert it to number
		let batteryPercentage = parseInt(battElement.textContent.replace('%', ''));
		// then check the battery percentage and set the color based on the percentage

		if (batteryPercentage > 75) {
			battElement.style.color = 'green';
		} else if (batteryPercentage > 50) {
			battElement.style.color = 'orange';
		} else {
			battElement.style.color = 'red';
		}
	}

	// update alarm in list item
	function updateAlarm(cow) {
		const listItem = document.getElementById(`cow-id-${cow.id}`);
		if (!listItem) {
			console.error('List item not found:', cow);
			return;
		}

		const cowAlarm = listItem.querySelector('.cow-alarm');
		if (!cowAlarm) {
			console.error('Cow alarm element not found:', cow);
			return;
		}

		// Update the alarm text and color based on the cow's alarm status
		if (cow.alarm === 'ok') {
			cowAlarm.textContent = 'OK';
			cowAlarm.style.color = 'green';
		} else if (cow.alarm === 'warning zone') {
			cowAlarm.textContent = 'Warning zone';
			cowAlarm.style.color = 'orange';
		} else if (cow.alarm === 'out of fence') {
			cowAlarm.textContent = 'Out of Fence';
			cowAlarm.style.color = 'red';
		}
		else {
			cowAlarm.textContent = 'No alarm';
			cowAlarm.style.color = '#555';
		}
		// set also font size and font type for the cow alarm
		cowAlarm.style.fontSize = '1rem';
		cowAlarm.style.fontFamily = 'Manrope, sans-serif';
	}

	function showCowDetails(cow) {

		if (!cow) {
			console.error('No cow data found.');
			return
		}

		console.log('Showing cow details:', cow);

		const detailsPanel = document.getElementById('cow-details');

		const nameElement = document.getElementById('cow-name');
		const cowAlarm = document.getElementById('cow-alarm');
		const cowID = document.getElementById('cow-id');
		const ledColorElement = document.getElementById('led-color');
		const locationElement = document.getElementById('cow-location');
		const lastUpdateElement = document.getElementById('cow-last-update');
		const heartRateElement = document.getElementById('cow-heart-rate');
		const ageElement = document.getElementById('cow-age');
		const breedElement = document.getElementById('cow-breed');
		const battElement = document.getElementById('cow-battery');
		const cowImage = document.getElementById('cow-image');

		// Update general information
		nameElement.textContent = cow.name || '';
		// if alarm is ok, set the color to green, if warning set to orange, if danger set to red
		if (cow.alarm === 'ok') {
			cowAlarm.textContent = 'OK';
			cowAlarm.style.color = 'green';
		} else if (cow.alarm === 'warning zone') {
			cowAlarm.textContent = 'Warning zone';
			cowAlarm.style.color = 'orange';
		} else if (cow.alarm === 'out of fence') {
			cowAlarm.textContent = 'Out of Fence';
			cowAlarm.style.color = 'red';
		} else {
			cowAlarm.textContent = 'No alarm';
			cowAlarm.style.color = '#555';
		}
		// set also font size and font type for the cow alarm
		cowAlarm.style.fontSize = '1rem';
		cowAlarm.style.fontFamily = 'Manrope, sans-serif';


		cowID.textContent = `ID: ${cow.id}`;
		locationElement.textContent = `Lon/Lat: ${cow.gps?.lon}, ${cow.gps?.lat}`;
		lastUpdateElement.textContent = `Last update: ${cow.gps?.time}`;
		heartRateElement.textContent = `TPulser: ${cow.gps?.tpulser}`;
		ageElement.textContent = `Birth date: ${cow.birthDate}`;
		breedElement.textContent = `Breed: ${cow.breed}`;
		ledColorElement.innerHTML = `LED: <span style="display: inline-block; width: 15px; height: 15px; background-color: ${cow.ledColor}; border-radius: 50%;"></span>`;

		// also edit LED button color background based on the cow led color but if the led color is black, set it to white
		if (cow.ledColor === '#000000') {
			ledButton.style.backgroundColor = '#ccc';
		} else {
			ledButton.style.backgroundColor = cow.ledColor;
		}

		// add cow image based on the cow id to the cowImage element
		cowImage.src = `css/icons/cows/${cow.id}.jpg`;

		// Check for `bat` data and update fields if present
		if (cow.bat) {
			battElement.textContent = `${cow.bat["%"]} %`;

		} else {
			// Clear the fields if there's no `bat` data
			battElement.textContent = '100 %';
		}

		let batteryPercentage = parseInt(battElement.textContent.replace('%', ''));
		// then check the battery percentage and set the color based on the percentage


		if (batteryPercentage > 75) {
			battElement.style.color = 'green';
		} else if (batteryPercentage > 50) {
			battElement.style.color = 'orange';
		} else {
			battElement.style.color = 'red';
		}

	};

	function closeGraphCard() {
		graphCardModal.classList.add('hidden'); // Hide the modal
	}

	const closeGraphElement = document.getElementById('close-graph-modal');

	closeGraphElement.addEventListener('click', function () {
		closeGraphCard();
	});


	const closeButtonElement = document.getElementById('close-card-modal');

	closeButtonElement.addEventListener('click', function () {
		closeCowCard();
	});

	const cowInfoCardElement = document.getElementById('cow-info-card-tab');
	const medicalCardElement = document.getElementById('medical-data-tab');
	const docUploadElement = document.getElementById('doc-upload-tab');

	medicalCardElement.addEventListener('click', function () {
		showMedicalPart();
	});
	
	cowInfoCardElement.addEventListener('click', function () {
		showMainPart();
	});

	docUploadElement.addEventListener('click', function () {
		showUploadPart();
	});

	let cardData;

	// Function to show the cow card modal
	function showCowCard(cow) {
		console.log('Showing cow card for cow:', cow);

		// Show the cow card modal
		const cowCardModal = document.getElementById('cow-card-modal');
		cowCardModal.classList.remove('hidden'); // Display the modal

		let cowID = String(cow.id);

		// find the cow data in the cardCowData object based on the cow id
		cardCowData.forEach(data => {
			if (String(data.id) === cowID) { // Ensure both are strings
				cardData = data;
			}
		});

		if (!cardData) {
			console.error('No card data found for cow ID:', cowID);
			return;
		}

		console.log('Card data:', cardData);


		// By default, show the main part when the cow card is shown
		showMedicalPart();
	}

	// Function to close the cow card modal
	function closeCowCard() {
		const cowCardModal = document.getElementById('cow-card-modal');
		cowCardModal.classList.add('hidden'); // Hide the modal
	}

	function showMainPart() {
		console.log('Showing cow-info part');
		document.getElementById('cow-info-card-part').classList.add('active');
		document.getElementById('medical-data-part').classList.remove('active');
		document.getElementById('doc-upload-part').classList.remove('active');

		document.getElementById('medical-data-tab').classList.remove('selected');
		document.getElementById('doc-upload-tab').classList.remove('selected');
		document.getElementById('cow-info-card-tab').classList.add('selected'
		)

		console.log('Card data:', cardData);

		// check if the cardData exist and if so, update the cow-info part with the data
			// update the cow-info part with the data from the cardData object
		let cowInfoData = cardData.main_data;
		let cowFertilityData = cardData.fertility_data;

		document.getElementById('cowId').value = cardData.id;
		document.getElementById('registrationNumber').value = cowInfoData.reg_num;
		document.getElementById('group').value = cowInfoData.grp;
		document.getElementById('herd').value = cowInfoData.herd;
		document.getElementById('passiveTag').value = cowInfoData.passive_tag;

		const ageYears = document.getElementById('ageYears');
		const birthDateInput = document.getElementById('birthDate'); // This is your input field for birth date

		// Check if birth_date exists in the cowInfoData object
		if(cowInfoData.birth_date && cowInfoData.age_years === '') {
			birthDateInput.value = cowInfoData.birth_date; // Set the value of the birthDate input field

			const birthDate = new Date(cowInfoData.birth_date);
			console.log('Parsed birthDate:', birthDate);

			// Check if the date is valid
			if (isNaN(birthDate.getTime())) {
				console.error('Invalid birthDate:', cowInfoData.birth_date);
				return;
			}

			const today = new Date();
			const yearDifference = today.getFullYear() - birthDate.getFullYear();

			// Calculate the exact age with decimals
			const monthDifference = today.getMonth() - birthDate.getMonth();
			const dayDifference = today.getDate() - birthDate.getDate();

			let age = yearDifference + (monthDifference / 12);

			// Adjust for negative day difference (if today is before the birth day in the current month)
			if (dayDifference < 0) {
				age -= (1 / 12); // Subtract approximately one month
			}

			// Format the age to show up to one or two decimal places if needed
			age = Math.max(age, 0).toFixed(2); // Ensures the age doesn't go below 0 and shows two decimals

			ageYears.value = age; // Set the calculated age to the ageYears input field
		} else {
			document.getElementById('ageYears').value = cowInfoData.age_years;
		}
		document.getElementById('breed').value = cowInfoData.breed;
		document.getElementById('oldId').value = cowInfoData.old_id;
		document.getElementById('lastBcs').value = cowInfoData.last_bsc;
		document.getElementById('deadQuarter').value = cowInfoData.dead_quarter;
		document.getElementById('name').value = cowInfoData.name;
		document.getElementById('herdBookNum').value = cowInfoData.herd_book_num;
		document.getElementById('groupName').value = cowInfoData.group_name;
		document.getElementById('tag').value = cowInfoData.tag;
		birthDate.value = cowInfoData.birth_date;
		document.getElementById('sex').value = cowInfoData.sex;
		document.getElementById('colour').value = cowInfoData.colour;
		document.getElementById('origin').value = cowInfoData.origin;
		document.getElementById('avgWeight').value = cowInfoData.avg_weight;

		document.getElementById('gyn-status').value = cowFertilityData.gyn_status;
		document.getElementById('calving-date').value = cowFertilityData.calving_date;
		document.getElementById('calving-exp-date').value = cowFertilityData.calving_expected_date;
		document.getElementById('insem-date').value = cowFertilityData.insem_date;
		document.getElementById('bull-name').value = cowFertilityData.bull_name;
		document.getElementById('days-preg').value = cowFertilityData.days_pregnant;
		document.getElementById('dry-off-exp-date').value = cowFertilityData.dry_off_expected_date;
		document.getElementById('lact-no').value = cowFertilityData.lact_no;
		document.getElementById('dim').value = cowFertilityData.dim;
		document.getElementById('days-to-calving').value = cowFertilityData.days_to_calving;
		document.getElementById('insem-no').value = cowFertilityData.insem_no;
		document.getElementById('after-insem').value = cowFertilityData.after_insem;
		document.getElementById('dry-days').value = cowFertilityData.dry_days;
		document.getElementById('days-to-dry-off').value = cowFertilityData.days_to_dry_off;

	}

	function showMedicalPart() {
		console.log('Showing medical part');
		document.getElementById('cow-info-card-part').classList.remove('active');
		document.getElementById('doc-upload-part').classList.remove('active');
		document.getElementById('medical-data-part').classList.add('active');

		document.getElementById('medical-data-tab').classList.add('selected');
		document.getElementById('doc-upload-tab').classList.remove('selected');
		document.getElementById('cow-info-card-tab').classList.remove('selected');

		// Access medical data and main data for cow details
		const medicalData = cardData.medical_data;
		const mainData = cardData.main_data;
		const medicalDataTextArea = document.getElementById('medical-note');
		const cowName = document.getElementById('cow-name-med');
		const cowID = document.getElementById('cow-id-med');


		// Extract information for the medical note
		let date = medicalData.date;
		let subjective = medicalData.subjective;
		let objective = medicalData.objective;
		let assessment = medicalData.assessment;
		let plan = medicalData.plan;

		// Extract information for the cow's details
		let regNum = mainData.reg_num;
		let breed = mainData.breed;
		let sex = mainData.sex;
		let birthDate = mainData.birth_date;
		let colour = mainData.colour;
		let avgWeight = mainData.avg_weight;
		let name = mainData.name;
		let id = cardData.id;

		// Update the cow name and ID in the medical part
		cowName.value = name;
		cowID.value = id;

		// Format the text for a structured and readable "doctor's note" appearance
		medicalDataTextArea.value =
			`===========================\n` +
			`Veterinary Report		\n` +
			`===========================\n\n` +
			`Cow Information:\n` +
			`- Registration Number: ${regNum}\n` +
			`- Breed: ${breed}\n` +
			`- Sex: ${sex}\n` +
			`- Birth Date: ${birthDate}\n` +
			`- Colour: ${colour}\n` +
			`- Weight: ${avgWeight} kg\n\n` +
			`===========================\n` +
			`Date of Checkup: ${date}\n\n` +
			`Procedure:\n` +
			`- Subjective:\n    ${subjective}\n\n` +
			`- Objective:\n    ${objective}\n\n` +
			`- Assessment:\n    ${assessment}\n\n` +
			`- Plan:\n    ${plan}\n\n` +
			`---------------------------\n` +
			`End of Report				\n` +
			`===========================`;

		// Optional: styling for note-like appearance
		medicalDataTextArea.style.fontFamily = 'Courier New, monospace';
		medicalDataTextArea.style.lineHeight = '1.3';
		medicalDataTextArea.style.padding = '10px';
	}


	function showUploadPart() {
		console.log('Showing upload part');
		document.getElementById('cow-info-card-part').classList.remove('active');
		document.getElementById('medical-data-part').classList.remove('active');
		document.getElementById('doc-upload-part').classList.add('active');

		document.getElementById('doc-upload-tab').classList.add('selected');
		document.getElementById('medical-data-tab').classList.remove('selected');
		document.getElementById('cow-info-card-tab').classList.remove('selected');
		
	}

	// button for saving the changes in the cow card
	const saveButton = document.getElementById('save-button');

	saveButton.addEventListener('click', function () {
		console.log('Save button clicked');
		// get all the data from the form and save it to the cardCowData object and also update the json file

		// get the cow id from the form
		const cowId = document.getElementById('cowId').value;

		// find the cow data in the cardCowData object based on the cow id
		cardCowData.forEach(data => {
			if (data.id === cowId) {
				cardData = data;
			}
		});

		if (!cardData) {
			console.error('No card data found for cow ID:', cowId);
			return;

		}

		// get the main data from the form
		const cowInfoData = cardData.main_data;

		cowInfoData.reg_num = document.getElementById('registrationNumber').value;
		cowInfoData.grp = document.getElementById('group').value;
		cowInfoData.herd = document.getElementById('herd').value;
		cowInfoData.passive_tag = document.getElementById('passiveTag').value;
		cowInfoData.birth_date = document.getElementById('birthDate').value;
		cowInfoData.breed = document.getElementById('breed').value;
		cowInfoData.old_id = document.getElementById('oldId').value;
		cowInfoData.last_bsc = document.getElementById('lastBcs').value;
		cowInfoData.dead_quarter = document.getElementById('deadQuarter').value;
		cowInfoData.name = document.getElementById('name').value;
		cowInfoData.herd_book_num = document.getElementById('herdBookNum').value;
		cowInfoData.group_name = document.getElementById('groupName').value;
		cowInfoData.tag = document.getElementById('tag').value;
		cowInfoData.sex = document.getElementById('sex').value;
		cowInfoData.colour = document.getElementById('colour').value;
		cowInfoData.origin = document.getElementById('origin').value;
		cowInfoData.avg_weight = document.getElementById('avgWeight').value;

		// get the fertility data from the form
		const fertilityData = cardData.fertility_data;

		fertilityData.gyn_status = document.getElementById('gyn-status').value;
		fertilityData.calving_date = document.getElementById('calving-date').value;
		fertilityData.calving_expected_date = document.getElementById('calving-exp-date').value;
		fertilityData.insem_date = document.getElementById('insem-date').value;
		fertilityData.bull_name = document.getElementById('bull-name').value;
		fertilityData.days_pregnant = document.getElementById('days-preg').value;
		fertilityData.dry_off_expected_date = document.getElementById('dry-off-exp-date').value;
		fertilityData.lact_no = document.getElementById('lact-no').value;
		fertilityData.dim = document.getElementById('dim').value;
		fertilityData.days_to_calving = document.getElementById('days-to-calving').value;
		fertilityData.insem_no = document.getElementById('insem-no').value;
		fertilityData.after_insem = document.getElementById('after-insem').value;
		fertilityData.dry_days = document.getElementById('dry-days').value;
		fertilityData.days_to_dry_off = document.getElementById('days-to-dry-off').value;

		// update the cardCowData object with the new data
		cardCowData.forEach(data => {
			if (data.id === cowId) {
				data = cardData;
			}
		});

		// also update the json file with the new data
		updateJsonFile(cardCowData);
	});

	function updateJsonFile(data) {
		// update the json file with the new data
		console.log('Updating JSON file with new data:', data);
		let jsonData = JSON.stringify(data, null, 2);
		// save the data to the json file, this stores the data in the local storage in the browser only!!
		localStorage.setItem('cowCardData', jsonData);
	}


	function clearCollarList() {
		const collarList = document.getElementById('collar-list');
		while (collarList.firstChild) {
			collarList.removeChild(collarList.firstChild)
		};
	};

	function sortCollars(criteria) {
		// sort only if the allCows array is not empty and is bigger than 1
		console.log('Cows:', allCows);
		console.log('Cow length:', allCows.length);

		if (allCows.length < 1) {
			console.error('No cows to sort');
			return 0;
		} else if (allCows.length === 1) {
			console.error('Only one cow to sort');
			return 0;
		}

		allCows.sort((a, b) => {
			console.log('Sorting by:', criteria);

			if (criteria == 'name') {
				return a.name.localeCompare(b.name); // Return comparison result
			} else if (criteria == 'id') {
				return a.id - b.id; // Return numeric comparison result
			} else if (criteria == 'alarm') {
				// sort by alarm status where danger and warning zone are first, then ok and no alarm
				const alarmOrder = ['out of fence', 'warning zone', 'ok', 'no alarm'];
				return alarmOrder.indexOf(a.alarm) - alarmOrder.indexOf(b.alarm);
			} else {
				console.error('Invalid sort criteria:', criteria);
				return 0; // Return default value
			}
		});

		// Clear the current list and re-add the sorted cows
		clearCollarList();

		allCows.forEach(cow => {
			addCowToList(cow); // Adds the sorted cows back to the list
		});
	}


	//TODO - Implement this function to display location data for a single cow


	function getRangePageLimit() {
		let limit = document.getElementById('limit_points').value;
		let page = document.getElementById('page').value;

		if (limit == null || page == null) {
			alert('Please enter both limit and page values');
			return { range: null, limit: null, page: null };
		}

		// get date range from start date to end date
		let start = document.getElementById('start-date').value;
		let end = document.getElementById('end-date').value;

		numLimit = parseInt(limit);
		// if limit is 0, set it to 100
		if (numLimit === 0) {
			alert('Limit cannot be 0, setting it to 100');
			limit = '100';
		} else if (numLimit > 500) {
			alert('Limit cannot be more than 500, setting it to 500');
			limit = '500';
		} else if (numLimit < 0) {
			alert('Limit cannot be negative, setting it to 100');
			limit = '100';
		}

		// if start or end date is not selected show alert
		if (!start || !end) {
			alert('Please select both start and end dates');
			return { range: null, limit: null, page: null };
		}

		let range = { start, end };
		console.log("Range:", range);

		return { range, limit, page };
	}

	function getLocationData(cow) {
		// clear the map of all markers and polylines before adding new ones
		clearMap();
		const cowID = cow.id;
		let { range, limit, page } = getRangePageLimit();
		if (!range || !limit || !page) {
			console.error('Invalid range, limit, or page');
			return;
		}

		console.log('Getting location data for cow:', cowID, 'with range:', range);
		fetchLonLatData(cowID, range, limit, page);
	}

	function fetchLonLatData(cowID, range, limit, page) {

		console.log('Getting location data for cow:', cowID, 'with range:', range);
		// get numbers from html elements limit_points and page

		// Unpack the range to get start end date:
		let dateFrom = range.start;
		let dateTo = range.end;

		// Construct the GPS API URL with query parameters
		const gpsURL = `http://18.170.252.93:3001/api/collars/${cowID}/gps_data?page=${page}&limit=${limit}&date_from=${dateFrom}&date_to=${dateTo}`;

		console.log('Fetching GPS data for cow:', cowID, 'from:', gpsURL);

		const options = {
			method: 'GET',
			headers: {
				'Authorization': 'Bearer secret963_aaaa-1234',
				'Content-Type': 'application/json',
			}
		};
		fetch(gpsURL, options)
			.then(async response => {
				if (!response.ok) {
					const error = await response.json();
					console.error('API Error:', error);
					// if error contains 422, it means that there is no data for the cow or for selected range/page/limit, notify the user
					if (error.error === 'HTTP error! Status: 422') {
						alert('No data found for the selected range/page/limit');
					}
					throw new Error('Failed to get GPS data');
				}
				return response.json();
			})
			.then(data => {
				if (!data || !Array.isArray(data.data) || data.data.length < 1) {
					alert('No data found for the selected cow');
					return;
				}
				processGPSData(data.data, cowID, range);

			})
			.catch(error => {
				console.error('Error:', error);
			});
	}

	function processGPSData(data, cowID, range) {
		if (!data || !Array.isArray(data)) {
			console.error('Invalid data format');
			return [];
		}

		if (!document.getElementById('heat-map-checkbox').checked && !document.getElementById('point-map-checkbox').checked) {
			console.error('No data type selected for display');
			alert('Please select a data type for display');
			return;
		}

		// Sort data by time in ascending order (oldest to newest)
		data.sort((a, b) => new Date(a.time) - new Date(b.time));

		let firstDateRange = data[0].time;
		let lastDateRange = data[data.length - 1].time;

		// 2024-12-01T10:36:48 - 2024-12-01T20:49:13 - format the date to more readable format
		firstDateRange = firstDateRange.replace('T', ' ').replace('-', '/').replace('-', '/').slice(0, 16);
		lastDateRange = lastDateRange.replace('T', ' ').replace('-', '/').replace('-', '/').slice(0, 16);

	

		let rangeInfoFrom = document.getElementById('range-info-from');
		let rangeInfoTo = document.getElementById('range-info-to');

		rangeInfoFrom.textContent = `From: ${firstDateRange}`;
		rangeInfoTo.textContent = `To: ${lastDateRange}`;

		// Extract the lon, lat, and date data
		const lonLatData = data.map(item => ({
			lon: item.gps_lon,
			lat: item.gps_lat,
			date: item.time,
		}));

		if (document.getElementById('heat-map-checkbox').checked) {
			addHeatMapToMap(lonLatData, range);
		} else if (document.getElementById('point-map-checkbox').checked) {
			addDotsToMap(lonLatData, range);
		} else {
			console.error('No data type selected for display');
			alert('Please select a data type for display');
			return
		}
	}

	function clearMap() {
		// Clear the map of all markers and polylines
		mapMarkers.forEach(marker => {
			marker.remove(); // Remove the marker from the map
		});
		mapMarkers = []; // Clear the map markers array

		if (polyline) {
			polyline.remove(); // Remove the polyline from the map
		}

		// Clear the heatmap layer if it exists
		if (heatLayer) {
			heatLayer.remove(); // Remove the heatmap layer from the map
		}

		let rangeInfoFrom = document.getElementById('range-info-from');
		let rangeInfoTo = document.getElementById('range-info-to');
		rangeInfoFrom.textContent = '';
		rangeInfoTo.textContent = '';

	}

	function addDotsToMap(lonLatData, range) {
		console.log('Adding dots to map');

		/* Structure of the data:
		0: 
			date: "2024-12-01T11:24:20"
			lat: 49.9263109
			lon: 16.604307
		*/

		// Array to hold the coordinates for the polyline
		const polylineCoordinates = [];

		// Loop through the combined data and add coordinates within the specified range
		let pointsFound = 0; // To count how many points are added
		lonLatData.forEach(entry => {
			let lon = entry.lon;
			let lat = entry.lat;

				// Add the current lon/lat to the polyline coordinates
				polylineCoordinates.push([lat, lon]);

				// Create a dot marker for this location and add it to the map
				const dotMarker = L.marker([lat, lon], { icon: smallIcon }).addTo(map);
				mapMarkers.push(dotMarker); // Store the marker in the array
				pointsFound++;
		});

		// Create a polyline using the coordinates and add it to the map
		if (polylineCoordinates.length > 1) {
			polyline = L.polyline(polygonCoordinates, { color: 'blue', weight: 3 }).addTo(map);
			// Fit the map to the polyline bounds
			map.fitBounds(polyline.getBounds());
		}

		console.log(`Added ${pointsFound} points to the map.`);

		// Display range information
		let rangeInfoFrom = document.getElementById('range-info-from');
		let rangeInfoTo = document.getElementById('range-info-to');
		if (lonLatData.length > 0) {
			rangeInfoFrom.textContent = `From: ${lonLatData[0].date}`;
			rangeInfoTo.textContent = `To: ${lonLatData[lonLatData.length - 1].date}`;
		}
	}

	// ==================== MAIN EVENT LISTENERS ====================
	
	// Sensor button event listeners for the details panel
	if (battBtn) {
		battBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Battery');
			}
		});
	}

	if (tempBtn) {
		tempBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Temperature');
			}
		});
	}

	if (speedBtn) {
		speedBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Speed');
			}
		});
	}

	if (accuBtn) {
		accuBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Accuracy');
			}
		});
	}

	if (altBtn) {
		altBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Altitude');
			}
		});
	}

	if (activityBtn) {
		activityBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Activity');
			}
		});
	}

	if (ruminationBtn) {
		ruminationBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Rumination');
			}
		});
	}

	if (pressBtn) {
		pressBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Pressure');
			}
		});
	}

	// LED Button event listeners
	if (ledButton) {
		ledButton.addEventListener('click', function(e) {
			e.stopPropagation();
			ledMenu.classList.toggle('show');
		});
	}

	// LED color option event listeners
	const ledOptions = document.querySelectorAll('.led-option, .led-color-option');
	ledOptions.forEach(option => {
		option.addEventListener('click', function(event) {
			event.stopPropagation();
			let selectedColor = event.target.getAttribute('data-color');
			if (!selectedColor) {
				selectedColor = event.target.closest('button').getAttribute('data-color');
			}
			
			if (selectedColor === '#000000') {
				selectedColor = '#ccc';
			}
			
			if (ledButton) {
				ledButton.style.backgroundColor = selectedColor;
			}

			if (currentCow) {
				const payload = {
					"collar_ids": [currentCow.id],
					color: selectedColor
				};
				updateLedColor(payload);
			}

			ledMenu.classList.remove('show');
		});
	});

	// Close LED dropdown when clicking outside
	document.addEventListener('click', function(event) {
		if (!event.target.closest('.dropdown') && ledMenu) {
			ledMenu.classList.remove('show');
		}
	});

	// Navigation button event listeners
	if (toggleDetailsBtn) {
		toggleDetailsBtn.addEventListener('click', function () {
			detailsPanel.classList.toggle('hidden');
		});
	}

	if (toggleDetailsArrow) {
		toggleDetailsArrow.addEventListener('click', function () {
			detailsPanel.classList.toggle('hidden');
		});
	}

	if (toggleDetailsArrowPanel) {
		toggleDetailsArrowPanel.addEventListener('click', function () {
			detailsPanel.classList.add('hidden');
		});
	}

	if (fencesButton) {
		fencesButton.addEventListener('click', function () {
			if (fencesPanel.classList.contains('hidden')) {
				hideAllPanels();
				fencesPanel.classList.remove('hidden');
				displayFences();
			} else {
				fencesPanel.classList.add('hidden');
			}
		});
	}

	if (herdsButton) {
		herdsButton.addEventListener('click', function () {
			if (herdsPanel.classList.contains('hidden')) {
				hideAllPanels();
				herdsPanel.classList.remove('hidden');
				displayHerds();
			} else {
				herdsPanel.classList.add('hidden');
			}
		});
	}

	if (showCowCardButton) {
		showCowCardButton.addEventListener('click', function () {
			if (currentCow) {
				showCowCard(currentCow);
			}
		});
	}

	if (showButton) {
		showButton.addEventListener('click', function () {
			showLocationsForCow();
		});
	}

	if (clearButton) {
		clearButton.addEventListener('click', function () {
			clearMap();
		});
	}

	if (moreDetailsButton) {
		moreDetailsButton.addEventListener('click', function () {
			moreDetails.classList.toggle('hidden');
		});
	}

	// Initialize the application
	initializeWebSocket();
	loadGW();

	// Helper function to hide all panels
	function hideAllPanels() {
		fencesPanel.classList.add('hidden');
		herdsPanel.classList.add('hidden');
		// Don't hide details panel here - let user close it manually
	}

	// Helper function to display fences
	function displayFences() {
		fenceList.innerHTML = '';
		Object.values(fenceData).forEach(fence => {
			const li = document.createElement('li');
			li.className = 'fence-item';
			li.innerHTML = `
				<div class="fence-info">
					<h4>${fence.name}</h4>
					<p>ID: ${fence.id}</p>
					<p>Status: ${fence.color}</p>
					<p>Cows: ${fence.cows.length}</p>
				</div>
			`;
			fenceList.appendChild(li);
		});
	}

	// Helper function to display herds
	function displayHerds() {
		herdList.innerHTML = '';
		Object.values(herdData).forEach(herd => {
			const li = document.createElement('li');
			li.className = 'herd-item';
			li.innerHTML = `
				<div class="herd-info">
					<h4>${herd.name}</h4>
					<p>ID: ${herd.id}</p>
					<p>Color: ${herd.color}</p>
					<p>Cows: ${herd.cows.length}</p>
				</div>
			`;
			herdList.appendChild(li);
		});
	}

	// Helper function to get cow details by ID
	function getCowDetailsById(cowId, dataType) {
		if (!cowId || !dataType || cowId === '--') {
			console.error('Invalid parameters:', cowId, dataType);
			return;
		}
		
		// This would integrate with the existing data fetching functions
		console.log(`Getting ${dataType} data for cow ${cowId}`);
		// You can integrate this with the existing getCowDetailsById function
	}

	// Function to load gateway and collar information from the API
	function loadGW() {
		const collarsUrl = 'http://localhost:3001/api/gateways/1';
		console.log('Loading gateway and collar data:', collarsUrl);
		
		const options = {
			method: 'GET',
			headers: {
				'Authorization': 'Bearer secret963_aaaa-1234',
				'Content-Type': 'application/json',
			}
		};

		fetch(collarsUrl, options)
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then(data => {
				console.log('Gateway data:', data);
				const deviceType = data.device_type;
				const GWName = data.name;
				const GWLat = data.gps_lat;
				const GWLon = data.gps_lon;
				const GWID = data.id;
				const deviceID = data.device_id;
				const collarList = data.collars;

				let totalCollars = 0;
				// get number of collars based on the length of the collar list
				if (collarList) {
					totalCollars = collarList.length;
				}
				
				// add the gateway to the map
				const marker = L.marker([GWLat, GWLon], { icon: smallIcon }).addTo(map);
				
				// add popup to the marker with gateway info and number of collars
				marker.bindPopup(`Gateway: ${GWName}<br>Device ID: ${deviceID}<br>Device Type: ${deviceType}<br>Collars: ${totalCollars}`);

				// Process collar list to initialize cow data
				if (collarList && collarList.length > 0) {
					collarList.forEach(collar => {
						if (collar.animal) {
							const cow = {
								id: collar.animal.id,
								name: collar.animal.name,
								deviceID: collar.device_id,
								deviceType: collar.device_type,
								ledColor: collar.led_color,
								fenceIDs: collar.fences_ids,
								type: collar.animal.animal_type,
								breed: collar.animal.breed_type,
								animalCode: collar.animal.animal_code,
								birthDate: collar.animal.birth_date,
								hasImage: collar.animal.has_image,
								alarm: 'ok' // Default alarm status
							};

							// Add cow to allCows array
							const existingIndex = allCows.findIndex(existingCow => existingCow.id === cow.id);
							if (existingIndex >= 0) {
								allCows[existingIndex] = cow;
							} else {
								allCows.push(cow);
							}

							// Add cow to list if not already present
							if (!listItems[cow.id]) {
								addCowToList(cow);
							}
						}
					});

					console.log('Loaded cows from gateway:', allCows);
					displayCows();
				}
			})
			.catch(error => {
				console.error('Error loading gateway data:', error);
			});
	}

	// Function to process WebSocket data and update cow information
	function loadCollarDetails(data) {
		console.log('Processing WebSocket data:', data);
		
		if (!data || !data.data || !Array.isArray(data.data)) {
			console.error('Invalid data format received:', data);
			return;
		}

		// Clear existing data for fresh update
		allCows = [];

		// Process each collar message from the WebSocket data
		data.data.forEach(collarData => {
			if (collarData.id && collarData.gps_lat && collarData.gps_lon) {
				const cow = {
					id: collarData.id,
					name: collarData.name || `Cow ${collarData.id}`,
					alarm: collarData.alarm || 'ok',
					gps: {
						lat: parseFloat(collarData.gps_lat),
						lon: parseFloat(collarData.gps_lon),
						time: collarData.time || new Date().toISOString(),
						speed: collarData.gps_speed || 0,
						accur: collarData.gps_accuracy || 0,
						alt: collarData.gps_altitude || 0,
						tpulser: collarData.tpulser || 0
					},
					ledColor: collarData.led_color || '#00ff00',
					breed: collarData.breed_type || 'Unknown',
					birthDate: collarData.birth_date || '2021-01-01',
					bat: collarData.battery ? { "%": collarData.battery } : null
				};

				// Add cow to allCows array
				allCows.push(cow);

				// Add or update marker on map
				addMarkerToMap(cow);

				// Add cow to list if not already present
				if (!listItems[cow.id]) {
					addCowToList(cow);
				} else {
					// Update existing list item
					updateAlarm(cow);
				}
			}
		});

		// Sort and display cows
		displayCows();
		console.log('Updated cow data:', allCows);
	}

	// Helper function to display cows
	function displayCows() {
		// Don't clear the list - addCowToList handles updates
		// Sort cows by ID
		allCows.sort((a, b) => a.id - b.id);

		// Add or update each cow in the list
		allCows.forEach(cow => {
			addCowToList(cow);
		});
	}

	// Function to load card data from the JSON file
	function loadCardData() {
		fetch('data/card_data.json')
			.then(response => {
				if (!response.ok) {
					throw new Error(`Failed to load card data: ${response.status}`);
				}
				return response.json();
			})
			.then(data => {
				cardCowData = data;
				console.log('Loaded card data:', cardCowData);
			})
			.catch(error => {
				console.error('Error loading card data:', error);
				// Initialize with empty array if loading fails
				cardCowData = [];
			});
	}

	//TODO - Implement this function to display location data for a single cow


	function getRangePageLimit() {
		let limit = document.getElementById('limit_points').value;
		let page = document.getElementById('page').value;

		if (limit == null || page == null) {
			alert('Please enter both limit and page values');
			return { range: null, limit: null, page: null };
		}

		// get date range from start date to end date
		let start = document.getElementById('start-date').value;
		let end = document.getElementById('end-date').value;

		numLimit = parseInt(limit);
		// if limit is 0, set it to 100
		if (numLimit === 0) {
			alert('Limit cannot be 0, setting it to 100');
			limit = '100';
		} else if (numLimit > 500) {
			alert('Limit cannot be more than 500, setting it to 500');
			limit = '500';
		} else if (numLimit < 0) {
			alert('Limit cannot be negative, setting it to 100');
			limit = '100';
		}

		// if start or end date is not selected show alert
		if (!start || !end) {
			alert('Please select both start and end dates');
			return { range: null, limit: null, page: null };
		}

		let range = { start, end };
		console.log("Range:", range);

		return { range, limit, page };
	}

	function getLocationData(cow) {
		// clear the map of all markers and polylines before adding new ones
		clearMap();
		const cowID = cow.id;
		let { range, limit, page } = getRangePageLimit();
		if (!range || !limit || !page) {
			console.error('Invalid range, limit, or page');
			return;
		}

		console.log('Getting location data for cow:', cowID, 'with range:', range);
		fetchLonLatData(cowID, range, limit, page);
	}

	function fetchLonLatData(cowID, range, limit, page) {

		console.log('Getting location data for cow:', cowID, 'with range:', range);
		// get numbers from html elements limit_points and page

		// Unpack the range to get start end date:
		let dateFrom = range.start;
		let dateTo = range.end;

		// Construct the GPS API URL with query parameters
		const gpsURL = `http://18.170.252.93:3001/api/collars/${cowID}/gps_data?page=${page}&limit=${limit}&date_from=${dateFrom}&date_to=${dateTo}`;

		console.log('Fetching GPS data for cow:', cowID, 'from:', gpsURL);

		const options = {
			method: 'GET',
			headers: {
				'Authorization': 'Bearer secret963_aaaa-1234',
				'Content-Type': 'application/json',
			}
		};
		fetch(gpsURL, options)
			.then(async response => {
				if (!response.ok) {
					const error = await response.json();
					console.error('API Error:', error);
					// if error contains 422, it means that there is no data for the cow or for selected range/page/limit, notify the user
					if (error.error === 'HTTP error! Status: 422') {
						alert('No data found for the selected range/page/limit');
					}
					throw new Error('Failed to get GPS data');
				}
				return response.json();
			})
			.then(data => {
				if (!data || !Array.isArray(data.data) || data.data.length < 1) {
					alert('No data found for the selected cow');
					return;
				}
				processGPSData(data.data, cowID, range);

			})
			.catch(error => {
				console.error('Error:', error);
			});
	}

	function processGPSData(data, cowID, range) {
		if (!data || !Array.isArray(data)) {
			console.error('Invalid data format');
			return [];
		}

		if (!document.getElementById('heat-map-checkbox').checked && !document.getElementById('point-map-checkbox').checked) {
			console.error('No data type selected for display');
			alert('Please select a data type for display');
			return;
		}

		// Sort data by time in ascending order (oldest to newest)
		data.sort((a, b) => new Date(a.time) - new Date(b.time));

		let firstDateRange = data[0].time;
		let lastDateRange = data[data.length - 1].time;

		// 2024-12-01T10:36:48 - 2024-12-01T20:49:13 - format the date to more readable format
		firstDateRange = firstDateRange.replace('T', ' ').replace('-', '/').replace('-', '/').slice(0, 16);
		lastDateRange = lastDateRange.replace('T', ' ').replace('-', '/').replace('-', '/').slice(0, 16);

	

		let rangeInfoFrom = document.getElementById('range-info-from');
		let rangeInfoTo = document.getElementById('range-info-to');

		rangeInfoFrom.textContent = `From: ${firstDateRange}`;
		rangeInfoTo.textContent = `To: ${lastDateRange}`;

		// Extract the lon, lat, and date data
		const lonLatData = data.map(item => ({
			lon: item.gps_lon,
			lat: item.gps_lat,
			date: item.time,
		}));

		if (document.getElementById('heat-map-checkbox').checked) {
			addHeatMapToMap(lonLatData, range);
		} else if (document.getElementById('point-map-checkbox').checked) {
			addDotsToMap(lonLatData, range);
		} else {
			console.error('No data type selected for display');
			alert('Please select a data type for display');
			return
		}
	}

	function clearMap() {
		// Clear the map of all markers and polylines
		mapMarkers.forEach(marker => {
			marker.remove(); // Remove the marker from the map
		});
		mapMarkers = []; // Clear the map markers array

		if (polyline) {
			polyline.remove(); // Remove the polyline from the map
		}

		// Clear the heatmap layer if it exists
		if (heatLayer) {
			heatLayer.remove(); // Remove the heatmap layer from the map
		}

		let rangeInfoFrom = document.getElementById('range-info-from');
		let rangeInfoTo = document.getElementById('range-info-to');
		rangeInfoFrom.textContent = '';
		rangeInfoTo.textContent = '';

	}

	function addDotsToMap(lonLatData, range) {
		console.log('Adding dots to map');

		/* Structure of the data:
		0: 
			date: "2024-12-01T11:24:20"
			lat: 49.9263109
			lon: 16.604307
		*/

		// Array to hold the coordinates for the polyline
		const polylineCoordinates = [];

		// Loop through the combined data and add coordinates within the specified range
		let pointsFound = 0; // To count how many points are added
		lonLatData.forEach(entry => {
			let lon = entry.lon;
			let lat = entry.lat;

				// Add the current lon/lat to the polyline coordinates
				polylineCoordinates.push([lat, lon]);

				// Create a dot marker for this location and add it to the map
				const dotMarker = L.marker([lat, lon], { icon: smallIcon }).addTo(map);
				mapMarkers.push(dotMarker); // Store the marker in the array
				pointsFound++;
		});

		// Create a polyline using the coordinates and add it to the map
		if (polylineCoordinates.length > 1) {
			polyline = L.polyline(polygonCoordinates, { color: 'blue', weight: 3 }).addTo(map);
			// Fit the map to the polyline bounds
			map.fitBounds(polyline.getBounds());
		}

		console.log(`Added ${pointsFound} points to the map.`);

		// Display range information
		let rangeInfoFrom = document.getElementById('range-info-from');
		let rangeInfoTo = document.getElementById('range-info-to');
		if (lonLatData.length > 0) {
			rangeInfoFrom.textContent = `From: ${lonLatData[0].date}`;
			rangeInfoTo.textContent = `To: ${lonLatData[lonLatData.length - 1].date}`;
		}
	}

	// ==================== MAIN EVENT LISTENERS ====================
	
	// Sensor button event listeners for the details panel
	if (battBtn) {
		battBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Battery');
			}
		});
	}

	if (tempBtn) {
		tempBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Temperature');
			}
		});
	}

	if (speedBtn) {
		speedBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Speed');
			}
		});
	}

	if (accuBtn) {
		accuBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Accuracy');
			}
		});
	}

	if (altBtn) {
		altBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Altitude');
			}
		});
	}

	if (activityBtn) {
		activityBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Activity');
			}
		});
	}

	if (ruminationBtn) {
		ruminationBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Rumination');
			}
		});
	}

	if (pressBtn) {
		pressBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id').textContent.split(' ')[1];
			if (cowID && cowID !== '--') {
				getCowDetailsById(cowID, 'Pressure');
			}
		});
	}

	// LED Button event listeners
	if (ledButton) {
		ledButton.addEventListener('click', function(e) {
			e.stopPropagation();
			ledMenu.classList.toggle('show');
		});
	}

	ledOptions.forEach(option => {
		option.addEventListener('click', function(event) {
			event.stopPropagation();
			let selectedColor = event.target.getAttribute('data-color');
			if (!selectedColor) {
				selectedColor = event.target.closest('button').getAttribute('data-color');
			}
			
			if (selectedColor === '#000000') {
				selectedColor = '#ccc';
			}
			
			if (ledButton) {
				ledButton.style.backgroundColor = selectedColor;
			}

			if (currentCow) {
				const payload = {
					"collar_ids": [currentCow.id],
					color: selectedColor
				};
				updateLedColor(payload);
			}

			ledMenu.classList.remove('show');
		});
	});

	// Close LED dropdown when clicking outside
	document.addEventListener('click', function(event) {
		if (!event.target.closest('.dropdown') && ledMenu) {
			ledMenu.classList.remove('show');
		}
	});

	// Initialize the application
	initializeWebSocket();
	loadGW();
	loadCardData();

	// Helper function to hide all panels
	function hideAllPanels() {
		fencesPanel.classList.add('hidden');
		herdsPanel.classList.add('hidden');
		detailsPanel.classList.add('hidden');
	}

	// Helper function to display fences
	function displayFences() {
		fenceList.innerHTML = '';
		Object.values(fenceData).forEach(fence => {
			const li = document.createElement('li');
			li.className = 'fence-item';
			li.innerHTML = `
				<div class="fence-info">
					<h4>${fence.name}</h4>
					<p>ID: ${fence.id}</p>
					<p>Status: ${fence.color}</p>
					<p>Cows: ${fence.cows.length}</p>
				</div>
			`;
			fenceList.appendChild(li);
		});
	}

	// Helper function to display herds
	function displayHerds() {
		herdList.innerHTML = '';
		Object.values(herdData).forEach(herd => {
			const li = document.createElement('li');
			li.className = 'herd-item';
			li.innerHTML = `
				<div class="herd-info">
					<h4>${herd.name}</h4>
					<p>ID: ${herd.id}</p>
					<p>Color: ${herd.color}</p>
					<p>Cows: ${herd.cows.length}</p>
				</div>
			`;
			herdList.appendChild(li);
		});
	}

	// Helper function to get cow details by ID
	function getCowDetailsById(cowId, dataType) {
		if (!cowId || !dataType || cowId === '--') {
			console.error('Invalid parameters:', cowId, dataType);
			return;
		}
		
		// This would integrate with the existing data fetching functions
		console.log(`Getting ${dataType} data for cow ${cowId}`);
		// You can integrate this with the existing getCowDetailsById function
	}

	// LED Button Event Listener
	if (ledButton) {
		ledButton.addEventListener('click', () => {
			if (ledMenu) {
				ledMenu.classList.toggle('show');
			}
		});
		
		// LED Color Option Event Listeners
		const ledOptions = document.querySelectorAll('.led-color-option');
		ledOptions.forEach(option => {
			option.addEventListener('click', (event) => {
				event.preventDefault();
				const color = option.getAttribute('data-color');
				if (color && currentCow) {
					// Send LED color change command
					fetch('/api/collars/led', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							collar_id: currentCow.id,
							color: color
						})
					}).then(response => response.json())
					.then(data => {
						console.log('LED color changed:', data);
						// Update the LED color display
						if (document.getElementById('led-color')) {
							document.getElementById('led-color').textContent = `LED: ${color}`;
						}
					}).catch(error => {
						console.error('Error changing LED color:', error);
					});
				}
				// Hide the menu after selection
				if (ledMenu) {
					ledMenu.classList.remove('show');
				}
			});
		});
	}

	// Sensor Button Event Listeners
	if (battBtn) {
		battBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id')?.textContent.split(' ')[1];
			if (cowID) getCowDetailsById(cowID, 'Battery');
		});
	}

	if (tempBtn) {
		tempBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id')?.textContent.split(' ')[1];
			if (cowID) getCowDetailsById(cowID, 'Temperature');
		});
	}

	if (speedBtn) {
		speedBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id')?.textContent.split(' ')[1];
			if (cowID) getCowDetailsById(cowID, 'Speed');
		});
	}

	if (accuBtn) {
		accuBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id')?.textContent.split(' ')[1];
			if (cowID) getCowDetailsById(cowID, 'Accuracy');
		});
	}

	if (altBtn) {
		altBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id')?.textContent.split(' ')[1];
			if (cowID) getCowDetailsById(cowID, 'Altitude');
		});
	}

	if (activityBtn) {
		activityBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id')?.textContent.split(' ')[1];
			if (cowID) getCowDetailsById(cowID, 'Activity');
		});
	}

	if (ruminationBtn) {
		ruminationBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id')?.textContent.split(' ')[1];
			if (cowID) getCowDetailsById(cowID, 'Rumination');
		});
	}

	if (pressBtn) {
		pressBtn.addEventListener('click', function () {
			const cowID = document.getElementById('cow-id')?.textContent.split(' ')[1];
			if (cowID) getCowDetailsById(cowID, 'Pressure');
		});
	}

	// Sound and Shock Button Event Listeners
	if (soundButton) {
		soundButton.addEventListener('click', function () {
			if (currentCow) {
				fetch('/api/collars/play_sound', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						collar_id: currentCow.id
					})
				}).then(response => response.json())
				.then(data => {
					console.log('Sound command sent:', data);
				}).catch(error => {
					console.error('Error sending sound command:', error);
				});
			}
		});
	}

	if (shockButton) {
		shockButton.addEventListener('click', function () {
			if (currentCow && confirm('Are you sure you want to send a shock command?')) {
				fetch('/api/collars/give_shock', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						collar_id: currentCow.id
					})
				}).then(response => response.json())
				.then(data => {
					console.log('Shock command sent:', data);
				}).catch(error => {
					console.error('Error sending shock command:', error);
				});
			}
		});
	}

	// Click outside to close LED menu
	document.addEventListener('click', function(event) {
		if (ledMenu && !ledButton?.contains(event.target) && !ledMenu.contains(event.target)) {
			ledMenu.classList.remove('show');
		}
	});

	// Initialize the application
	console.log('Initializing CowTracker application...');
	
	// Load static data first
	loadCardData();
	
	// Load gateway and initial collar data
	loadGW();
	
	// Initialize WebSocket for real-time updates
	initializeWebSocket();
	
	console.log('Application initialized successfully');

});
