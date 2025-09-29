const Users = require('../models/users.model'); // <- asegúrate que este archivo exista y exporte funciones usadas

const UsersController = {
  async me(req, res, next) {
    try {
      const row = await Users.getById(req.user.id);
      if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json(row);
    } catch (e) { next(e); }
  },

  async updateMe(req, res, next) {
    try {
      const row = await Users.updateById(req.user.id, req.body || {});
      res.json(row);
    } catch (e) { next(e); }
  },

  async myTrainings(req, res, next) {
    try {
      const rows = await Users.listMyTrainings(req.user.id);
      res.json(rows);
    } catch (e) { next(e); }
  },

  async upsertTraining(req, res, next) {
    try {
      const row = await Users.upsertTraining(req.user.id, req.body || {});
      res.status(201).json(row);
    } catch (e) { next(e); }
  },

  async labRequirements(req, res, next) {
    try {
      const lab_id = Number(req.query.lab_id);
      if (!lab_id) return res.status(400).json({ error: 'lab_id es requerido' });
      const r = await Users.checkLabEligibility(req.user.id, lab_id);
      res.json(r);
    } catch (e) { next(e); }
  },
};

module.exports = UsersController;
