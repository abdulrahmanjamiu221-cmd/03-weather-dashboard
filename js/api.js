const cities = [
  {
    city: "Oslo",
    country: "Norway",
    temperature: 8,
    condition: "Partly cloudy",
    icon: "🌤️",
    wind: 12,
    timezone: "Europe/Oslo",
    forecast: [
      [10, 4, "🌤️"],
      [9, 3, "☁️"],
      [11, 5, "🌦️"],
      [12, 6, "☀️"],
      [10, 4, "🌤️"],
      [8, 2, "🌧️"],
      [9, 3, "☁️"],
    ],
  },
  {
    city: "Copenhagen",
    country: "Denmark",
    temperature: 11,
    condition: "Bright skies",
    icon: "☀️",
    wind: 9,
    timezone: "Europe/Copenhagen",
    forecast: [
      [13, 7, "☀️"],
      [12, 8, "🌤️"],
      [11, 6, "☁️"],
      [14, 8, "☀️"],
      [13, 7, "🌤️"],
      [10, 5, "🌦️"],
      [12, 6, "☀️"],
    ],
  },
  {
    city: "Lisbon",
    country: "Portugal",
    temperature: 19,
    condition: "Mostly sunny",
    icon: "🌤️",
    wind: 14,
    timezone: "Europe/Lisbon",
    forecast: [
      [21, 14, "☀️"],
      [20, 13, "🌤️"],
      [19, 13, "☀️"],
      [18, 12, "☁️"],
      [20, 14, "☀️"],
      [22, 15, "🌤️"],
      [21, 14, "☀️"],
    ],
  },
  {
    city: "Tokyo",
    country: "Japan",
    temperature: 16,
    condition: "Soft sunshine",
    icon: "🌤️",
    wind: 7,
    timezone: "Asia/Tokyo",
    forecast: [
      [18, 11, "🌤️"],
      [17, 12, "🌧️"],
      [16, 10, "☁️"],
      [19, 12, "☀️"],
      [20, 13, "🌤️"],
      [18, 12, "☀️"],
      [17, 11, "🌦️"],
    ],
  },
  {
    city: "London",
    country: "United Kingdom",
    temperature: 13,
    condition: "Light showers",
    icon: "🌦️",
    wind: 18,
    timezone: "Europe/London",
    forecast: [
      [14, 9, "🌦️"],
      [13, 8, "☁️"],
      [15, 9, "🌤️"],
      [14, 8, "🌧️"],
      [16, 10, "☀️"],
      [15, 9, "🌤️"],
      [13, 7, "☁️"],
    ],
  },
];

const cityIndex = new Map(
  cities.map((weather) => [weather.city.toLocaleLowerCase(), weather]),
);

export const favoriteCities = ["Copenhagen", "Lisbon", "Tokyo"];

export async function getWeather(cityName) {
  const normalizedCity = cityName.trim().toLocaleLowerCase();
  const weather = cityIndex.get(normalizedCity);

  if (!weather) {
    throw new Error(`No demo forecast is available for "${cityName.trim()}". Try Oslo, Copenhagen, Lisbon, Tokyo, or London.`);
  }

  return weather;
}
