/**
 * Weather Service
 * Fetches real weather data from OpenWeatherMap API
 */

// OpenWeatherMap API - Free tier: 1000 calls/day
const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';

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

// Map OpenWeatherMap icon codes to Ionicons names
const iconMap: { [key: string]: string } = {
  '01d': 'sunny',
  '01n': 'moon',
  '02d': 'partly-sunny',
  '02n': 'cloudy-night',
  '03d': 'cloud',
  '03n': 'cloud',
  '04d': 'cloudy',
  '04n': 'cloudy',
  '09d': 'rainy',
  '09n': 'rainy',
  '10d': 'rainy',
  '10n': 'rainy',
  '11d': 'thunderstorm',
  '11n': 'thunderstorm',
  '13d': 'snow',
  '13n': 'snow',
  '50d': 'cloudy',
  '50n': 'cloudy',
};

// Map AQI values to status
const getAqiStatus = (aqi: number): string => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

// Format hour from timestamp
const formatHour = (timestamp: number, index: number): string => {
  if (index === 0) return 'Now';
  const date = new Date(timestamp * 1000);
  const hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}${ampm}`;
};

/**
 * Fetch weather data for a given location
 */
export const fetchWeatherData = async (
  latitude: number,
  longitude: number
): Promise<WeatherData | null> => {
  try {
    if (!OPENWEATHER_API_KEY) {
      console.warn('OpenWeatherMap API key not configured');
      return null;
    }

    // Fetch current weather and forecast in parallel
    const [currentRes, forecastRes, airQualityRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${OPENWEATHER_API_KEY}`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=imperial&cnt=8&appid=${OPENWEATHER_API_KEY}`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}`
      ),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      console.error('Weather API error:', currentRes.status, forecastRes.status);
      return null;
    }

    const current = await currentRes.json();
    const forecast = await forecastRes.json();
    const airQuality = airQualityRes.ok ? await airQualityRes.json() : null;

    // Extract hourly forecast (every 3 hours from OpenWeatherMap free tier)
    const hourly = forecast.list.slice(0, 4).map((item: any, index: number) => ({
      time: formatHour(item.dt, index),
      temp: Math.round(item.main.temp),
      icon: iconMap[item.weather[0].icon] || 'partly-sunny',
    }));

    // Calculate AQI (OpenWeatherMap uses 1-5 scale, convert to US AQI approximation)
    let aqi = 0;
    if (airQuality?.list?.[0]?.main?.aqi) {
      const owmAqi = airQuality.list[0].main.aqi;
      // Approximate conversion: OWM 1-5 to US AQI 0-500
      const aqiMap: { [key: number]: number } = { 1: 25, 2: 75, 3: 125, 4: 175, 5: 300 };
      aqi = aqiMap[owmAqi] || 50;
    }

    return {
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      high: Math.round(current.main.temp_max),
      low: Math.round(current.main.temp_min),
      condition: current.weather[0].main,
      icon: iconMap[current.weather[0].icon] || 'partly-sunny',
      hourly,
      airQuality: {
        status: getAqiStatus(aqi),
        aqi,
      },
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
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
