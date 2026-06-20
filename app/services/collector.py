from datetime import datetime
import asyncio
import os
import json

from app.config import API_URLS, CACHE_FILE
from app.api.iss import get_iss_position
from app.api.nasa import get_solar_flares, get_cme
from app.api.noaa import get_kp_index, get_aurora


async def collect_all_data():
	iss, flares, cme, kp, aurora = await asyncio.gather(
		get_iss_position(),
		get_solar_flares(),
		get_cme(),
		get_kp_index(),
		get_aurora()
	)

	return {
		"iss": iss,
		"flares": flares,
		"cme": cme,
		"kp_index": kp,
		"aurora": aurora,
		"updated_at": datetime.now().isoformat()
	}


def save_cache(data: dict):
	os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
	with open(CACHE_FILE, "w", encoding="utf-8") as file:
		json.dump(data, file, ensure_ascii=False, indent=2)


def load_cache() -> dict:
	if not os.path.exists(CACHE_FILE):
		return {}

	try:
		with open(CACHE_FILE, "r", encoding="utf-8") as file:
			return json.load(file)
	except (json.JSONDecodeError, FileNotFoundError):
		return {}
