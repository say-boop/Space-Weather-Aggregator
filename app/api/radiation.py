import httpx

from app.config import API_URLS, logger


async def get_radiation():
	try:
		async with httpx.AsyncClient() as client:
			response = await client.get(API_URLS["radiation"])
			if response.status_code == 200:
				data = response.json()
				return data[-60:]
	except Exception as e:
		logger.error(f"Radiation error: {e}")
	return []
