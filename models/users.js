const mongoose = require("mongoose");
const ROLE = {
  CUSTOMER: "customer",
  ADMIN: "admin",
};

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },

  phone_number: {
    type: Number,
    required: true,
  },
  join_date: {
    type: String,
    default: Date.now,
  },
  cart: {
    type: Array,
    required: false,
    default: [],
  },
  roles: {
    type: String,
    required: true,
    default: ROLE.CUSTOMER,
  },
});

module.exports = mongoose.model("User", userSchema);
