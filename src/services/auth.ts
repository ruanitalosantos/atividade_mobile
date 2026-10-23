import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { SQLiteDatabase } from 'expo-sqlite';

export type User = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

type UserRow = User & { password_hash: string; salt: string };

// Chave onde o id do usuário logado fica guardado (armazenamento criptografado do SO).
const SESSION_KEY = 'session_user_id';

export class AuthError extends Error {}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Gera o hash SHA-256 da senha combinada com um salt aleatório por usuário. */
async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function register(
  db: SQLiteDatabase,
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const cleanName = name.trim();
  const cleanEmail = normalizeEmail(email);

  if (!cleanName) throw new AuthError('Informe seu nome.');
  if (!validateEmail(cleanEmail)) throw new AuthError('E-mail inválido.');
  if (password.length < 6) throw new AuthError('A senha deve ter pelo menos 6 caracteres.');

  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM users WHERE email = ?',
    cleanEmail,
  );
  if (existing) throw new AuthError('Já existe uma conta com este e-mail.');

  const salt = bytesToHex(Crypto.getRandomBytes(16));
  const passwordHash = await hashPassword(password, salt);
  const createdAt = new Date().toISOString();

  const result = await db.runAsync(
    'INSERT INTO users (name, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)',
    cleanName,
    cleanEmail,
    passwordHash,
    salt,
    createdAt,
  );

  const user: User = { id: result.lastInsertRowId, name: cleanName, email: cleanEmail, created_at: createdAt };
  await SecureStore.setItemAsync(SESSION_KEY, String(user.id));
  return user;
}

export async function login(db: SQLiteDatabase, email: string, password: string): Promise<User> {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !password) throw new AuthError('Preencha e-mail e senha.');

  const row = await db.getFirstAsync<UserRow>('SELECT * FROM users WHERE email = ?', cleanEmail);
  // Mesma mensagem para usuário inexistente e senha errada: não revela quais e-mails existem.
  if (!row) throw new AuthError('E-mail ou senha incorretos.');

  const hash = await hashPassword(password, row.salt);
  if (hash !== row.password_hash) throw new AuthError('E-mail ou senha incorretos.');

  await SecureStore.setItemAsync(SESSION_KEY, String(row.id));
  return { id: row.id, name: row.name, email: row.email, created_at: row.created_at };
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

/** Recupera o usuário da sessão salva, se houver (mantém o login ao reabrir o app). */
export async function restoreSession(db: SQLiteDatabase): Promise<User | null> {
  const storedId = await SecureStore.getItemAsync(SESSION_KEY);
  if (!storedId) return null;

  const user = await db.getFirstAsync<User>(
    'SELECT id, name, email, created_at FROM users WHERE id = ?',
    Number(storedId),
  );
  if (!user) {
    await logout();
    return null;
  }
  return user;
}

export async function deleteAccount(db: SQLiteDatabase, userId: number): Promise<void> {
  await db.runAsync('DELETE FROM tasks WHERE user_id = ?', userId);
  await db.runAsync('DELETE FROM users WHERE id = ?', userId);
  await logout();
}
