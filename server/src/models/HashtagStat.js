import mongoose from 'mongoose';

// Lightweight counters for hashtag signals that aren't derivable from the Product
// collection alone (product/seller counts and total sold ARE derivable — see
// utils/hashtags.js). Keyed by the lowercase canonical tag so "RunningShoes" and
// "runningshoes" share one row; `displayTag` keeps a real-cased example for display
// if ever needed. Bumped via findOneAndUpdate upsert — no per-event log, stays cheap.
const hashtagStatSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true, unique: true }, // lowercase canonical key
    displayTag: { type: String, required: true },
    clicks: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    searches: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const HashtagStat = mongoose.model('HashtagStat', hashtagStatSchema);
