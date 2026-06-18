from dotenv import load_dotenv
from pathlib import Path
import os


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
