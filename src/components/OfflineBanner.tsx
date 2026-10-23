import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, Text } from 'react-native';

import { colors, spacing } from '@/theme';

/** Aviso exibido quando não há internet. As tarefas continuam funcionando (dados locais). */
export function OfflineBanner() {
  const { isConnected } = useNetInfo();
  if (isConnected !== false) return null;

  return <Text style={styles.banner}>Você está offline. Suas tarefas continuam disponíveis.</Text>;
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning,
    color: '#FFFFFF',
    textAlign: 'center',
    padding: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
  },
});
