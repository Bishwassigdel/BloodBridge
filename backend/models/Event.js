// backend/models/Event.js
import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['attending', 'declined'], default: 'attending' },
  rsvpAt: { type: Date, default: Date.now },
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  date:        { type: Date, required: true },
  time:        { type: String, required: true },          // e.g. "10:00 AM – 4:00 PM"
  location:    { type: String, required: true, trim: true },
  contactPhone:{ type: String, default: '' },
  bloodGroupsNeeded: [{
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'All'],
  }],
  targetDonors: { type: Number, default: 0 },
  hospital:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalName: { type: String, required: true },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  rsvps:        [rsvpSchema],
  notifiedCount:{ type: Number, default: 0 },  // how many users were emailed
  // ── Post-event showcase fields (filled when marking as completed) ──────────
  image:         { type: String, default: '' },         // cover image URL
  story:         { type: String, default: '' },         // full event story
  quote:         { type: String, default: '' },         // participant quote
  quoteName:     { type: String, default: '' },         // name of quoted person
  unitsCollected:{ type: Number, default: 0 },          // actual units collected
  totalDonors:   { type: Number, default: 0 },          // actual donors attended
}, { timestamps: true });

// Virtual: attending count
eventSchema.virtual('attendingCount').get(function () {
  return this.rsvps.filter(r => r.status === 'attending').length;
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
export default Event;
