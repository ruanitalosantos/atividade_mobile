import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/OfflineBanner';
import { TaskItem } from '@/components/TaskItem';
import { WeatherCard } from '@/components/WeatherCard';
import { useUser } from '@/context/AuthContext';
import { listTasks, setTaskDone, type Task, type TaskFilter } from '@/services/tasks';
import { colors, MAX_CONTENT_WIDTH, spacing } from '@/theme';

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendentes', label: 'Pendentes' },
  { value: 'concluidas', label: 'Concluídas' },
];

export default function HomeScreen() {
  const db = useSQLiteContext();
  const user = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('pendentes');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setTasks(await listTasks(db, user.id, filter));
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as tarefas.');
    }
  }, [db, user.id, filter]);

  // Recarrega sempre que a tela volta ao foco (ex.: depois de criar/editar uma tarefa).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleToggle(task: Task) {
    try {
      await setTaskDone(db, user.id, task.id, task.done === 0);
      await load();
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a tarefa.');
    }
  }

  const firstName = user.name.split(' ')[0];

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <FlatList
        data={tasks}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 96 }]}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View>
            <Text style={styles.greeting}>Olá, {firstName}!</Text>
            <WeatherCard />
            <View style={styles.filters}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f.value}
                  onPress={() => setFilter(f.value)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: filter === f.value }}
                  style={[styles.chip, filter === f.value && styles.chipActive]}>
                  <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>{f.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {filter === 'concluidas' ? 'Nenhuma tarefa concluída ainda.' : 'Nenhuma tarefa por aqui. Toque em "+" para criar.'}
          </Text>
        }
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })}
            onToggle={() => handleToggle(item)}
          />
        )}
      />

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={() => router.push('/task-form')}
        accessibilityRole="button"
        accessibilityLabel="Nova tarefa">
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontSize: 15 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#FFFFFF', fontSize: 32, lineHeight: 34 },
});
