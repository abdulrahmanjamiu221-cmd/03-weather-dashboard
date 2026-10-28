import { weatherCodes } from "./weatherCodes.js";

const forecastContainer = document.querySelector("#forecast-grid");
const favoritesContainer = document.querySelector("#favorites-list");

function getForecastDay(dateString, index) {
  if (index === 0) return "Today";
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(year, month - 1, day));
}

function getWeatherCode(code) {
  return weatherCodes[code] ?? { label: "Unknown conditions", emoji: "🌡️" };
}

export function renderWeather(city, forecast) {
  const current = forecast.current;
  const currentCondition = getWeatherCode(current.weather_code);
  const daily = forecast.daily;

  document.querySelector("#city-name").textContent = city.name;
  document.querySelector("#country-name").textContent = city.country || "";
  document.querySelector("#temperature").textContent = `${Math.round(current.temperature_2m)}°`;
  document.querySelector("#condition").textContent = currentCondition.label;
  document.querySelector("#condition-icon").textContent = currentCondition.emoji;
  document.querySelector("#wind-speed").textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  document.querySelector("#humidity").textContent = `${current.relative_humidity_2m}%`;

  forecastContainer.replaceChildren(
    ...daily.time.map((date, index) => {
      const high = Math.round(daily.temperature_2m_max[index]);
      const low = Math.round(daily.temperature_2m_min[index]);
      const condition = getWeatherCode(daily.weather_code[index]);
      const dayName = getForecastDay(date, index);
      const card = document.createElement("article");
      card.className = "forecast-card";
      card.setAttribute("aria-label", `${dayName}, ${condition.label}, high ${high} degrees, low ${low} degrees`);

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
      highTemperature.textContent = `${high}°`;
      const lowTemperature = document.createElement("span");
      lowTemperature.className = "forecast-low";
      lowTemperature.textContent = `${low}°`;
      temperatures.append(highTemperature, lowTemperature);

      card.append(day, weatherIcon, temperatures);
      return card;
    }),
  );
}

export function renderFavorites(favorites, activeCity) {
  favoritesContainer.replaceChildren(
    ...favorites.map((cityName) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.className = "favorite-button";
      button.type = "button";
      button.dataset.city = cityName;
      button.setAttribute("aria-current", String(cityName.toLocaleLowerCase() === activeCity.toLocaleLowerCase()));

      const icon = document.createElement("span");
      icon.className = "favorite-weather-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "⌖";

      const details = document.createElement("span");
      const city = document.createElement("span");
      city.className = "favorite-city";
      city.textContent = cityName;
      const country = document.createElement("span");
      country.className = "favorite-country";
      country.textContent = "View forecast";
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

  status.textContent = isError ? "" : message;
  error.textContent = isError ? message : "";
}
