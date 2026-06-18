import httpx

from app.config import API_URLS


async def get_kp_index():
	try:
		async with httpx.AsyncClient() as client:
			response = await client.get(API_URLS["kp_index"])
			if response.status_code == 200:
				data = response.json()
				result = []

				for item in data[-60:]:
					try:
						kp = float(item.get("kp", 0))
					except (ValueError, TypeError):
						kp = 0.0
					if kp < 4:
						status = "Quiet"
					elif kp < 5:
						status = "Active"
					elif kp < 6:
						status = "Minor Storm"
					elif kp < 7:
						status = "Moderate Storm"
					elif kp < 8:
						status = "Strong Storm"
					elif kp < 9:
						status = "Severe Storm"
					else:
						status = "Extreme Storm"

					result.append({
						"time": item.get("time_tag", ""),
						"kp": kp,
						"status": status
					})

				return result
	except Exception as e:
		print("KP Index Error:", e)
	return None


async def get_aurora():
	try:
		async with httpx.AsyncClient() as client:
			response = await client.get(API_URLS["aurora"])
			if response.status_code == 200:
				data = response.json()
				return {
					"observation_time": data.get("Observation Time", ""),
					"forecast_time": data.get("Forecast Time", ""),
					"coordinates": data.get("coordinates", [])
				}
	except Exception:
		pass

	return None
