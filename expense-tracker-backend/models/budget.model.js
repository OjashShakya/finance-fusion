const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: ["Food", "Transportation", "Entertainment","Utilities", "Housing","Healthcare", "Education", "Shopping", "Travel", "Other"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    period: {
      type: String,
      enum: ["Weekly", "Monthly", "Yearly"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Budget || mongoose.model("Budget", budgetSchema);
