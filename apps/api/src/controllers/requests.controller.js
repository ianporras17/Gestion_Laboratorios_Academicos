// apps/api/src/controllers/requests.controller.js
const Requests = require('../models/requests.model');

const RequestsController = {
  async create(req, res, next) {
    try {
      const payload = req.body || {};
      // items: [{resource_id?, qty}]
      const r = await Requests.createRequest(payload);
      res.status(201).json(r);
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      next(e);
    }
  },

  async list(req, res, next) {
    try {
      const { lab_id, from, to, type_id, status, requirements_ok } = req.query;
      const rows = await Requests.list({
        lab_id: lab_id ? Number(lab_id) : undefined,
        from, to,
        type_id: type_id ? Number(type_id) : undefined,
        status,
        requirements_ok: typeof requirements_ok === 'string'
          ? requirements_ok === 'true'
          : undefined
      });
      res.json(rows);
    } catch (e) { next(e); }
  },

  async get(req, res, next) {
    try {
      const r = await Requests.get(Number(req.params.id));
      if (!r) return res.status(404).json({ error: 'Request not found' });
      res.json(r);
    } catch (e) { next(e); }
  },

  async approve(req, res, next) {
    try {
      const r = await Requests.approve(Number(req.params.id), {
        reviewer_id: req.body.reviewer_id || null,
        reviewer_note: req.body.reviewer_note || null
      });
      if (!r) return res.status(404).json({ error: 'Request not found' });
      res.json(r);
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      next(e);
    }
  },

  async reject(req, res, next) {
    try {
      const r = await Requests.reject(Number(req.params.id), {
        reviewer_id: req.body.reviewer_id || null,
        reviewer_note: req.body.reviewer_note || null
      });
      if (!r) return res.status(404).json({ error: 'Request not found' });
      res.json(r);
    } catch (e) { next(e); }
  },

  async needInfo(req, res, next) {
    try {
      const r = await Requests.needInfo(Number(req.params.id), {
        reviewer_id: req.body.reviewer_id || null,
        reviewer_note: req.body.reviewer_note || null,
        message: req.body.message || null
      });
      if (!r) return res.status(404).json({ error: 'Request not found' });
      res.json(r);
    } catch (e) { next(e); }
  },

  async addMessage(req, res, next) {
    try {
      const row = await Requests.addMessage(Number(req.params.id), {
        sender: req.body.sender,     // 'USUARIO' | 'ENCARGADO'
        message: req.body.message
      });
      if (!row) return res.status(404).json({ error: 'Request not found' });
      res.status(201).json(row);
    } catch (e) { next(e); }
  }
};

module.exports = RequestsController;
