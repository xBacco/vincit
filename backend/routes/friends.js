'use strict';
const express = require('express');
const db      = require('../db.js');

// GET /api/friends — anyone you share at least one group with.
// Returns: [{ id, name, avatar, avatar_url, color_key,
//             shared_groups: [{id,name,emoji}], last_interaction }]
//
// last_interaction = latest bet (created_at or resolved_at) in any shared
// room where either user is creator OR target. Falls back to most-recent
// joined_at of any common membership.
async function listFriends(userId) {
  const { rows } = await db.query(
    `
    WITH my_groups AS (
      SELECT group_id FROM user_groups WHERE user_id = $1
    ),
    candidates AS (
      SELECT DISTINCT ug.user_id
      FROM user_groups ug
      JOIN my_groups mg ON mg.group_id = ug.group_id
      WHERE ug.user_id <> $1
    )
    SELECT
      u.id, u.name, u.avatar, u.avatar_url, u.color_key,
      (
        SELECT jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'emoji', r.emoji) ORDER BY r.name)
        FROM rooms r
        WHERE r.id IN (
          SELECT ug.group_id
          FROM user_groups ug
          JOIN my_groups mg ON mg.group_id = ug.group_id
          WHERE ug.user_id = u.id
        )
      ) AS shared_groups,
      (
        SELECT GREATEST(COALESCE(MAX(b.resolved_at),0), COALESCE(MAX(b.created_at),0))
        FROM bets b
        WHERE b.room_id IN (
          SELECT ug.group_id
          FROM user_groups ug
          JOIN my_groups mg ON mg.group_id = ug.group_id
          WHERE ug.user_id = u.id
        )
        AND (b.creator = u.id OR b.creator = $1
             OR b.target_user = u.id OR b.target_user = $1)
      ) AS last_interaction
    FROM candidates c
    JOIN users u ON u.id = c.user_id
    ORDER BY u.name
    `,
    [userId]
  );
  return rows;
}

function makeRouter(broadcastUpdate) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const friends = await listFriends(req.userId);
      res.json(friends);
    } catch (e) {
      console.error('[friends:list]', e);
      res.status(500).json({ error: 'server_error' });
    }
  });

  return router;
}

module.exports = makeRouter;
