from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from datetime import datetime
import asyncio
import os
import json

from app.config import logger
from app.services.scheduler import start_background_tasks
from app.services.collector import load_cache, collect_all_data, save_cache
from app.api.iss import get_iss_passes


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
	asyncio.create_task(do_refresh())
	return {
		"status": "ok",
		"message": "Refresh started"
	}

async def do_refresh():
	try:
		data = await collect_all_data()
		save_cache(data)
		logger.info("Refresh completed")
	except Exception as e:
		logger.error(f"Refresh error: {e}")


@app.get("/api/iss/passes")
async def iss_passes(lat: float, lon: float):
	passes = await get_iss_passes(lat, lon)
	return {
		"passes": passes,
		"lat": lat,
		"lon": lon
	}


@app.get("/api/kp/history")
def kp_history():
	history_file = "data/kp_history.json"
	if os.path.exists(history_file):
		with open(history_file, "r") as f:
			return json.load(f)

	return []


@app.get("/api/export")
def export_report():
	data = load_cache()
	now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

	html = f"""<!DOCTYPE html>
	<html>
	<head>
    	<meta charset="utf-8">
    	<title>Space Weather Report - {now}</title>
    	<style>
    	    body {{ font-family: Arial, sans-serif; margin: 40px; background: #1a1a2e; color: #eee; }}
    	    h1 {{ color: #0A84FF; }}
    	    table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
    	    th, td {{ border: 1px solid #333; padding: 8px; text-align: left; }}
    	    th {{ background: #0A84FF; color: white; }}
    	    .card {{ background: #16213e; padding: 20px; border-radius: 12px; margin: 20px 0; }}
    	</style>
	</head>
	<body>
	    <h1>🛰️ Space Weather Report</h1>
	    <p>Generated: {now}</p>
	
	    <div class="card">
	       <h2>☀️ Solar Flares</h2>
	        <p>{len(data.get('flares', []))} flares in last 7 days</p>
	    </div>
    
	    <div class="card">
	        <h2>🧲 Kp Index</h2>
	        <p>Latest: {data.get('kp_index', [{}])[-1].get('kp', 'N/A') if data.get('kp_index') else 'N/A'}</p>
	        <p>Status: {data.get('kp_index', [{}])[-1].get('status', 'N/A') if data.get('kp_index') else 'N/A'}</p>
	    </div>
    
	    <div class="card">
	        <h2>🛰️ ISS Position</h2>
	        <p>Lat: {data.get('iss', {}).get('latitude', 'N/A') if data.get('iss') else 'N/A'}</p>
	        <p>Lon: {data.get('iss', {}).get('longitude', 'N/A') if data.get('iss') else 'N/A'}</p>
	    </div>
    
 	   <div class="card">
	        <h2>🌌 Aurora</h2>
	        <p>Observation: {data.get('aurora', {}).get('observation_time', 'N/A') if data.get('aurora') else 'N/A'}</p>
	        <p>Forecast: {data.get('aurora', {}).get('forecast_time', 'N/A') if data.get('aurora') else 'N/A'}</p>
	    </div>
	</body>
	</html>"""

	return HTMLResponse(
		content=html,
		headers={
			"Content-Disposition": f"attachment; filename=space_weather_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
		}
	)


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
