# Solstice Weather Dashboard

A responsive weather dashboard built with plain HTML, CSS, and JavaScript ES modules.

## Features

- Current conditions and a seven-day forecast
- City search with a location picker when there are multiple matches
- Saved favourites and last-viewed city, stored in `localStorage`
- Optional current-location lookup using the browser's Geolocation API
- Celsius/Fahrenheit toggle with a remembered preference
- Responsive glassmorphism-inspired interface with loading skeletons
- Accessible status messages and keyboard-operable controls

## API

Weather and city search data come from [Open-Meteo](https://open-meteo.com/), which does not require an API key:

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast: `https://api.open-meteo.com/v1/forecast`

Location access uses `navigator.geolocation` and requires permission. Browsers generally require a secure context (HTTPS or localhost) for geolocation.

## Run locally

Serve this folder with a local web server (for example, VS Code Live Server) and open `index.html`. Using a local server is recommended for ES modules and geolocation support.

## Screenshot

![Solstice dashboard screenshot](./screenshots/dashboard.png)

Replace the placeholder above with a screenshot saved at `screenshots/dashboard.png`.

## What I learned

- How to sequence geocoding and forecast requests with `async`/`await`
- How to handle ambiguous search results and cancel stale requests with `AbortController`
- How to render API data safely with DOM methods and `textContent`
- How to persist preferences and favourites in `localStorage`
- How to use browser geolocation and format forecast dates with `Intl.DateTimeFormat`
