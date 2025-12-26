import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    const savedLocation = localStorage.getItem('weatherLocation');
    if (savedLocation) {
      const loc = JSON.parse(savedLocation) as LocationData;
      setLocation(loc);
      setUsingGeolocation(loc.name === 'Current Location');
      fetchWeatherForLocation(loc);
    } else {
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
          maximumAge: 300000,
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
    const iconClass = "w-12 h-12";
    if (code === 0) return <Sun className={`${iconClass} text-amber-400`} />;
    if (code <= 3) return <Cloud className={`${iconClass} text-white/60`} />;
    if (code <= 69) return <CloudRain className={`${iconClass} text-teal-400`} />;
    if (code <= 79) return <CloudSnow className={`${iconClass} text-blue-300`} />;
    return <Wind className={`${iconClass} text-white/40`} />;
  };

  const getWeatherGradient = (code: number): string => {
    if (code === 0) return 'from-amber-500/20 via-amber-400/10 to-transparent';
    if (code <= 3) return 'from-white/10 via-white/5 to-transparent';
    if (code <= 69) return 'from-teal-500/20 via-teal-400/10 to-transparent';
    if (code <= 79) return 'from-blue-400/20 via-blue-300/10 to-transparent';
    return 'from-white/5 via-transparent to-transparent';
  };

  if (loading) {
    return (
      <WidgetCard title="Weather" fullWidth delay={0}>
        <div className="flex items-center justify-center h-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className="w-6 h-6 text-amber-400/60" />
          </motion.div>
        </div>
      </WidgetCard>
    );
  }

  if (error && !weather) {
    return (
      <WidgetCard title="Weather" fullWidth delay={0}>
        <div className="flex flex-col items-center justify-center h-32 gap-4">
          <p className="text-red-400 text-sm">{error}</p>
          <Button onClick={() => fetchWeatherForLocation(DEFAULT_LOCATION)} size="sm" variant="secondary">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </WidgetCard>
    );
  }

  if (!weather) return null;

  return (
    <WidgetCard title="Weather" fullWidth delay={0}>
      <div className="relative overflow-hidden rounded-xl bg-noir-800/50 border border-white/[0.04]">
        {/* Ambient gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getWeatherGradient(weather.weatherCode)}`} />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Weather Icon with animation */}
              <motion.div
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative"
              >
                {getWeatherIcon(weather.weatherCode)}
                {/* Glow effect */}
                <div className="absolute inset-0 blur-xl opacity-30">
                  {getWeatherIcon(weather.weatherCode)}
                </div>
              </motion.div>

              <div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={weather.temperature}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-1"
                  >
                    <span className="font-display text-5xl font-bold text-white tracking-tight">
                      {weather.temperature}
                    </span>
                    <span className="text-white/40 text-xl mt-1">°C</span>
                  </motion.div>
                </AnimatePresence>
                <p className="text-white/60 font-medium mt-1">{weather.conditions}</p>
                <p className="text-white/40 text-sm flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {weather.location}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2 text-white/60">
                <Droplets className="w-4 h-4 text-teal-400" />
                <span className="font-display text-lg font-medium text-white">{weather.humidity}%</span>
              </div>
              <span className="text-white/40 text-xs">Humidity</span>

              {/* Action buttons */}
              <div className="flex gap-2 mt-2">
                {!usingGeolocation ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={requestGeolocation}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <MapPin className="w-3 h-3" />
                    Use My Location
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetToDefault}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white transition-colors"
                  >
                    Reset
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 180 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  onClick={() => fetchWeatherForLocation(location)}
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
};

export default WeatherWidget;
