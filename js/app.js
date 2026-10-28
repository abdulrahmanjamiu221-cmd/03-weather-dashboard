import { getForecast, searchCity } from "./api.js";
import {
  getTemperatureUnit,
  hideCityChoices,
  renderCityChoices,
  renderFavorites,
  renderLocalTime,
  renderWeather,
  setStatus,
  setTemperatureUnit,
} from "./ui.js";

const searchForm = document.querySelector("#city-search");
const cityInput = document.querySelector("#city-input");
const cityResults = document.querySelector("#city-results");
const favoriteCities = ["Copenhagen", "Lisbon", "Tokyo"];
let activeController;
let activeRequestId = 0;
let matchingCities = [];

function startRequest() {
  activeController?.abort();
  activeController = new AbortController();
  activeRequestId += 1;
  return { controller: activeController, requestId: activeRequestId };
}

function isCurrentRequest(requestId) {
  return requestId === activeRequestId;
}

async function loadCityForecast(city, requestId, signal) {
  setStatus("Loading…");
  try {
    const forecast = await getForecast(city.latitude, city.longitude, { signal });
    if (!isCurrentRequest(requestId)) return false;

    renderWeather(city, forecast);
    renderFavorites(favoriteCities, city.name);
    renderLocalTime(forecast.timezone || city.timezone);
    hideCityChoices();
    cityInput.value = "";
    setStatus("");
    return true;
  } catch (error) {
    if (error.name === "AbortError" || !isCurrentRequest(requestId)) return false;
    setStatus(error instanceof Error ? error.message : "Something went wrong while loading the weather.", true);
    return false;
  }
}

async function searchForCity(cityName) {
  const query = cityName.trim();
  if (!query) return false;

  const { controller, requestId } = startRequest();
  hideCityChoices();
  matchingCities = [];
  setStatus("Loading…");

  try {
    const cities = await searchCity(query, { signal: controller.signal });
    if (!isCurrentRequest(requestId)) return false;
    if (cities.length === 0) {
      setStatus(`We couldn't find "${query}". Check the spelling and try another city.`);
      return false;
    }

    if (cities.length > 1) {
      matchingCities = cities;
      renderCityChoices(cities);
      setStatus("Choose a location to see its forecast.");
      return false;
    }

    return await loadCityForecast(cities[0], requestId, controller.signal);
  } catch (error) {
    if (error.name === "AbortError" || !isCurrentRequest(requestId)) return false;
    setStatus(error instanceof Error ? error.message : "Something went wrong while searching for that city.", true);
    return false;
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await searchForCity(cityInput.value);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Something went wrong while loading the weather.", true);
  }
});

cityResults.addEventListener("click", async (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-city-index]");
  if (!button) return;

  const city = matchingCities[Number(button.dataset.cityIndex)];
  if (!city || !activeController) return;

  try {
    await loadCityForecast(city, activeRequestId, activeController.signal);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Something went wrong while loading the weather.", true);
  }
});

document.querySelector("#favorites-list").addEventListener("click", async (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-city]");
  if (!button) return;

  try {
    await searchForCity(button.dataset.city);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Something went wrong while loading the weather.", true);
  }
});

document.querySelector("#unit-toggle").addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-unit]");
  if (button) setTemperatureUnit(button.dataset.unit);
});

getTemperatureUnit();

window.setInterval(() => {
  const timezone = document.querySelector("#local-time").dataset.timezone;
  if (timezone) renderLocalTime(timezone);
}, 60_000);

try {
  await searchForCity("Oslo");
} catch (error) {
  setStatus(error instanceof Error ? error.message : "Something went wrong while loading the weather.", true);
}
