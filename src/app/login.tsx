import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { AuthError } from '@/services/auth';
import { colors, spacing } from '@/theme';

export default function LoginScreen() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Redirect href="/" />;

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.logo}>✓</Text>
        <Text style={styles.title}>Minhas Tarefas</Text>
        <Text style={styles.subtitle}>Organize seu dia de forma simples</Text>
      </View>

      <Input
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="voce@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Input
        label="Senha"
        value={password}
        onChangeText={setPassword}
        placeholder="Sua senha"
        secureTextEntry
        autoComplete="password"
        onSubmitEditing={handleLogin}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button title="Entrar" onPress={handleLogin} loading={loading} />

      <Link href="/register" style={styles.link}>
        Não tem conta? <Text style={styles.linkBold}>Cadastre-se</Text>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.xl * 2, marginBottom: spacing.xl },
  logo: {
    fontSize: 40,
    color: '#FFFFFF',
    backgroundColor: colors.primary,
    width: 72,
    height: 72,
    lineHeight: 72,
    textAlign: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: spacing.xs },
  error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  link: { textAlign: 'center', marginTop: spacing.lg, color: colors.textMuted, fontSize: 15, padding: spacing.sm },
  linkBold: { color: colors.primary, fontWeight: '600' },
});
