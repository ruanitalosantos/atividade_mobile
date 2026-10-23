import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth, useUser } from '@/context/AuthContext';
import { countTasks } from '@/services/tasks';
import { colors, spacing } from '@/theme';
import { formatDateTime } from '@/utils/date';

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const user = useUser();
  const { signOut, deleteAccount } = useAuth();
  const [stats, setStats] = useState({ total: 0, done: 0 });

  useFocusEffect(
    useCallback(() => {
      countTasks(db, user.id)
        .then(setStats)
        .catch(() => setStats({ total: 0, done: 0 }));
    }, [db, user.id]),
  );

  function handleLogout() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', onPress: () => signOut().catch(() => Alert.alert('Erro', 'Não foi possível sair.')) },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert('Excluir conta', 'Sua conta e todas as suas tarefas serão apagadas permanentemente.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteAccount().catch(() => Alert.alert('Erro', 'Não foi possível excluir a conta.')),
      },
    ]);
  }

  const pending = stats.total - stats.done;
  const percent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.avatar}>{user.name.charAt(0).toUpperCase()}</Text>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.since}>Membro desde {formatDateTime(user.created_at)}</Text>
      </View>

      <View style={styles.stats}>
        <Stat label="Total" value={stats.total} />
        <Stat label="Pendentes" value={pending} />
        <Stat label="Concluídas" value={stats.done} />
      </View>

      <View style={styles.progressBox}>
        <Text style={styles.progressLabel}>Progresso: {percent}%</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Sair" variant="outline" onPress={handleLogout} />
        <Button title="Excluir conta" variant="danger" onPress={handleDeleteAccount} />
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: spacing.lg, alignItems: 'center' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 72,
    marginBottom: spacing.md,
  },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  email: { fontSize: 15, color: colors.textMuted, marginTop: spacing.xs },
  since: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },
  progressBox: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, marginTop: spacing.md },
  progressLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.success },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
