import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { PRIORITY_COLORS } from '@/components/TaskItem';
import { useUser } from '@/context/AuthContext';
import { createTask, getTask, PRIORITY_LABELS, updateTask, ValidationError, type Priority } from '@/services/tasks';
import { colors, spacing } from '@/theme';
import { formatBrDate, maskBrDate, parseBrDate } from '@/utils/date';

const PRIORITIES: Priority[] = ['baixa', 'media', 'alta'];

/** Formulário usado tanto para criar (sem id) quanto para editar (com id). */
export default function TaskFormScreen() {
  const db = useSQLiteContext();
  const user = useUser();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const taskId = id ? Number(id) : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('media');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string }>({});
  const [saving, setSaving] = useState(false);

  // No modo edição, preenche o formulário com os dados atuais.
  useEffect(() => {
    if (!taskId) return;
    getTask(db, user.id, taskId)
      .then((task) => {
        if (!task) {
          Alert.alert('Erro', 'Tarefa não encontrada.');
          router.back();
          return;
        }
        setTitle(task.title);
        setDescription(task.description);
        setPriority(task.priority);
        setDueDate(formatBrDate(task.due_date));
      })
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar a tarefa.'));
  }, [db, user.id, taskId, router]);

  async function handleSave() {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = 'O título é obrigatório.';

    let isoDate: string | null = null;
    if (dueDate.trim()) {
      isoDate = parseBrDate(dueDate);
      if (!isoDate) newErrors.dueDate = 'Data inválida. Use DD/MM/AAAA.';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const input = { title, description, priority, due_date: isoDate };
      if (taskId) {
        await updateTask(db, user.id, taskId, input);
      } else {
        await createTask(db, user.id, input);
      }
      router.back();
    } catch (e) {
      Alert.alert('Erro', e instanceof ValidationError ? e.message : 'Não foi possível salvar a tarefa.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: taskId ? 'Editar tarefa' : 'Nova tarefa' }} />

      <Input
        label="Título *"
        value={title}
        onChangeText={setTitle}
        placeholder="Ex.: Estudar para a prova"
        maxLength={100}
        error={errors.title}
      />
      <Input
        label="Descrição"
        value={description}
        onChangeText={setDescription}
        placeholder="Detalhes (opcional)"
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />
      <Input
        label="Data de entrega"
        value={dueDate}
        onChangeText={(text) => setDueDate(maskBrDate(text))}
        placeholder="DD/MM/AAAA (opcional)"
        keyboardType="number-pad"
        maxLength={10}
        error={errors.dueDate}
      />

      <Text style={styles.label}>Prioridade</Text>
      <View style={styles.priorities}>
        {PRIORITIES.map((p) => {
          const selected = priority === p;
          return (
            <Pressable
              key={p}
              onPress={() => setPriority(p)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[
                styles.priority,
                { borderColor: PRIORITY_COLORS[p] },
                selected && { backgroundColor: PRIORITY_COLORS[p] },
              ]}>
              <Text style={[styles.priorityText, { color: selected ? '#FFFFFF' : PRIORITY_COLORS[p] }]}>
                {PRIORITY_LABELS[p]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Button title={taskId ? 'Salvar alterações' : 'Criar tarefa'} onPress={handleSave} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  priorities: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  priority: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: { fontWeight: '600' },
});
