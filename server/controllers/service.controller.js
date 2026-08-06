const mongoose = require('mongoose');
const Service = require('../models/Service');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// @route GET /api/services
async function getServices(req, res, next) {
  try {
    const { category, minPrice, maxPrice, q } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const services = await Service.find(filter).populate('availableStaff', 'name photo rating');
    res.status(200).json({ success: true, count: services.length, services });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/services/:id
async function getService(req, res, next) {
  try {
    const { id } = req.params;
    let service;
    if (mongoose.Types.ObjectId.isValid(id)) {
      service = await Service.findById(id).populate('availableStaff', 'name photo rating specialty');
    }
    if (!service) {
      service = await Service.findOne({ slug: id }).populate('availableStaff', 'name photo rating specialty');
    }
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.status(200).json({ success: true, service });
  } catch (err) {
    next(err);
  }
}

// @route POST /api/services
async function createService(req, res, next) {
  try {
    const body = { ...req.body };
    if (!body.slug && body.name) body.slug = slugify(body.name);
    const service = await Service.create(body);
    res.status(201).json({ success: true, service });
  } catch (err) {
    next(err);
  }
}

// @route PUT /api/services/:id
async function updateService(req, res, next) {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    Object.assign(service, req.body);
    await service.save();
    res.status(200).json({ success: true, service });
  } catch (err) {
    next(err);
  }
}

// @route DELETE /api/services/:id
async function deleteService(req, res, next) {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    service.isActive = false;
    await service.save();
    res.status(200).json({ success: true, message: 'Service deactivated successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
};
