import { getDb } from './lib/db.js';
import { requireAuth } from './lib/auth.js';
import { json, error, requireMethod } from './lib/response.js';
import { journalSettingsFromDb, journalSettingsToDb } from './lib/transformers.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, ['GET', 'PUT'])) return;

  const db = getDb();

  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT * FROM journal_settings WHERE id = 1');
      if (!result.rows[0]) {
        return json(res, {
          referenceDate: '2025-06-03',
          referenceStreak: 81,
          goalDays: 365,
          goalReward: '出一本书',
          reminderTime: '06:00',
        });
      }
      json(res, journalSettingsFromDb(result.rows[0]));
    } catch (err) {
      console.error('Journal settings GET error:', err);
      error(res, '获取设置失败');
    }
    return;
  }

  // PUT - requires auth
  const user = await requireAuth(req, res);
  if (!user) return;

  const body = req.body;
  if (!body) return error(res, '缺少数据', 400);

  try {
    const d = journalSettingsToDb(body);
    await db.execute({
      sql: `INSERT OR REPLACE INTO journal_settings (id, reference_date, reference_streak, goal_days, goal_reward, reminder_time, updated_at)
            VALUES (1, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [d.reference_date, d.reference_streak, d.goal_days, d.goal_reward, d.reminder_time],
    });

    const result = await db.execute('SELECT * FROM journal_settings WHERE id = 1');
    json(res, journalSettingsFromDb(result.rows[0]));
  } catch (err) {
    console.error('Journal settings PUT error:', err);
    error(res, '更新设置失败');
  }
}
