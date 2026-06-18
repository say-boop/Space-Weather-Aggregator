from datetime import datetime, timedelta
import httpx

from app.config import API_URLS, NASA_API_KEY

def get_params():
	end_date = datetime.now().strftime("%Y-%m-%d")
	start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
	params = {
		"api_key": NASA_API_KEY,
		"startDate": start_date,
		"endDate": end_date
	}

	return params


async def get_solar_flares():
	end_date = datetime.now().strftime("%Y-%m-%d")
	start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
	params = {
		"api_key": NASA_API_KEY,
		"startDate": start_date,
		"endDate": end_date
	}
	
	try:
		async with httpx.AsyncClient() as client:
			response = await client.get(API_URLS["flares"], params=get_params())
			if response.status_code == 200:
				data = response.json()
				return data[:10]
	except Exception:
		pass

	return []


async def get_cme():
	try:
		async with httpx.AsyncClient() as client:
			response = await client.get(API_URLS["cme"], params=get_params())
			if response.status_code == 200:
				data = response.json()
				return data[:10]
	except Exception:
		pass

	return []
