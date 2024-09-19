const multer = require('multer');
const express = require('express');
const Event = require('../models/event');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Create event
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      createdBy: req.user.id,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// RSVP to event
router.post('/:id/rsvp', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event is full' });
    }
    if (!event.attendees.includes(req.user.id)) {
      event.attendees.push(req.user.id);
      await event.save();
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Edit/Delete Event and other routes...

module.exports = router;
