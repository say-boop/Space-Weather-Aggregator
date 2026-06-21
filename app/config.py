from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import sys


env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)


NASA_API_KEY = os.getenv("NASA_API_KEY", "")


API_URLS = {
  "flares": "https://api.nasa.gov/DONKI/FLR",
  "cme": "https://api.nasa.gov/DONKI/CME",
  "kp_index": "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json",
	"aurora": "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json",
  "iss": "http://api.open-notify.org/iss-now.json",
}

CACHE_FILE = "data/cache.json"

UPDATE_INTERVAL = 300


def setup_logging():
	logger = logging.getLogger("space_weather")
	logger.setLevel(logging.INFO)

	formatter = logging.Formatter(
		"[%(asctime)s] %(levelname)s - %(message)s",
		datefmt="%Y-%m-%d %H:%M:%S"
	)

	console_handler = logging.StreamHandler(sys.stdout)
	console_handler.setFormatter(formatter)
	logger.addHandler(console_handler)

	file_handler = logging.FileHandler("data/app.log", encoding="utf-8")
	file_handler.setFormatter(formatter)
	logger.addHandler(file_handler)

	return logger

logger = setup_logging()
