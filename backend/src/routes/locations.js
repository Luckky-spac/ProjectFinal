const express = require('express');
const router = express.Router();
const { Province, District, Village } = require('../models');

router.get('/provinces', async (req, res) => {
  try {
    const data = await Province.findAll({ order: [['name', 'ASC']] });
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/districts', async (req, res) => {
  try {
    const where = req.query.province_id ? { province_id: req.query.province_id } : {};
    const data = await District.findAll({ where, order: [['name', 'ASC']] });
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/villages', async (req, res) => {
  try {
    const where = req.query.district_id ? { district_id: req.query.district_id } : {};
    const data = await Village.findAll({ where, order: [['name', 'ASC']] });
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
