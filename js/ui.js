import { weatherCodes } from "./weatherCodes.js";

const forecastContainer = document.querySelector("#forecast-grid");
const favoritesContainer = document.querySelector("#favorites-list");
const cityResults = document.querySelector("#city-results");
const unitToggle = document.querySelector("#unit-toggle");
const weatherCard = document.querySelector("#weather-card");
const weatherSkeleton = weatherCard.querySelector(".weather-skeleton");
const unitStorageKey = "solstice-temperature-unit";
let temperatureUnit = "C";
let lastWeather;

function getForecastDay(dateString, index) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function getWeatherCode(code) {
  return weatherCodes[code] ?? { label: "Unknown conditions", emoji: "🌡️" };
}

function formatTemperature(celsius) {
  const temperature = temperatureUnit === "F" ? (celsius * 9) / 5 + 32 : celsius;
  return `${Math.round(temperature)}°`;
}

function updateUnitToggle() {
  unitToggle.querySelectorAll("button[data-unit]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.unit === temperatureUnit));
  });
}

function renderForecast(daily) {
  forecastContainer.replaceChildren(
    ...daily.time.map((date, index) => {
      const high = formatTemperature(daily.temperature_2m_max[index]);
      const low = formatTemperature(daily.temperature_2m_min[index]);
      const condition = getWeatherCode(daily.weather_code[index]);
      const dayName = getForecastDay(date, index);
      const card = document.createElement("article");
      card.className = "forecast-card";
      card.setAttribute("aria-label", `${dayName}, ${condition.label}, high ${high}, low ${low}`);

      const day = document.createElement("span");
      day.className = "forecast-day";
      day.textContent = dayName;

      const weatherIcon = document.createElement("span");
      weatherIcon.className = "forecast-icon";
      weatherIcon.setAttribute("aria-hidden", "true");
      weatherIcon.textContent = condition.emoji;

      const temperatures = document.createElement("span");
      temperatures.className = "forecast-temperatures";
      const highTemperature = document.createElement("span");
      highTemperature.textContent = high;
      const lowTemperature = document.createElement("span");
      lowTemperature.className = "forecast-low";
      lowTemperature.textContent = low;
      temperatures.append(highTemperature, lowTemperature);

      card.append(day, weatherIcon, temperatures);
      return card;
    }),
  );
}

function renderCurrentWeather(city, forecast) {
  const current = forecast.current;
  const currentCondition = getWeatherCode(current.weather_code);

  document.querySelector("#city-name").textContent = city.name;
  document.querySelector("#country-name").textContent = [city.region, city.country].filter(Boolean).join(", ");
  document.querySelector("#temperature").textContent = formatTemperature(current.temperature_2m);
  document.querySelector("#condition").textContent = currentCondition.label;
  document.querySelector("#condition-icon").textContent = currentCondition.emoji;
  document.querySelector("#wind-speed").textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  document.querySelector("#humidity").textContent = `${current.relative_humidity_2m}%`;
}

export function renderWeather(city, forecast) {
  lastWeather = { city, forecast };
  renderCurrentWeather(city, forecast);
  renderForecast(forecast.daily);
}

export function setLoading(isLoading) {
  const forecastIsSkeleton = Boolean(forecastContainer.querySelector(".forecast-skeleton"));
  weatherCard.setAttribute("aria-busy", String(isLoading));
  weatherSkeleton.hidden = !isLoading;
  forecastContainer.setAttribute("aria-busy", String(isLoading));
  if (isLoading) {
    forecastContainer.replaceChildren(
      ...Array.from({ length: 7 }, () => {
        const card = document.createElement("article");
        card.className = "forecast-card forecast-skeleton";
        card.setAttribute("aria-hidden", "true");

        for (const className of ["skeleton-forecast-day", "skeleton-forecast-icon", "skeleton-forecast-temperature"]) {
          const placeholder = document.createElement("span");
          placeholder.className = `skeleton-forecast-line ${className}`;
          card.append(placeholder);
        }

        return card;
      }),
    );
    return;
  }

  if (!forecastIsSkeleton) return;

  if (lastWeather) {
    renderForecast(lastWeather.forecast.daily);
  } else {
    forecastContainer.replaceChildren();
  }
}

export function getTemperatureUnit() {
  try {
    const storedUnit = localStorage.getItem(unitStorageKey);
    if (storedUnit === "C" || storedUnit === "F") temperatureUnit = storedUnit;
  } catch (error) {
    console.warn("Could not read the saved temperature unit.", error);
  }
  updateUnitToggle();
  return temperatureUnit;
}

export function setTemperatureUnit(unit) {
  if (unit !== "C" && unit !== "F") return;
  temperatureUnit = unit;
  updateUnitToggle();

  try {
    localStorage.setItem(unitStorageKey, unit);
  } catch (error) {
    console.warn("Could not save the temperature unit.", error);
  }

  if (lastWeather) {
    renderCurrentWeather(lastWeather.city, lastWeather.forecast);
    renderForecast(lastWeather.forecast.daily);
  }
}

export function renderCityChoices(cities) {
  cityResults.replaceChildren(
    ...cities.map((city, index) => {
      const button = document.createElement("button");
      button.className = "city-result";
      button.type = "button";
      button.dataset.cityIndex = String(index);
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", "false");

      const name = document.createElement("span");
      name.className = "city-result-name";
      name.textContent = city.name;

      const location = document.createElement("span");
      location.className = "city-result-location";
      location.textContent = [city.region, city.country].filter(Boolean).join(", ");

      button.append(name, location);
      return button;
    }),
  );
  cityResults.hidden = cities.length === 0;
}

export function hideCityChoices() {
  cityResults.replaceChildren();
  cityResults.hidden = true;
}

export function renderFavorites(favorites, activeCity) {
  document.querySelector("#favorites-empty").hidden = favorites.length > 0;
  favoritesContainer.replaceChildren(
    ...favorites.map((favorite, index) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.className = "favorite-button";
      button.type = "button";
      button.dataset.favoriteIndex = String(index);
      button.setAttribute("aria-current", String(
        favorite.latitude === activeCity?.latitude && favorite.longitude === activeCity?.longitude,
      ));

      const icon = document.createElement("span");
      icon.className = "favorite-weather-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "⌖";

      const details = document.createElement("span");
      const city = document.createElement("span");
      city.className = "favorite-city";
      city.textContent = favorite.name;
      const country = document.createElement("span");
      country.className = "favorite-country";
      country.textContent = favorite.country || "Saved location";
      details.append(city, country);

      const arrow = document.createElement("span");
      arrow.className = "favorite-temperature";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "›";

      button.append(icon, details, arrow);
      item.append(button);
      return item;
    }),
  );
}

export function setFavoriteButton(isFavorite, cityName = "current city") {
  const button = document.querySelector("#favorite-toggle");
  button.textContent = isFavorite ? "★" : "☆";
  button.setAttribute("aria-pressed", String(isFavorite));
  button.setAttribute(
    "aria-label",
    `${isFavorite ? "Remove" : "Add"} ${cityName} ${isFavorite ? "from" : "to"} favourites`,
  );
  button.disabled = !lastWeather;
}

export function renderLocalTime(timezone) {
  const timeElement = document.querySelector("#local-time");
  timeElement.textContent = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date());
  timeElement.dataset.timezone = timezone;
}

export function setStatus(message = "", isError = false) {
  const status = document.querySelector("#status-message");
  const error = document.querySelector("#error-message");

  status.classList.toggle(
    "loading-status",
    !isError && (message.startsWith("Loading") || message.startsWith("Finding")),
  );
  status.textContent = isError ? "" : message;
  error.textContent = isError ? message : "";
}
