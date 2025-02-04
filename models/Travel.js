const mongoose = require("mongoose");

const TravelSchema = new mongoose.Schema(
  {
    placeName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    visitDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    photos: [String], // Array of photo URLs

    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide user"],
    },
  },
  { timestamps: true } // add createdAt and updatedAt authomatically
);

const Travel = mongoose.model("Travel", TravelSchema);

module.exports = Travel;
