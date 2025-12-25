import { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets, MapPin, RefreshCw } from 'lucide-react';
import WidgetCard from './WidgetCard';
import Button from './Button';

interface WeatherData {
  temperature: number;
  humidity: number;
  conditions: string;
  location: string;
  weatherCode: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
}

// Default location (London, UK)
const DEFAULT_LOCATION: LocationData = {
  latitude: 51.5074,
  longitude: -0.1278,
  name: 'London, UK',
};

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData>(DEFAULT_LOCATION);
  const [usingGeolocation, setUsingGeolocation] = useState(false);

  const fetchWeatherForLocation = useCallback(async (loc: LocationData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`
      );
      const data = await response.json();

      const weatherCode = data.current.weather_code;
      const conditions = getWeatherCondition(weatherCode);

      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        conditions,
        location: loc.name,
        weatherCode,
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Unable to fetch weather data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if we have a saved location preference
    const savedLocation = localStorage.getItem('weatherLocation');
    if (savedLocation) {
      const loc = JSON.parse(savedLocation) as LocationData;
      setLocation(loc);
      setUsingGeolocation(loc.name === 'Current Location');
      fetchWeatherForLocation(loc);
    } else {
      // Use default location
      fetchWeatherForLocation(DEFAULT_LOCATION);
    }
  }, [fetchWeatherForLocation]);

  const requestGeolocation = async () => {
    try {
      setLoading(true);
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const loc: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        name: 'Current Location',
      };

      setLocation(loc);
      setUsingGeolocation(true);
      localStorage.setItem('weatherLocation', JSON.stringify(loc));
      await fetchWeatherForLocation(loc);
    } catch (err) {
      console.error('Geolocation error:', err);
      setError('Location access denied. Using default location.');
      setLoading(false);
      // Fall back to default
      setTimeout(() => {
        setError(null);
        fetchWeatherForLocation(DEFAULT_LOCATION);
      }, 2000);
    }
  };

  const resetToDefault = () => {
    setLocation(DEFAULT_LOCATION);
    setUsingGeolocation(false);
    localStorage.removeItem('weatherLocation');
    fetchWeatherForLocation(DEFAULT_LOCATION);
  };

  const getWeatherCondition = (code: number): string => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 49) return 'Foggy';
    if (code <= 69) return 'Rainy';
    if (code <= 79) return 'Snowy';
    if (code <= 99) return 'Stormy';
    return 'Unknown';
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-16 h-16 text-yellow-300" />;
    if (code <= 3) return <Cloud className="w-16 h-16 text-gray-300" />;
    if (code <= 69) return <CloudRain className="w-16 h-16 text-blue-300" />;
    if (code <= 79) return <CloudSnow className="w-16 h-16 text-blue-200" />;
    return <Wind className="w-16 h-16 text-gray-400" />;
  };

  const getGradientByWeather = (code: number): string => {
    if (code === 0) return 'from-yellow-400 via-orange-400 to-pink-400';
    if (code <= 3) return 'from-blue-400 via-cyan-400 to-teal-400';
    if (code <= 69) return 'from-gray-500 via-blue-500 to-blue-600';
    if (code <= 79) return 'from-blue-300 via-purple-300 to-pink-300';
    return 'from-gray-600 via-gray-700 to-gray-800';
  };

  if (loading) {
    return (
      <WidgetCard title="Weather" fullWidth>
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse-slow text-white/60">Loading weather...</div>
        </div>
      </WidgetCard>
    );
  }

  if (error && !weather) {
    return (
      <WidgetCard title="Weather" fullWidth>
        <div className="flex flex-col items-center justify-center h-40 gap-4">
          <div className="text-red-300">{error}</div>
          <Button onClick={() => fetchWeatherForLocation(DEFAULT_LOCATION)} size="sm">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </WidgetCard>
    );
  }

  if (!weather) return null;

  return (
    <WidgetCard title="Weather" fullWidth>
      <div className={`bg-gradient-to-r ${getGradientByWeather(weather.weatherCode)} rounded-xl p-8 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="animate-pulse-slow">
              {getWeatherIcon(weather.weatherCode)}
            </div>
            <div>
              <div className="text-6xl font-bold text-white mb-2">
                {weather.temperature}°C
              </div>
              <div className="text-xl text-white/90 font-medium">
                {weather.conditions}
              </div>
              <div className="text-sm text-white/70 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {weather.location}
              </div>
            </div>
          </div>
          <div className="text-right space-y-3">
            <div className="flex items-center gap-2 text-white/90">
              <Droplets className="w-5 h-5" />
              <span className="text-lg">{weather.humidity}%</span>
            </div>
            <div className="text-sm text-white/70">Humidity</div>
            <div className="flex gap-2 mt-4">
              {!usingGeolocation && (
                <button
                  onClick={requestGeolocation}
                  className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                  title="Use my location"
                >
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Use My Location
                </button>
              )}
              {usingGeolocation && (
                <button
                  onClick={resetToDefault}
                  className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                  title="Reset to default"
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => fetchWeatherForLocation(location)}
                className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                title="Refresh weather"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
};

export default WeatherWidget;
