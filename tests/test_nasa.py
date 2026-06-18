import pytest

from app.api.nasa import get_solar_flares, get_cme


@pytest.mark.asyncio
async def test_get_solar_flares():
	flares = await get_solar_flares()

	assert isinstance(flares, list)

	if flares:
		flare = flares[0]
		assert "time" in flare
		assert "class" in flare
		assert "source" in flare


@pytest.mark.asyncio
async def test_get_cme():
	cmes = await get_cme()

	assert isinstance(cmes, list)

	if cmes:
		cme = cmes[0]
		assert "time" in cme
		assert "speed" in cme
