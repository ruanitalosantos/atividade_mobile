import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { AuthError } from '@/services/auth';
import { colors, spacing } from '@/theme';

export default function RegisterScreen() {
  const { user, signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Redirect href="/" />;

  async function handleRegister() {
    setError(null);
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await signUp(name, email, password);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Não foi possível criar a conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.intro}>Crie sua conta para salvar suas tarefas neste aparelho.</Text>

      <Input label="Nome" value={name} onChangeText={setName} placeholder="Seu nome" autoComplete="name" />
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
        placeholder="Mínimo de 6 caracteres"
        secureTextEntry
      />
      <Input
        label="Confirmar senha"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Repita a senha"
        secureTextEntry
        onSubmitEditing={handleRegister}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button title="Cadastrar" onPress={handleRegister} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.lg },
  error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
});
