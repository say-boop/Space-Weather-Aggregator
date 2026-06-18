import pytest

from app.api.noaa import get_kp_index, get_aurora


@pytest.mark.asyncio
async def test_get_kp_index():
	kp_data = await get_kp_index()

	assert isinstance(kp_data, list)

	if kp_data:
		item = kp_data[0]
		assert "time" in item
		assert "kp" in item
		assert "status" in item


@pytest.mark.asyncio
async def test_get_aurora():
	aurora = await get_aurora()

	if aurora:
		assert "observation_time" in aurora
		assert "coordinates" in aurora
