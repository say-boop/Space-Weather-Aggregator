from datetime import datetime
import httpx

from app.config import API_URLS, NASA_API_KEY, logger


async def get_asteroids():
	now_date = datetime.now().strftime("%Y-%m-%d")
	params = {
		"api_key": NASA_API_KEY,
		"start_date": now_date,
		"end_date": now_date
	}
	try:
		async with httpx.AsyncClient() as client:
			response = await client.get(API_URLS["asteroids"], params=params)
			if response.status_code == 200:
				data = response.json()["near_earth_objects"]

				asteroids_today = [ast for ast in data[now_date]]

				result = []

				for item in asteroids_today:
					result.append({
						"name": item["name"],
						"diameter_min": item["estimated_diameter"]["meters"]["estimated_diameter_min"],
						"diameter_max": item["estimated_diameter"]["meters"]["estimated_diameter_max"],
						"distance_km": float(item["close_approach_data"][0]["miss_distance"]["kilometers"]),
						"is_hazardous": item["is_potentially_hazardous_asteroid"],
						"velocity_kmh": float(item["close_approach_data"][0]["relative_velocity"]["kilometers_per_hour"])
					})

				sort_distance = result.sort(key=lambda x: x["distance_km"])

				return result[:10]
	except Exception as e:
		logger.error(f"Asteroids error: {e}")
		return []
