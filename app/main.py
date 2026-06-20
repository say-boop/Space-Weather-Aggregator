from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import asyncio

from app.config import logger
from app.services.scheduler import start_background_tasks
from app.services.collector import load_cache, collect_all_data, save_cache


app = FastAPI()


@app.on_event("startup")
async def startup():
	logger.info("Starting Space Weather Aggregator...")
	start_background_tasks()
	logger.info("Background tasks started")


app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")


@app.get("/")
def root(request: Request):
	return templates.TemplateResponse(
		request=request,
		name="index.html"
		)


@app.get("/api/data")
def get_data():
	return load_cache()


@app.post("/api/refresh")
async def refresh_data():
	try:
		data = await collect_all_data()
		save_cache(data)
		return data
	except Exception as e:
		logger.error(f"Refresh error: {e}")
		return {"error": str(e)}


@app.websocket("/ws/data")
async def websocket_data(websocket: WebSocket):
	await websocket.accept()
	logger.info("WebSocket connected")
	try:
		while True:
			data = load_cache()
			await websocket.send_json(data)
			await asyncio.sleep(30)
	except WebSocketDisconnect:
		logger.info("WebSocket disconnected")
