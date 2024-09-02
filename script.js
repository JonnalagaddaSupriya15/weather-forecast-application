// Select DOM elements
const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");

// API key for OpenWeatherMap API
const API_KEY = "3c30386ce306b1ca115ac7368b77572e"; 

// Function to map weather descriptions to custom images
const getWeatherImage = (description) => {
    description = description.toLowerCase();
    if (description.includes("clear")) return "sunnyyy.png";  // Sunny weather
    if (description.includes("clouds")) return "cloudy.png";  // Cloudy weather
    if (description.includes("rain")) return "rainy.png";  // Rainy weather
    if (description.includes("snow")) return "snowyyy.png";  // Snowy weather
    if (description.includes("thunderstorm")) return "thunderbolt.jpg";  // Thunderstorm
    if (description.includes("drizzle")) return "dizzle.jpg";  // Drizzle
    if (description.includes("mist") || description.includes("fog")) return "foggy.png";  // Misty or foggy weather
    return "images/default.png";  // Fallback image for unspecified weather
}

// Function to create the HTML for the weather card
const createWeatherCard = (cityName, weatherItem, index) => {
    const weatherDescription = weatherItem.weather[0].description; // Weather description from API
    const customImage = getWeatherImage(weatherDescription); // Get the custom image based on description

    if(index === 0) { // HTML for the main weather card (current weather)
        return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h6>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </div>
                <div class="icon">
                    <img src="${customImage}" alt="weather-icon">
                    <h6>${weatherDescription}</h6>
                </div>`;
    } else { // HTML for the 5-day forecast cards
        return `<li class="card">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="${customImage}" alt="weather-icon">
                    <h6>${weatherDescription}</h6>
                    <h6>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                </li>`;
    }
}

// Function to update the dropdown with recent cities from localStorage
function updateDropdown() {
    const dropdown = document.getElementById('recent-cities-dropdown');
    const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

    // Clear existing options
    dropdown.innerHTML = '<option value="" disabled selected>Select a recent city</option>';

    // Add new options from recent cities
    recentCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        dropdown.appendChild(option);
    });

    // Show dropdown if there are cities available
    dropdown.style.display = recentCities.length > 0 ? 'block' : 'none';
}

// Event listener for dropdown selection
document.getElementById('recent-cities-dropdown').addEventListener('change', function() {
    const selectedCity = this.value;
    if (selectedCity) {
        // Fetch and display the weather data for the selected city
    }
});

// Initial load of the dropdown with recent cities
updateDropdown();

// Function to fetch weather details based on city coordinates
const getWeatherDetails = (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL)
    .then(response => response.json())
    .then(data => {
        // Filter the forecasts to get only one forecast per day
        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                return uniqueForecastDays.push(forecastDate);
            }
        });

        // Clear previous weather data
        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";

        // Creating weather cards and adding them to the DOM
        fiveDaysForecast.forEach((weatherItem, index) => {
            const html = createWeatherCard(cityName, weatherItem, index);
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", html); // Main weather card
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", html); // 5-day forecast cards
            }
        });        
    })
    .catch(() => {
        alert("An error occurred while fetching the weather forecast!"); // Error handling
    });
}

// Function to get city coordinates based on user input
const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (cityName === "") return; // Exit if input is empty
    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    
    // Fetch coordinates (latitude, longitude) of the entered city
    fetch(API_URL)
    .then(response => response.json())
    .then(data => {
        if (!data.length) return alert(`No coordinates found for ${cityName}`); // Handle no results
        const { lat, lon, name } = data[0];
        getWeatherDetails(name, lat, lon); // Fetch weather details using coordinates
    })
    .catch(() => {
        alert("An error occurred while fetching the coordinates!"); // Error handling
    });
}

// Function to get user coordinates via geolocation
const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords; // Get coordinates of user location
            // Get city name from coordinates using reverse geocoding API
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            fetch(API_URL)
            .then(response => response.json())
            .then(data => {
                const { name } = data[0];
                getWeatherDetails(name, latitude, longitude); // Fetch weather details using user's location
            })
            .catch(() => {
                alert("An error occurred while fetching the city name!"); // Error handling
            });
        },
        error => { // Handle errors for geolocation
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access again.");
            } else {
                alert("Geolocation request error. Please reset location permission.");
            }
        });
}

// Event listeners for buttons and input field
locationButton.addEventListener("click", getUserCoordinates); // Fetch weather using user's location
searchButton.addEventListener("click", getCityCoordinates); // Fetch weather using entered city name
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates()); // Fetch weather when "Enter" key is pressed
