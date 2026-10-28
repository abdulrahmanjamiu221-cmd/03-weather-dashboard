import { getForecast, searchCity } from "./api.js";
import {
  getTemperatureUnit,
  hideCityChoices,
  renderCityChoices,
  renderFavorites,
  renderLocalTime,
  renderWeather,
  setFavoriteButton,
  setLoading,
  setStatus,
  setTemperatureUnit,
} from "./ui.js";

const searchForm = document.querySelector("#city-search");
const cityInput = document.querySelector("#city-input");
const cityResults = document.querySelector("#city-results");
const favoritesKey = "solstice-favorites";
const lastViewedKey = "solstice-last-viewed";
const geolocationErrors = {
  permissionDenied: 1,
  positionUnavailable: 2,
  timeout: 3,
};
let favorites = [];
let activeController;
let activeRequestId = 0;
let matchingCities = [];
let activeCity;

function isValidSavedCity(city) {
  return city
    && typeof city.name === "string"
    && typeof city.country === "string"
    && Number.isFinite(city.latitude)
    && Number.isFinite(city.longitude);
}

function readSavedCity(key) {
  try {
    const savedValue = localStorage.getItem(key);
    if (!savedValue) return null;

    const city = JSON.parse(savedValue);
    return isValidSavedCity(city) ? city : null;
  } catch (error) {
    console.warn(`Could not read saved weather data (${key}).`, error);
    return null;
  }
}

function loadFavorites() {
  try {
    const savedValue = localStorage.getItem(favoritesKey);
    if (!savedValue) return [];

    const savedFavorites = JSON.parse(savedValue);
    if (!Array.isArray(savedFavorites)) throw new Error("Saved favourites must be an array.");

    return savedFavorites
      .filter(isValidSavedCity)
      .map(({ name, country, latitude, longitude }) => ({ name, country, latitude, longitude }));
  } catch (error) {
    console.warn("Could not read saved favourites.", error);
    return [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    setStatus("");
    return true;
  } catch (error) {
    setStatus("Your browser couldn't save favourites. They will be available until this page is closed.", true);
    console.error("Could not save favourites.", error);
    return false;
  }
}

function isFavorite(city) {
  return favorites.some(
    (favorite) => favorite.latitude === city.latitude && favorite.longitude === city.longitude,
  );
}

function startRequest() {
  activeController?.abort();
  activeController = new AbortController();
  activeRequestId += 1;
  return { controller: activeController, requestId: activeRequestId };
}

function isCurrentRequest(requestId) {
  return requestId === activeRequestId;
}

async function loadCityForecast(city, request = startRequest()) {
  const { controller, requestId } = request;
  hideCityChoices();
  setLoading(true);
  setStatus("Loading weather…");

  try {
    const forecast = await getForecast(city.latitude, city.longitude, { signal: controller.signal });
    if (!isCurrentRequest(requestId)) return false;

    const savedCity = {
      name: city.name,
      country: city.country || "",
      latitude: city.latitude,
      longitude: city.longitude,
    };
    activeCity = savedCity;
    renderWeather(savedCity, forecast);
    renderFavorites(favorites, activeCity);
    setFavoriteButton(isFavorite(activeCity), activeCity.name);
    renderLocalTime(forecast.timezone || city.timezone || "UTC");
    setLoading(false);

    try {
      localStorage.setItem(lastViewedKey, JSON.stringify(savedCity));
    } catch (error) {
      console.warn("Could not save the last viewed city.", error);
    }

    setStatus("");
    return true;
  } catch (error) {
    if (error.name === "AbortError" || !isCurrentRequest(requestId)) return false;
    setLoading(false);
    setStatus(error instanceof Error ? error.message : "Something went wrong while loading the weather.", true);
    return false;
  }
}

async function searchForCity(cityName) {
  const query = cityName.trim();
  if (!query) return false;

  const request = startRequest();
  hideCityChoices();
  matchingCities = [];
  setLoading(true);
  setStatus("Loading weather…");

  try {
    const cities = await searchCity(query, { signal: request.controller.signal });
    if (!isCurrentRequest(request.requestId)) return false;

    if (cities.length === 0) {
      setLoading(false);
      setStatus(`We couldn't find "${query}". Check the spelling and try another city.`);
      return false;
    }

    if (cities.length > 1) {
      setLoading(false);
      matchingCities = cities;
      renderCityChoices(cities);
      setStatus("Choose a location to see its forecast.");
      return false;
    }

    return await loadCityForecast(cities[0], request);
  } catch (error) {
    if (error.name === "AbortError" || !isCurrentRequest(request.requestId)) return false;
    setLoading(false);
    setStatus(error instanceof Error ? error.message : "Something went wrong while searching for that city.", true);
    return false;
  }
}

function getCurrentPosition() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("Your browser does not support location access. Search for a city instead."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      if (error.code === geolocationErrors.permissionDenied) {
        reject(new Error("Location permission was denied. Allow location access in your browser settings, or search for a city."));
      } else if (error.code === geolocationErrors.positionUnavailable) {
        reject(new Error("Your location is unavailable right now. Check your device settings, or search for a city."));
      } else if (error.code === geolocationErrors.timeout) {
        reject(new Error("Location lookup timed out. Please try again or search for a city."));
      } else {
        reject(new Error(`Unable to get your location: ${error.message}`));
      }
    }, {
      enableHighAccuracy: false,
      timeout: 12_000,
      maximumAge: 300_000,
    });
  });
}

async function showMyLocation() {
  const request = startRequest();
  hideCityChoices();
  setLoading(true);
  setStatus("Finding your location…");

  try {
    const position = await getCurrentPosition();
    if (!isCurrentRequest(request.requestId)) return false;

    return await loadCityForecast({
      name: "Your location",
      country: "",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }, request);
  } catch (error) {
    if (!isCurrentRequest(request.requestId)) return false;
    setLoading(false);
    setStatus(error instanceof Error ? error.message : "Unable to get your location.", true);
    return false;
  }
}

async function showInitialCity() {
  const savedCity = readSavedCity(lastViewedKey);
  if (savedCity) {
    await loadCityForecast(savedCity);
    return;
  }

  const request = startRequest();
  setLoading(true);
  setStatus("Finding your location…");

  try {
    const position = await getCurrentPosition();
    if (!isCurrentRequest(request.requestId)) return;

    await loadCityForecast({
      name: "Your location",
      country: "",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }, request);
  } catch (locationError) {
    if (!isCurrentRequest(request.requestId)) return;
    setLoading(false);

    try {
      const cities = await searchCity("Oslo", { signal: request.controller.signal });
      if (!isCurrentRequest(request.requestId)) return;
      if (cities.length === 0) throw new Error("Could not find a default city to show.");

      const didLoad = await loadCityForecast(cities[0], request);
      if (didLoad && locationError instanceof Error) {
        setStatus(`${locationError.message} Showing Oslo instead.`, true);
      }
    } catch (error) {
      if (error.name === "AbortError" || !isCurrentRequest(request.requestId)) return;
      setLoading(false);
      setStatus(error instanceof Error ? error.message : "Could not load a starting forecast.", true);
    }
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await searchForCity(cityInput.value);
  } catch (error) {
    setLoading(false);
    setStatus(error instanceof Error ? error.message : "Something went wrong while loading the weather.", true);
  }
});

cityResults.addEventListener("click", async (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-city-index]");
  if (!button) return;

  const city = matchingCities[Number(button.dataset.cityIndex)];
  if (!city) return;

  try {
    const request = startRequest();
    await loadCityForecast(city, request);
  } catch (error) {
    setLoading(false);
    setStatus(error instanceof Error ? error.message : "Something went wrong while loading the weather.", true);
  }
});

document.querySelector("#favorites-list").addEventListener("click", async (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-favorite-index]");
  if (!button) return;

  const city = favorites[Number(button.dataset.favoriteIndex)];
  if (!city) return;

  try {
    await loadCityForecast(city);
  } catch (error) {
    setLoading(false);
    setStatus(error instanceof Error ? error.message : "Something went wrong while loading the weather.", true);
  }
});

document.querySelector("#favorite-toggle").addEventListener("click", () => {
  if (!activeCity) return;

  if (isFavorite(activeCity)) {
    favorites = favorites.filter(
      (favorite) => favorite.latitude !== activeCity.latitude || favorite.longitude !== activeCity.longitude,
    );
  } else {
    favorites = [
      ...favorites,
      {
        name: activeCity.name,
        country: activeCity.country,
        latitude: activeCity.latitude,
        longitude: activeCity.longitude,
      },
    ];
  }

  saveFavorites();
  renderFavorites(favorites, activeCity);
  setFavoriteButton(isFavorite(activeCity), activeCity.name);
});

document.querySelector("#location-button").addEventListener("click", async () => {
  try {
    await showMyLocation();
  } catch (error) {
    setLoading(false);
    setStatus(error instanceof Error ? error.message : "Unable to get your location.", true);
  }
});

document.querySelector("#unit-toggle").addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-unit]");
  if (button) setTemperatureUnit(button.dataset.unit);
});

getTemperatureUnit();
favorites = loadFavorites();
renderFavorites(favorites, activeCity);

window.setInterval(() => {
  const timezone = document.querySelector("#local-time").dataset.timezone;
  if (timezone) renderLocalTime(timezone);
}, 60_000);

try {
  await showInitialCity();
} catch (error) {
  setLoading(false);
  setStatus(error instanceof Error ? error.message : "Something went wrong while loading the weather.", true);
}
