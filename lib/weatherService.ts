/**
 * Weather Service
 * Fetches real weather data from Open-Meteo API
 * 100% FREE - No API key required
 * https://open-meteo.com/
 */

export interface WeatherData {
  temp: number;
  feelsLike: number;
  high: number;
  low: number;
  condition: string;
  icon: string;
  hourly: {
    time: string;
    temp: number;
    icon: string;
  }[];
  airQuality: {
    status: string;
    aqi: number;
  };
}

// Map WMO weather codes to conditions and Ionicons
const weatherCodeMap: { [key: number]: { condition: string; icon: string } } = {
  0: { condition: 'Clear', icon: 'sunny' },
  1: { condition: 'Mostly Clear', icon: 'sunny' },
  2: { condition: 'Partly Cloudy', icon: 'partly-sunny' },
  3: { condition: 'Overcast', icon: 'cloudy' },
  45: { condition: 'Foggy', icon: 'cloudy' },
  48: { condition: 'Foggy', icon: 'cloudy' },
  51: { condition: 'Light Drizzle', icon: 'rainy' },
  53: { condition: 'Drizzle', icon: 'rainy' },
  55: { condition: 'Heavy Drizzle', icon: 'rainy' },
  56: { condition: 'Freezing Drizzle', icon: 'rainy' },
  57: { condition: 'Freezing Drizzle', icon: 'rainy' },
  61: { condition: 'Light Rain', icon: 'rainy' },
  63: { condition: 'Rain', icon: 'rainy' },
  65: { condition: 'Heavy Rain', icon: 'rainy' },
  66: { condition: 'Freezing Rain', icon: 'rainy' },
  67: { condition: 'Freezing Rain', icon: 'rainy' },
  71: { condition: 'Light Snow', icon: 'snow' },
  73: { condition: 'Snow', icon: 'snow' },
  75: { condition: 'Heavy Snow', icon: 'snow' },
  77: { condition: 'Snow Grains', icon: 'snow' },
  80: { condition: 'Light Showers', icon: 'rainy' },
  81: { condition: 'Showers', icon: 'rainy' },
  82: { condition: 'Heavy Showers', icon: 'rainy' },
  85: { condition: 'Snow Showers', icon: 'snow' },
  86: { condition: 'Heavy Snow Showers', icon: 'snow' },
  95: { condition: 'Thunderstorm', icon: 'thunderstorm' },
  96: { condition: 'Thunderstorm', icon: 'thunderstorm' },
  99: { condition: 'Thunderstorm', icon: 'thunderstorm' },
};

// Map US AQI values to status
const getAqiStatus = (aqi: number): string => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

// Format hour from ISO string
const formatHour = (isoString: string, index: number): string => {
  if (index === 0) return 'Now';
  const date = new Date(isoString);
  const hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}${ampm}`;
};

// Get icon for time of day
const getIconForCode = (code: number, hour: number): string => {
  const weather = weatherCodeMap[code] || { condition: 'Clear', icon: 'sunny' };
  // Use night icons for nighttime (before 6am or after 8pm)
  if ((hour < 6 || hour >= 20) && weather.icon === 'sunny') {
    return 'moon';
  }
  if ((hour < 6 || hour >= 20) && weather.icon === 'partly-sunny') {
    return 'cloudy-night';
  }
  return weather.icon;
};

/**
 * Fetch weather data for a given location
 * Uses Open-Meteo API - completely free, no API key needed
 */
export const fetchWeatherData = async (
  latitude: number,
  longitude: number
): Promise<WeatherData | null> => {
  try {
    // Fetch weather and air quality in parallel
    const [weatherRes, aqiRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`
      ),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi`
      ),
    ]);

    if (!weatherRes.ok) {
      console.error('Weather API error:', weatherRes.status);
      return null;
    }

    const weather = await weatherRes.json();
    const airQuality = aqiRes.ok ? await aqiRes.json() : null;

    // Get current hour index for hourly data
    const currentHour = new Date().getHours();
    
    // Extract hourly forecast (next 4 hours)
    const hourlyData = weather.hourly;
    const hourly = [];
    for (let i = 0; i < 4 && currentHour + i < 24; i++) {
      const hourIndex = currentHour + i;
      hourly.push({
        time: formatHour(hourlyData.time[hourIndex], i),
        temp: Math.round(hourlyData.temperature_2m[hourIndex]),
        icon: getIconForCode(hourlyData.weather_code[hourIndex], hourIndex),
      });
    }

    // Get current weather info
    const currentWeather = weather.current;
    const weatherInfo = weatherCodeMap[currentWeather.weather_code] || { condition: 'Clear', icon: 'sunny' };
    
    // Get AQI
    const aqi = airQuality?.current?.us_aqi || 0;

    return {
      temp: Math.round(currentWeather.temperature_2m),
      feelsLike: Math.round(currentWeather.apparent_temperature),
      high: Math.round(weather.daily.temperature_2m_max[0]),
      low: Math.round(weather.daily.temperature_2m_min[0]),
      condition: weatherInfo.condition,
      icon: getIconForCode(currentWeather.weather_code, currentHour),
      hourly,
      airQuality: {
        status: getAqiStatus(aqi),
        aqi,
      },
    };
  } catch (error) {
    // Network errors are expected when offline - return null silently
    // The caller will use getDefaultWeatherData() as fallback
    return null;
  }
};

/**
 * Get default/fallback weather data
 */
export const getDefaultWeatherData = (): WeatherData => ({
  temp: 72,
  feelsLike: 70,
  high: 78,
  low: 65,
  condition: 'Sunny',
  icon: 'sunny',
  hourly: [
    { time: 'Now', temp: 72, icon: 'sunny' },
    { time: '11AM', temp: 74, icon: 'sunny' },
    { time: '12PM', temp: 76, icon: 'partly-sunny' },
    { time: '1PM', temp: 78, icon: 'partly-sunny' },
  ],
  airQuality: { status: 'Good', aqi: 32 },
});
