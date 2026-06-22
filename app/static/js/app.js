const socket = new WebSocket("ws://127.0.0.1:8000/ws/data");
let kpChart = null;
let issMap = null;
let issMarker = null;
let auroraLayer = null;
let showAlertSent = false;
let kpHistoryChart = null;


function initKpChart() {
	const ctx = document.getElementById("kp-chart").getContext("2d");
	kpChart = new Chart(ctx, {
		type: "line",
		data: {
			labels: [],
			datasets: [
				{
					label: "Kp Index",
					data: [],
					borderColor: "#44ff44",
					fill: false,
					tension: 0.3,
				},
			],
		},
		options: {
			responsive: true,
			maitainAspectRatio: false,
			scales: {
				y: {
					min: 0,
					max: 9,
					ticks: {
						stepSize: 1
					}
				},
			},
		},
	})
}


function initKpHistoryChart() {
	const ctx = document.getElementById("kp-history-chart").getContext("2d");
	kpHistoryChart = new Chart(ctx, {
		type: "line",
		data: {
			labels: [],
			datasets: [{
				label: "Kp History (30 days)",
				data: [],
				borderColor: "#ffaa00",
				fill: false,
				tension: 0.2,
				pointRadius: 0
			}]
		},
		options: {
			responsive: true,
			maitainAspectRatio: false,
			scales: {
				y: {
					min: 0,
					max: 9,
					ticks: {
						stepSize: 1
					}
				}
			}
		}
	});
}


async function loadKpHistory() {
	try {
		const response = await fetch("/api/kp/history");
		const history = await response.json();
		
		if (kpHistoryChart && history.length > 0) {
			kpHistoryChart.data.labels = history.map(function(item) {
				return formatTime(item.time);
			});
			kpHistoryChart.data.datasets[0].data = history.map(function(item) {
				return item.kp;
			});
			kpHistoryChart.update();
		}
	} catch (error) {
		console.error("Failed to load kp history:", error);
	}
}


function formatTime(isoString) {
	if (!isoString) return "N/A";
	
	if (!isoString.endsWith("Z") && !isoString.includes("+")) {
		isoString += "Z";
	}
	
	const date = new Date(isoString);
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`
}


function getAuroraColor(intensity) {
	if (intensity > 50) return "#ff4444";
	if (intensity > 25) return "#ffaa00";
	if (intensity > 10) return "#ffff00";
	return "#44ff44";
}


function updateDashboard(data) {
	document.getElementById("last-updated").innerHTML = "Updated: " + formatTime(data.updated_at);
	updateISS(data.iss);
	updateFlares(data.flares);
	updateCME(data.cme);
	updateKpIndex(data.kp_index);
	updateAurora(data.aurora);
	console.log("Dashboard updated");
}


function updateISS(iss) {
	const issCoords = document.getElementById("iss-coords");
	
	if (!issMap) {
		issMap = L.map("iss-map").setView([0, 0], 2);
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution: '&copy; OpenStreetMap contributors'
		}).addTo(issMap);
	}
	
	if (iss === null) {
    issCoords.textContent = "No data";
    return;
  }
	
	issCoords.textContent = `Lat: ${iss.latitude}, Lon: ${iss.longitude}`;
	
	if (!issMarker) {
		issMarker = L.marker([iss.latitude, iss.longitude]).addTo(issMap);
	} else {
		issMarker.setLatLng([iss.latitude, iss.longitude]);
	}
	
	issMap.setView([iss.latitude, iss.longitude]);
}


function updateFlares(flares) {
	const flaresTable = document.getElementById("flares-table");
	if (!flares || flares.length === 0) {
		flaresTable.innerHTML = `<tr>
			<td colspan="3">No recent flares</td>
		</tr>`;
		return;
	}
	
	let rows = "";
	
	flares.slice(0, 5).forEach(flare => {
		rows += `<tr>
			<td>${formatTime(flare.time)}</td>
			<td>${flare.class || "N/A"}</td>
			<td>${flare.source || "N/A"}</td>
		</tr>`;
	});
	
	flaresTable.innerHTML = rows;
}


function updateCME(cmes) {
	const cmeTable = document.getElementById("cme-table");
	if (!cmes || cmes.length === 0) {
		cmeTable.innerHTML = `<tr>
			<td colspan="3">No recent CMEs</td>
		</tr>`;
    return;
	}
	
	let rows = "";

  cmes.slice(0, 5).forEach((cme) => {
    rows += `<tr>
			<td>${formatTime(cme.time)}</td>
			<td>${cme.speed || "N/A"}</td>
			<td>${cme.type || "N/A"}</td>
		</tr>`;
  });

  cmeTable.innerHTML = rows;
}


function updateKpIndex(kpData) {
	const kpValue = document.getElementById("kp-value");
	const kpStatus = document.getElementById("kp-status");
	if (!kpData || kpData.length === 0) {
		kpValue.textContent = "--";
  	kpStatus.textContent = "No data";
		return;
	}
	
	const latest = kpData[kpData.length - 1];
	kpValue.textContent = latest.kp;
	kpStatus.textContent = latest.status;
	
	if (latest.status.includes("Storm")) {
		kpStatus.style.color = "#ff4444";
	} else if ((latest.status.includes("Active"))) {
		kpStatus.style.color = "#ffaa00";
	} else {
		kpStatus.style.color = "#44ff44";
	}
	
	if (kpChart) {
		kpChart.data.labels = kpData.map(d => formatTime(d.time));
		kpChart.data.datasets[0].data = kpData.map(d => d.kp);
		kpChart.update();
	}
	
	if (latest.kp >= 5 && !showAlertSent) {
		showNotification("⚠️ Magnetic Storm! Kp = " + latest.kp, "danger");
		showAlertSent = true;
	} else if (latest.kp > 4) {
		showAlertSent = false;
	}
}


function updateAurora(aurora) {
	const auroraObsTime = document.getElementById("aurora-obs-time");
	const auroraForecastTime = document.getElementById("aurora-forecast-time");
	const auroraIntensity = document.getElementById("aurora-intensity");
	
	if (!aurora || !aurora.coordinates) {
		auroraObsTime.textContent = "No data";
		auroraForecastTime.textContent = "";
		auroraIntensity.textContent = "";
		return;
	}
	
	auroraObsTime.textContent = "Observed: " + formatTime(aurora.observation_time);
	auroraForecastTime.textContent = "Forecast: " + formatTime(aurora.forecast_time);
	
	let maxIntensity = 0;
	aurora.coordinates.forEach(coord => {
		if (coord[2] > maxIntensity) {
			maxIntensity = coord[2];
		}
	});
	
	if (maxIntensity > 50) {
		auroraIntensity.textContent = `High (${maxIntensity})`;
		auroraIntensity.style.color = "#ff4444";
	} else if (maxIntensity > 25) {
		auroraIntensity.textContent = `Moderate (${maxIntensity})`;
		auroraIntensity.style.color = "#ffaa00";
	} else {
		auroraIntensity.textContent = `Low (${maxIntensity})`;
    auroraIntensity.style.color = "#44ff44";
	}
	
	if (issMap) {
		if (auroraLayer) {
			issMap.removeLayer(auroraLayer);
		}
		
		const circles = [];
		aurora.coordinates.forEach(coord => {
			if (coord[2] > 0) {
				circles.push(
          L.circleMarker([coord[1], coord[0]], {
            radius: 2,
            fillColor: getAuroraColor(coord[2]),
            color: getAuroraColor(coord[2]),
            fillOpacity: coord[2] / 100,
            weight: 0,
          }),
        );
			}
		});
		
		auroraLayer = L.layerGroup(circles).addTo(issMap);
	}
}


function showNotification(message, type = "info") {
	const container = document.createElement("div");
	container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    z-index: 9999;
    cursor: pointer;
    animation: slideIn 0.3s ease;
  `;
	
	if (type === "danger") container.style.background = "#ff4444";
	else if (type === "warning") container.style.background = "#ffaa00";
	else container.style.background = "#3498db";
	
	container.textContent = message;
	document.body.appendChild(container);
	
	setTimeout(() => container.remove(), 5000);
	container.addEventListener("click", () => container.remove());
}


function showPasses(passes) {
	const passesDiv = document.getElementById("iss-passes");
	
	if (!passes || passes.length === 0) {
		passesDiv.innerHTML = "<p>No upcoming passes</p>";
		return;
	}
	
	let html = "<strong>Upcoming passes:</strong><ul>";
	passes.forEach(function(p) {
		const riseDate = new Date(p.rise_time * 1000);
		const time = `${String(riseDate.getHours()).padStart(2, "0")}:${String(riseDate.getMinutes()).padStart(2, "0")}`;
		const date = `${String(riseDate.getDate()).padStart(2, "0")}.${String(riseDate.getMonth() + 1).padStart(2, "0")}`;
		const durationMin = Math.round(p.duration_seconds / 60);
		
		html += `<li>${date} at ${time} - ${durationMin} min</li>`;
	});
	
	html += "</ul>";
	passesDiv.innerHTML = html;
}


document.getElementById("check-passes-btn").addEventListener("click", async function() {
	const lat = parseFloat(document.getElementById("user-lat").value);
	const lon = parseFloat(document.getElementById("user-lon").value);
	
	if (isNaN(lat) || isNaN(lon)) {
		showNotification("Please enter valid coordinates", "warning");
		return;
	}
	
	localStorage.setItem("user-lat", lat);
	localStorage.setItem("user-lon", lon);
	
	try {
		const response = await fetch(`/api/iss/passes?lat=${lat}&lon=${lon}`);
		const data = await response.json();
		showPasses(data.passes);
	} catch (error) {
		console.error("Error: ", error);
		showNotification("Failed to get passes", "danger");
	}
})


document.getElementById("refresh_btn").addEventListener("click", async function() {
	try {
		const response = await fetch("/api/refresh", {
			method: "POST"
		});
		showNotification("Refresh started...", "info");
		setTimeout(loadKpHistory, 3000);
	} catch (error) {
		console.error("Refresh error: ", error);
	}
});


document.getElementById("export_btn").addEventListener("click", function() {
	window.open("/api/export", "_blank");
})


socket.onopen = function () {
	document.getElementById("connection-status").innerHTML = "🟢 Live";
	
	initKpChart();
	initKpHistoryChart();
	loadKpHistory();
	
	const savedLat = localStorage.getItem("user-lat");
	const savedLon = localStorage.getItem("user-lon");
	if (savedLat) document.getElementById("user-lat").value = savedLat;
	if (savedLon) document.getElementById("user-lon").value = savedLon;
	
	fetch("/api/data")
		.then(res => res.json())
		.then(data => updateDashboard(data));
};

socket.onmessage = function (event) {
	const data = JSON.parse(event.data);
	updateDashboard(data);
}

socket.onclose = function () {
	document.getElementById("connection-status").innerHTML = "🔴 Offline";
}

socket.onerror = function () {
	document.getElementById("connection-status").innerHTML = "🔴 Error";
}
