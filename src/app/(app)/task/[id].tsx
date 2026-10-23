import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { PRIORITY_COLORS } from '@/components/TaskItem';
import { useUser } from '@/context/AuthContext';
import { deleteTask, getTask, PRIORITY_LABELS, setTaskDone, type Task } from '@/services/tasks';
import { colors, spacing } from '@/theme';
import { formatBrDate, formatDateTime, isOverdue } from '@/utils/date';

export default function TaskDetailScreen() {
  const db = useSQLiteContext();
  const user = useUser();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = Number(id);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setTask(await getTask(db, user.id, taskId));
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a tarefa.');
    } finally {
      setLoading(false);
    }
  }, [db, user.id, taskId]);

  // Recarrega ao voltar da tela de edição.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleToggle() {
    if (!task) return;
    try {
      await setTaskDone(db, user.id, task.id, task.done === 0);
      await load();
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a tarefa.');
    }
  }

  function handleDelete() {
    Alert.alert('Excluir tarefa', 'Tem certeza? Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(db, user.id, taskId);
            router.back();
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir a tarefa.');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Tarefa não encontrada.</Text>
      </View>
    );
  }

  const done = task.done === 1;
  const overdue = !done && isOverdue(task.due_date);

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>{task.title}</Text>

        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[task.priority] }]}>
            <Text style={styles.badgeText}>Prioridade {PRIORITY_LABELS[task.priority]}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: done ? colors.success : colors.textMuted }]}>
            <Text style={styles.badgeText}>{done ? 'Concluída' : 'Pendente'}</Text>
          </View>
        </View>

        <Text style={styles.label}>Descrição</Text>
        <Text style={styles.value}>{task.description || 'Sem descrição.'}</Text>

        <Text style={styles.label}>Data de entrega</Text>
        <Text style={[styles.value, overdue && styles.overdue]}>
          {task.due_date ? `${formatBrDate(task.due_date)}${overdue ? ' (atrasada)' : ''}` : 'Sem data definida.'}
        </Text>

        <Text style={styles.meta}>Criada em {formatDateTime(task.created_at)}</Text>
        <Text style={styles.meta}>Atualizada em {formatDateTime(task.updated_at)}</Text>
      </View>

      <View style={styles.actions}>
        <Button title={done ? 'Marcar como pendente' : 'Marcar como concluída'} onPress={handleToggle} />
        <Button
          title="Editar"
          variant="outline"
          onPress={() => router.push({ pathname: '/task-form', params: { id: task.id } })}
        />
        <Button title="Excluir" variant="danger" onPress={handleDelete} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  muted: { color: colors.textMuted, fontSize: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: spacing.lg, marginBottom: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: spacing.md, textTransform: 'uppercase' },
  value: { fontSize: 16, color: colors.text, marginTop: spacing.xs },
  overdue: { color: colors.danger, fontWeight: '600' },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  actions: { gap: spacing.sm },
});
