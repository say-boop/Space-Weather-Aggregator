import asyncio

from app.config import UPDATE_INTERVAL, logger
from app.services.collector import collect_all_data, save_cache


async def background_collector():
	while True:
		try:
			data = await collect_all_data()
			save_cache(data)
			logger.info(f"Data collected at {data['updated_at']}")
		except Exception as e:
			logger.error(f"Collection error: {e}")

		await asyncio.sleep(UPDATE_INTERVAL)


def start_background_tasks():
	asyncio.create_task(background_collector())
	
