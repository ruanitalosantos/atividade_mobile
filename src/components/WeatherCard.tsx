import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { getWeather, WeatherError, type WeatherResult } from '@/services/weather';
import { colors, spacing } from '@/theme';
import { formatDateTime } from '@/utils/date';

/** Cartão da tela inicial com o clima atual (geolocalização + API Open-Meteo). */
export function WeatherCard() {
  const db = useSQLiteContext();
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = useCallback(
    () =>
      getWeather(db)
        .then((data) => {
          setResult(data);
          setError(null);
        })
        .catch((e) => setError(e instanceof WeatherError ? e.message : 'Erro ao carregar o clima.'))
        .finally(() => setLoading(false)),
    [db],
  );

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  function handleRefresh() {
    setLoading(true);
    fetchWeather();
  }

  return (
    <Pressable
      style={styles.card}
      onPress={handleRefresh}
      accessibilityRole="button"
      accessibilityHint="Toque para atualizar o clima">
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : error ? (
        <Text style={styles.small}>{error} Toque para tentar novamente.</Text>
      ) : result ? (
        <View style={styles.row}>
          <Text style={styles.temp}>{result.weather.temperature}°C</Text>
          <View style={styles.info}>
            <Text style={styles.title}>{result.weather.description}</Text>
            <Text style={styles.small}>
              {result.weather.city ?? 'Sua localização'} · vento {result.weather.windSpeed} km/h
            </Text>
            {result.fromCache && (
              <Text style={styles.small}>Offline — dados de {formatDateTime(result.weather.fetchedAt)}</Text>
            )}
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 80,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  temp: { fontSize: 36, fontWeight: '700', color: '#FFFFFF', marginRight: spacing.md },
  info: { flex: 1 },
  title: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  small: { fontSize: 13, color: '#DBEAFE', marginTop: 2 },
});
