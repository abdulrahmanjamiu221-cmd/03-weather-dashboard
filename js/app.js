import { favoriteCities, getWeather } from "./api.js";
import { renderFavorites, renderLocalTime, renderWeather, setStatus } from "./ui.js";

const searchForm = document.querySelector("#city-search");
const cityInput = document.querySelector("#city-input");
let activeCity = "Oslo";

async function showCity(cityName) {
  setStatus("Finding your forecast...");

  try {
    const weather = await getWeather(cityName);
    const favorites = await Promise.all(favoriteCities.map((city) => getWeather(city)));

    renderWeather(weather);
    renderFavorites(favorites, weather.city);
    renderLocalTime(weather.timezone);
    activeCity = weather.city;
    setStatus("");
    return true;
  } catch (error) {
    setStatus(error.message, true);
    return false;
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const didLoad = await showCity(cityInput.value);
  if (didLoad) {
    cityInput.value = "";
  }
});

document.querySelector("#favorites-list").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-city]");
  if (!button) return;

  await showCity(button.dataset.city);
});

window.setInterval(() => {
  getWeather(activeCity)
    .then((weather) => renderLocalTime(weather.timezone))
    .catch((error) => console.error("Unable to refresh the local time.", error));
}, 60_000);

await showCity(activeCity);
