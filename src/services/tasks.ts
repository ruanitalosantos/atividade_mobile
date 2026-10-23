import type { SQLiteDatabase } from 'expo-sqlite';

export type Priority = 'baixa' | 'media' | 'alta';

export type Task = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  priority: Priority;
  due_date: string | null; // formato ISO AAAA-MM-DD
  done: number; // SQLite não tem boolean: 0 ou 1
  created_at: string;
  updated_at: string;
};

export type TaskInput = {
  title: string;
  description: string;
  priority: Priority;
  due_date: string | null;
};

export type TaskFilter = 'todas' | 'pendentes' | 'concluidas';

export const PRIORITY_LABELS: Record<Priority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

export class ValidationError extends Error {}

function validate(input: TaskInput): TaskInput {
  const title = input.title.trim();
  if (!title) throw new ValidationError('O título é obrigatório.');
  if (title.length > 100) throw new ValidationError('O título deve ter no máximo 100 caracteres.');
  return { ...input, title, description: input.description.trim() };
}

// ---------- CREATE ----------
export async function createTask(db: SQLiteDatabase, userId: number, input: TaskInput): Promise<number> {
  const data = validate(input);
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO tasks (user_id, title, description, priority, due_date, done, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    userId,
    data.title,
    data.description,
    data.priority,
    data.due_date,
    now,
    now,
  );
  return result.lastInsertRowId;
}

// ---------- READ ----------
export async function listTasks(db: SQLiteDatabase, userId: number, filter: TaskFilter): Promise<Task[]> {
  let where = 'user_id = ?';
  if (filter === 'pendentes') where += ' AND done = 0';
  if (filter === 'concluidas') where += ' AND done = 1';

  // Pendentes primeiro, depois por data de vencimento (sem data vai para o fim) e prioridade.
  return db.getAllAsync<Task>(
    `SELECT * FROM tasks WHERE ${where}
     ORDER BY done ASC,
              due_date IS NULL, due_date ASC,
              CASE priority WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END,
              created_at DESC`,
    userId,
  );
}

export async function getTask(db: SQLiteDatabase, userId: number, id: number): Promise<Task | null> {
  // Sempre filtra pelo usuário: ninguém acessa tarefa de outra conta.
  return db.getFirstAsync<Task>('SELECT * FROM tasks WHERE id = ? AND user_id = ?', id, userId);
}

export async function countTasks(db: SQLiteDatabase, userId: number): Promise<{ total: number; done: number }> {
  const row = await db.getFirstAsync<{ total: number; done: number | null }>(
    'SELECT COUNT(*) AS total, SUM(done) AS done FROM tasks WHERE user_id = ?',
    userId,
  );
  return { total: row?.total ?? 0, done: row?.done ?? 0 };
}

// ---------- UPDATE ----------
export async function updateTask(db: SQLiteDatabase, userId: number, id: number, input: TaskInput): Promise<void> {
  const data = validate(input);
  await db.runAsync(
    `UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    data.title,
    data.description,
    data.priority,
    data.due_date,
    new Date().toISOString(),
    id,
    userId,
  );
}

export async function setTaskDone(db: SQLiteDatabase, userId: number, id: number, done: boolean): Promise<void> {
  await db.runAsync(
    'UPDATE tasks SET done = ?, updated_at = ? WHERE id = ? AND user_id = ?',
    done ? 1 : 0,
    new Date().toISOString(),
    id,
    userId,
  );
}

// ---------- DELETE ----------
export async function deleteTask(db: SQLiteDatabase, userId: number, id: number): Promise<void> {
  await db.runAsync('DELETE FROM tasks WHERE id = ? AND user_id = ?', id, userId);
}
