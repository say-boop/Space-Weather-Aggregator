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
