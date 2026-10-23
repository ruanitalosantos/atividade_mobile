import { Redirect, Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

/** Grupo de telas protegidas: só acessível com usuário logado. */
export default function AppLayout() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Minhas Tarefas',
          headerRight: () => (
            <Pressable onPress={() => router.push('/profile')} hitSlop={10} accessibilityRole="button">
              <Text style={styles.headerButton}>Perfil</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="task-form" options={{ title: 'Tarefa' }} />
      <Stack.Screen name="task/[id]" options={{ title: 'Detalhes' }} />
      <Stack.Screen name="profile" options={{ title: 'Perfil' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerButton: { color: colors.primary, fontSize: 16, fontWeight: '600' },
});
