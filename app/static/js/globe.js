const globe = Globe()
  .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
  .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
  .atmosphereColor("#0A84FF")
  .atmosphereAltitude(0.15)
  .pointsData([])
  .pointColor((d) => d.color || "#ff4444")
  .pointRadius((d) => d.size || 0.3)
  .pointLabel((d) => d.label || "")(document.getElementById("globe-container"))
	.ringsData([])
	.ringColor(() => "#44ff44")
	.ringMaxRadius(1)
	.ringPropagationSpeed(0.5)
	.ringRepeatPeriod(2000);

let issPath = [];

async function loadData() {
  try {
    const response = await fetch("/api/data");
    const data = await response.json();

    const kp =
      data.kp_index && data.kp_index.length > 0
        ? data.kp_index[data.kp_index.length - 1].kp
        : "N/A";

    if (data.iss) {
      globe.pointsData([
        {
          lat: data.iss.latitude,
          lng: data.iss.longitude,
          size: 0.5,
          label: "ISS",
        },
      ]);
    }

    const info = document.getElementById("globe-info");
    if (data.iss) {
      issPath.push({
        lat: data.iss.latitude,
        lng: data.iss.longitude,
      });
      if (issPath.length > 100) issPath.shift();

      globe.pointsData(issPath.map((p) => ({ ...p, size: 0.1, label: "" })));

      globe.pointsData([
        ...issPath
          .slice(0, -1)
          .map((p) => ({ ...p, size: 0.05, color: "#ffff00" })),
        {
          lat: data.iss.latitude,
          lng: data.iss.longitude,
          size: 0.5,
          label: "ISS",
          color: "#ff4444",
        },
      ]);
    }

    if (data.aurora && data.aurora.coordinates) {
      const rings = [];

      data.aurora.coordinates.forEach((coord) => {
        if (coord[2] > 10) {
          rings.push({
            lat: coord[1],
            lng: coord[0],
            marR: coord[2] / 50,
            propagationSpeed: 1,
            repeatPeriod: 1000,
          });
        }
      });

      globe
        .ringsData(rings.slice(0, 500))
        .ringColor(() => "#44ff44")
        .ringMaxRadius(0.5)
        .ringPropagationSpeed(1)
        .ringRepeatPeriod(1000);
    }

    if (data.asteroids && data.asteroids.length > 0) {
      const asteroidPoints = data.asteroids.slice(0, 10).map((ast) => {
        const randomOffset = () => (Math.random() - 0.5) * 30;
        return {
          lat: data.iss ? data.iss.latitude + randomOffset() : randomOffset(),
          lng: data.iss ? data.iss.longitude + randomOffset() : randomOffset(),
          size: Math.max(0.1, ast.diameter_max / 500),
          color: ast.is_hazardous ? "#ff4444" : "#ffaa00",
          label: `${ast.name}\n${Math.round(ast.distance_km).toLocaleString()} km`,
        };
      });

      const currentPoints = globe.pointsData();
      globe.pointsData([...currentPoints, ...asteroidPoints]);
    }

    const issText = data.iss
      ? `<span style="color:#ff4444;">${data.iss.latitude.toFixed(2)}°, ${data.iss.longitude.toFixed(2)}°</span>`
      : '<span style="color:#888;">No data</span>';

    const asteroidCount = data.asteroids ? data.asteroids.length : 0;

    info.innerHTML = `
    	🛰️ ISS: ${issText}<br>
    	🧲 Kp: <span style="color:#44ff44;">${kp}</span><br>
    	☄️ Asteroids: <span style="color:#ffaa00;">${asteroidCount}</span><br>
    	🌌 Aurora: <span style="color:#44ff44;">Active</span>
		`;
  } catch (error) {
    console.error("Globe load error:", error);
  }
}

loadData();
setInterval(loadData, 30000);
