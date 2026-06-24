import httpx

from app.config import API_URLS, logger


async def get_solar_wind():
	try:
		async with httpx.AsyncClient() as client:
			response = await client.get(API_URLS["solar_wind"])
			if response.status_code == 200:
				data = response.json()

				latest = data[-1]

				return {
					"time": latest[0],
					"density": float(latest[1]),
					"speed": float(latest[2]),
					"temperature": float(latest[3])
				}
	except Exception as e:
		logger.error(f"Solar wind error: {e}")
	return {}


async def get_bz():
	try:
		async with httpx.AsyncClient() as client:
			response = await client.get(API_URLS["bz"])
			if response.status_code == 200:
				data = response.json()
				latest = data[-1]

				return {
					"time": latest[0],
					"bx": float(latest[1]),
					"by": float(latest[2]),
					"bz": float(latest[3]),
					"bt": float(latest[6]),
				}
	except Exception as e:
		logger.error(f"Bz error: {e}")
	return {}
