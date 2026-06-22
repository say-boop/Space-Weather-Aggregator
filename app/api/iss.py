import httpx

from app.config import API_URLS



async def get_iss_position():
	try:
		async with httpx.AsyncClient() as client:
			response = await client.get(API_URLS["iss"])
			if response.status_code == 200:
				data = response.json()

				return {
					"latitude": float(data["iss_position"]["latitude"]),
					"longitude": float(data["iss_position"]["longitude"]),
					"timestamp": data["timestamp"]
				}
	except Exception:
		pass

	return None

async def get_iss_passes(lat, lon):
	try:
		async with httpx.AsyncClient() as client:
			response = await client.get(
				API_URLS["iss_pass"], 
				params={"lat": lat, "lon": lon}
			)
			if response.status_code == 200:
				data = response.json()
				passes = data.get("response", [])
				
				result = []
				for p in passes[:5]:
					result.append({
						"rise_time": p["risetime"],
						"duration_seconds": p["duration"]
					})
				return result
	except Exception:
		pass

	return []
