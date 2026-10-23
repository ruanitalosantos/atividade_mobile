import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PRIORITY_LABELS, type Priority, type Task } from '@/services/tasks';
import { colors, spacing } from '@/theme';
import { formatBrDate, isOverdue } from '@/utils/date';

export const PRIORITY_COLORS: Record<Priority, string> = {
  baixa: colors.success,
  media: colors.warning,
  alta: colors.danger,
};

type Props = {
  task: Task;
  onPress: () => void;
  onToggle: () => void;
};

export function TaskItem({ task, onPress, onToggle }: Props) {
  const done = task.done === 1;
  const overdue = !done && isOverdue(task.due_date);

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button" accessibilityLabel={task.title}>
      <Pressable
        onPress={onToggle}
        hitSlop={12}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? 'Marcar como pendente' : 'Marcar como concluída'}
        style={[styles.check, done && styles.checkDone]}>
        {done && <Text style={styles.checkMark}>✓</Text>}
      </Pressable>

      <View style={styles.body}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={1}>
          {task.title}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[task.priority] }]}>
            <Text style={styles.badgeText}>{PRIORITY_LABELS[task.priority]}</Text>
          </View>
          {task.due_date && (
            <Text style={[styles.date, overdue && styles.overdue]}>
              {overdue ? 'Atrasada · ' : ''}
              {formatBrDate(task.due_date)}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkDone: { backgroundColor: colors.primary },
  checkMark: { color: '#FFFFFF', fontWeight: '700' },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  titleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.sm },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  date: { fontSize: 13, color: colors.textMuted },
  overdue: { color: colors.danger, fontWeight: '600' },
});
