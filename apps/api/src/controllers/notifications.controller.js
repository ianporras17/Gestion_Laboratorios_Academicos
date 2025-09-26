const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');

async function listMyNotifications(req, res) {
  const userId = req.user.id;
  const { only_unread } = req.query;
  const client = await pool.connect();
  try {
    const q = await client.query(
      `SELECT id, type, title, message, data, is_read, created_at
         FROM user_notifications
        WHERE user_id=$1
          ${only_unread ? 'AND is_read=FALSE' : ''}
        ORDER BY created_at DESC
        LIMIT 200`,
      [userId]
    );
    return res.json(q.rows);
  } catch (e) {
    console.error('[listMyNotifications]', e);
    return res.status(500).json({ error: 'Failed to list notifications' });
  } finally { client.release(); }
}

const markReadValidators = [ body('ids').isArray({ min:1 }) ];

async function markNotificationsRead(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const userId = req.user.id;
  const ids = req.body.ids;
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE user_notifications SET is_read=TRUE
        WHERE user_id=$1 AND id = ANY($2::uuid[])`,
      [userId, ids]
    );
    return res.json({ ok:true });
  } catch (e) {
    console.error('[markNotificationsRead]', e);
    return res.status(500).json({ error: 'Failed to mark notifications' });
  } finally { client.release(); }
}

module.exports = { listMyNotifications, markReadValidators, markNotificationsRead };
