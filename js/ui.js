const forecastContainer = document.querySelector("#forecast-grid");
const favoritesContainer = document.querySelector("#favorites-list");

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });

function getForecastDay(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return offset === 0 ? "Today" : weekdayFormatter.format(date);
}

export function renderWeather(weather) {
  document.querySelector("#city-name").textContent = weather.city;
  document.querySelector("#country-name").textContent = weather.country;
  document.querySelector("#temperature").textContent = `${weather.temperature}°`;
  document.querySelector("#condition").textContent = weather.condition;
  document.querySelector("#condition-icon").textContent = weather.icon;
  document.querySelector("#wind-speed").textContent = `${weather.wind} km/h`;

  forecastContainer.replaceChildren(
    ...weather.forecast.map(([high, low, icon], index) => {
      const card = document.createElement("article");
      card.className = "forecast-card";
      card.setAttribute("aria-label", `${getForecastDay(index)}, high ${high} degrees, low ${low} degrees`);

      const day = document.createElement("span");
      day.className = "forecast-day";
      day.textContent = getForecastDay(index);

      const weatherIcon = document.createElement("span");
      weatherIcon.className = "forecast-icon";
      weatherIcon.setAttribute("aria-hidden", "true");
      weatherIcon.textContent = icon;

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
    ...favorites.map((weather) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.className = "favorite-button";
      button.type = "button";
      button.dataset.city = weather.city;
      button.setAttribute("aria-current", String(weather.city === activeCity));

      const icon = document.createElement("span");
      icon.className = "favorite-weather-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = weather.icon;

      const details = document.createElement("span");
      const city = document.createElement("span");
      city.className = "favorite-city";
      city.textContent = weather.city;
      const country = document.createElement("span");
      country.className = "favorite-country";
      country.textContent = weather.country;
      details.append(city, country);

      const temperature = document.createElement("span");
      temperature.className = "favorite-temperature";
      temperature.textContent = `${weather.temperature}°`;

      button.append(icon, details, temperature);
      item.append(button);
      return item;
    }),
  );
}

export function renderLocalTime(timezone) {
  document.querySelector("#local-time").textContent = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date());
}

export function setStatus(message = "", isError = false) {
  const status = document.querySelector("#status-message");
  const error = document.querySelector("#error-message");

  status.textContent = isError ? "" : message;
  error.textContent = isError ? message : "";
}
