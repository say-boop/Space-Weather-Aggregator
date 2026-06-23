from datetime import datetime
import asyncio

from app.config import logger
from app.config import API_URLS, CACHE_FILE
from app.api.iss import get_iss_position
from app.api.nasa import get_solar_flares, get_cme
from app.api.noaa import get_kp_index, get_aurora
from app.services.cache import load_data, save_data, save_kp_history


async def collect_all_data():
	try:
		iss, flares, cme, kp, aurora = await asyncio.gather(
			get_iss_position(),
			get_solar_flares(),
			get_cme(),
			get_kp_index(),
			get_aurora(),
		)
	except Exception as e:
		logger.error(f"Collection error: {e}")
		return load_data()

	save_kp_history(kp)

	return {
		"iss": iss,
		"flares": flares,
		"cme": cme,
		"kp_index": kp,
		"aurora": aurora,
		"updated_at": datetime.now().isoformat()
	}
