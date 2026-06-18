import pytest

from app.api.iss import get_iss_position


@pytest.mark.asyncio
async def test_get_iss_position():
	result = await get_iss_position()

	assert result is not None
	assert "latitude" in result
	assert "longitude" in result
	assert "timestamp" in result
	assert -90 <= result["latitude"] <= 90
	assert -180 <= result["longitude"] <= 180
