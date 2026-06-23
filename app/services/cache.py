import json
import redis

from app.config import REDIS_URL


def get_redis():
	return redis.Redis.from_url(REDIS_URL, decode_responses=True)


def save_data(data):
	r = get_redis()
	r.set("space_weather:data", json.dumps(data, ensure_ascii=False))


def load_data():
	r = get_redis()
	raw = r.get("space_weather:data")
	if raw:
		return json.loads(raw)
	return {}


def save_kp_history(kp_data):
	if not kp_data:
		return

	r = get_redis()
	latest = kp_data[-1]
	r.lpush("space_weather:kp_history", json.dumps(latest))
	r.ltrim("space_weather:kp_history", 0, 719)


def load_kp_history():
	r = get_redis()
	items = r.lrange("space_weather:kp_history", 0, -1)
	return [json.loads(item) for item in items]
