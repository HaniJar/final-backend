const express = require("express");
const verifyToken = require("../middleware/authJwt");
const User = require("../models/users");
const getProduct = require("../middleware/attain");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Product = require("../models/products");

router.get("/", [verifyToken, getUser], (req, res) => {
  return res.send(res.user.cart);
});

router.post("/:id", [verifyToken, getUser], async (req, res) => {
  let product = await Product.findById(req.params.id).lean();
  let qty = req.body.qty;
  let cart = res.user.cart;
  let added = false;
  cart.forEach((item) => {
    if (item._id.valueOf() == product._id.valueOf()) {
      item.qty += qty;
      added = true;
    }
  });

  if (!added) {
    cart.push({ ...product, qty });
  }
  try {
    res.user.cart = cart;

    let token = jwt.sign(
      { _id: req.userId, cart: res.user.cart },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: 86400, // 24 hours
      }
    );
    const updatedUser = await res.user.save();
    res.status(200).json({ updatedUser, token });
  } catch (error) {
    console.log(error);
  }
});

router.delete("/", [verifyToken, getUser], async (req, res) => {
  try {
    res.user.cart = [];

    await res.user.save();
    res.json({ message: "Cleared Item" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.delete("/:id", [verifyToken, getUser], async (req, res) => {
  let cart = res.user.cart;
  cart.forEach((cartitem) => {
    if (cartitem._id == req.params.id) {
      cart = cart.filter((cartitems) => cartitems._id != req.params.id);
    }
  });
  try {
    res.user.cart = cart;

    const updated = res.user.save();
    let token = jwt.sign(
      { _id: req.userId, cart },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: 86400, // 24 hours
      }
    );
    res.json({ message: "Deleted product", updated, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", [verifyToken, getProduct], async (req, res) => {
  const user = await User.findById(req.userId);
  const inCart = user.cart.some((prod) => prod._id == req.params._id);

  let updatedUser;
  if (inCart) {
    const product = user.cart.find((prod) => prod._id == req.params._id);
    product.qty += req.body.qty;
    updatedUser = await user.save();
  } else {
    user.cart.push({ ...res.product, qty: req.body.qty });
    updatedUser = await user.save();
  }
  try {
    console.log(updatedUser, process.env.ACCESS_TOKEN_SECRET);
    const acces_token = jwt.sign(
      JSON.stringify(updatedUser),
      process.env.ACCESS_TOKEN_SECRET
    );

    res.status(201).json({ jwt: acces_token, cart: updatedUser.cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

async function getUser(req, res, next) {
  let user;
  try {
    user = await User.findById(req.userId);
    if (user == null) {
      return res.status(404).json({ message: "Cannot find User" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.user = user;
  next();
}

module.exports = router;
