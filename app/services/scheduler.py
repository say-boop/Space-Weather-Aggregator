import asyncio

from app.config import UPDATE_INTERVAL, logger
from app.services.collector import collect_all_data
from app.services.cache import save_data


async def background_collector():
	while True:
		try:
			data = await collect_all_data()
			save_data(data)
			logger.info(f"Data collected at {data['updated_at']}")
		except Exception as e:
			logger.error(f"Collection error: {e}")

		await asyncio.sleep(UPDATE_INTERVAL)


def start_background_tasks():
	asyncio.create_task(background_collector())
	
