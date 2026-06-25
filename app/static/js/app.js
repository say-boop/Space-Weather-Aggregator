const socket = new WebSocket("ws://127.0.0.1:8000/ws/data");
let kpChart = null;
let radiationChart = null;
let issMap = null;
let issMarker = null;
let auroraLayer = null;
let showAlertSent = false;
let kpHistoryChart = null;
let currentLang = localStorage.getItem("lang") || "en";
let translations = {};


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


function initRadiationChart() {
  const ctx = document.getElementById("radiation-chart").getContext("2d");
  radiationChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Electron Flux",
          data: [],
          borderColor: "#ff8800",
          fill: false,
          tension: 0.3,
					pointRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maitainAspectRatio: false,
      scales: {
        y: {
          type: "logarithmic",
					ticks: {
						color: "#aaa"
					},
					grid: {
						color: "#222"
					},
        },
				x: {
					ticks: {
						color: "#aaa",
						maxTicksLimit: 10
					},
					grid: {
						display: false
					}
				}
      },
    },
  });
}


async function loadKpHistory() {
	try {
		const response = await fetch("/api/kp/history");
		const history = await response.json();
		
		if (kpHistoryChart && history && history.length > 0) {
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
	updateAsteroids(data.asteroids);
	updateRadiation(data.radiation);
	updateSolarWind(data.solar_wind, data.bz_data);
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
    issCoords.textContent = translations["no_data"] || "No data";
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
			<td colspan="3">${translations["no_flares"] || "No recent flares"}</td>
		</tr>`;
		return;
	}
	
	let rows = "";
	
	flares.slice(0, 5).forEach(flare => {
		rows += `<tr>
			<td>${formatTime(flare.beginTime)}</td>
			<td>${flare.classType || "N/A"}</td>
			<td>${flare.sourceLocation || "N/A"}</td>
		</tr>`;
	});
	
	flaresTable.innerHTML = rows;
}


function updateCME(cmes) {
	const cmeTable = document.getElementById("cme-table");
	if (!cmes || cmes.length === 0) {
		cmeTable.innerHTML = `<tr>
			<td colspan="3">${translations["no_cme"] || "No recent CMEs"}</td>
		</tr>`;
    return;
	}
	
	let rows = "";

  cmes.slice(0, 5).forEach((cme) => {
		const speed = cme.cmeAnalyses && cme.cmeAnalyses[0] ? cme.cmeAnalyses[0].speed : "N/A";
    const type = cme.cmeAnalyses && cme.cmeAnalyses[0] ? cme.cmeAnalyses[0].type || "N/A" : "N/A";
		
    rows += `<tr>
			<td>${formatTime(cme.startTime)}</td>
			<td>${speed}</td>
			<td>${type}</td>
		</tr>`;
  });

  cmeTable.innerHTML = rows;
}


function updateKpIndex(kpData) {
	const kpValue = document.getElementById("kp-value");
	const kpStatus = document.getElementById("kp-status");
	if (!kpData || kpData.length === 0) {
		kpValue.textContent = "--";
  	kpStatus.textContent = translations["no_data"] || "No data";;
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
	
	auroraObsTime.textContent = `${translations["observed"] || "Observed:"}` + formatTime(aurora.observation_time);
	auroraForecastTime.textContent = `${translations["forecast"] || "Forecast:"}` + formatTime(aurora.forecast_time);
	
	let maxIntensity = 0;
	aurora.coordinates.forEach(coord => {
		if (coord[2] > maxIntensity) {
			maxIntensity = coord[2];
		}
	});
	
	if (maxIntensity > 50) {
		auroraIntensity.textContent = `${translations["high"] || "High:"} (${maxIntensity})`;
		auroraIntensity.style.color = "#ff4444";
	} else if (maxIntensity > 25) {
		auroraIntensity.textContent = `${translations["moderate"] || "Moderate:"} (${maxIntensity})`;
		auroraIntensity.style.color = "#ffaa00";
	} else {
		auroraIntensity.textContent = `${translations["low"] || "Low:"} (${maxIntensity})`;
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


function updateAsteroids(asteroids) {
	const table = document.getElementById("asteroids-table");
	
	if (!asteroids || asteroids.length === 0) {
		table.innerHTML = `<tr><td colspan="4">${translations["no_asteroids"] || "No asteroids data"}</td></tr>`;
		return;
	}
	
	let rows = "";
	asteroids.forEach(function(ast) {
		const diameter = `${Math.round(ast.diameter_min)} - ${Math.round(ast.diameter_max)} m`;
		const distance = Number(ast.distance_km).toLocaleString("en-US", {maximumFractionDigits: 0}) + " km";
		const hazardous = ast.is_hazardous
      ? '<span style="color:#ff4444">⚠️ Yes</span>'
      : '<span style="color:#44ff44">No</span>';
		
		rows += `<tr>
			<td>${ast.name}</td>
			<td>${diameter}</td>
			<td>${distance}</td>
			<td>${hazardous}</td>
		</tr>`;
	});
	
	table.innerHTML = rows;
}


function updateRadiation(data) {
	let radiationStatus = document.getElementById("radiation-status");
	if (!data || data.length === 0) {
		radiationStatus.textContent = translations["no_data"] || "No data";
		return;
	}
	
	const latest = data[data.length - 1];
	
	let status = "";

  if (latest.flux < 1000) {
		status = translations["radiation_normal"] || "Normal";
    radiationStatus.style.color = "#44ff44";
  } else if (latest.flux < 10000) {
    status = translations["radiation_elevated"] || "Elevated";
    radiationStatus.style.color = "#ffaa00";
  } else {
    status = translations["radiation_high"] || "High";
    radiationStatus.style.color = "#ff4444";
  }
	
	radiationStatus.textContent = `Flux: ${latest.flux.toLocaleString()} - ${status}`;

  if (radiationChart) {
    radiationChart.data.labels = data.map((d) => formatTime(d.time_tag));
    radiationChart.data.datasets[0].data = data.map((d) => d.flux);
    radiationChart.update();
  }
}


function updateSolarWind(solarWind, bzData) {
	const info = document.getElementById("solar-wind-info");
	const bzInfo = document.getElementById("bz-info");
	
	if (solarWind && solarWind.speed) {
		info.innerHTML = `${translations["speed"] || "Speed"}: ${solarWind.speed} km/s
			<br>${translations["density"] || "Density"}: ${solarWind.density} p/cc
			<br>${translations["temp"] || "Temp"}: ${Number(solarWind.temperature).toLocaleString()} K`;
	} else {
		info.textContent = translations["no_data"] || "No data";
	}
	
	if (bzData && bzData.bz !== undefined) {
		if (bzData.bz < 0) {
			bzInfo.innerHTML = `Bz: ${bzData.bz} nT ✅ (${translations["aurora_likely"] || "Aurora likely"})`;
      bzInfo.style.color = "#44ff44";
		} else {
			bzInfo.innerHTML = `Bz: ${bzData.bz} nT ❌ (${translations["aurora_unlikely"] || "Aurora unlikely"})`;
      bzInfo.style.color = "#ff4444";
		}
	} else {
		bzInfo.textContent = "";
	}
}


function updateSunImage() {
	const img = document.getElementById("sun-image");
	img.src = "https://soho.nascom.nasa.gov/data/realtime/eit_304/1024/latest.jpg";
	img.onerror = function() {
		img.src = "";
	};
}

function changeSunWavelength(wave) {
	document.getElementById("sun-image").src =
    `https://soho.nascom.nasa.gov/data/realtime/${wave}/1024/latest.jpg`;
	document.getElementById("sun-wavelength").textContent =
    `SOHO ${wave.replace("_", " ").toUpperCase()}`;
	
	document.querySelectorAll(".sun-btn").forEach(btn => btn.classList.remove("active"));
	event.target.classList.add("active");
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
	
	let html = `<strong>${translations["no_data"] || "No upcoming passes"}</strong><ul>`;
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


async function loadTranslations(lang) {
	try {
		const response = await fetch(`/static/locales/${lang}.json`);
		translations = await response.json();
		applyTranslations();
	} catch (error) {
		console.error("Failed to load translations:", error);
	}
}


function applyTranslations() {
	document.querySelectorAll("[data-i18n]").forEach(el => {
		const key = el.getAttribute("data-i18n");
		if (translations[key]) {
			el.textContent = translations[key];
		}
	});
}


function toggleLanguage() {
	currentLang = currentLang === "en" ? "ru" : "en";
	localStorage.setItem("lang", currentLang);
	document.getElementById("lang-btn").textContent = currentLang === "en" ? "🇷🇺 RU" : "🇬🇧 EN";
	loadTranslations(currentLang).then(function() {
		fetch("/api/data")
			.then(function(res) { return res.json(); })
			.then(function(data) { updateDashboard(data); });
	});
}

document.getElementById("lang-btn").addEventListener("click", toggleLanguage)


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
	document.getElementById("connection-status").innerHTML = translations["live"] || "🟢 Live";
	
	initKpChart();
	initKpHistoryChart();
	initRadiationChart();
	updateSunImage();
	loadKpHistory();
	loadTranslations(currentLang);
	
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
	document.getElementById("connection-status").innerHTML = translations["offline"] || "🔴 Offline";
}

socket.onerror = function () {
	document.getElementById("connection-status").innerHTML = translations["error"] || "🔴 Error";
}
