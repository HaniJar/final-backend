const express = require("express");
const User = require("../models/users");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getUser } = require("../middleware/finders");
const nodemailer = require("nodemailer");

// GET all users (works)
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// GET one user (works)
router.get("/:id", getUser, (req, res, next) => {
  res.send(res.user);
});

// SIGN-IN user with email & password
router.patch("/signin", async (req, res, next) => {
  const { fullname, password } = req.body;
  const user = await User.findOne({ fullname });

  if (!user) res.status(404).json({ message: "Cannot find user" });
  if (await bcrypt.compare(password, user.password)) {
    try {
      const ACCESS_TOKEN_SECRET = jwt.sign(
        JSON.stringify(user),
        process.env.ACCESS_TOKEN_SECRET
      );
      res.status(201).json({ jwt: ACCESS_TOKEN_SECRET });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res
      .status(400)
      .json({ message: "Username and password combination do not match" });
  }
});

// REGISTER user (works)
router.post("/signup", async (req, res, next) => {
  const { fullname, email, phone_number, password } = req.body;

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User({
    fullname,
    email,
    phone_number,
    password: hashedPassword,
  });

  try {
    const newUser = await user.save();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Signup Successful!",
      text: `Thank you ${fullname}, your Signup was successful. `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    try {
      const ACCESS_TOKEN_SECRET = jwt.sign(
        JSON.stringify(newUser),
        process.env.ACCESS_TOKEN_SECRET
      );
      res.status(201).json({ jwt: ACCESS_TOKEN_SECRET });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE a user (works)
router.put("/:id", getUser, async (req, res, next) => {
  const { fullname, phone_number, password, role } = req.body;
  if (fullname) res.user.fullname = fullname;
  if (phone_number) res.user.phone_number = phone_number;
  if (password) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    res.user.password = hashedPassword;
  }
  if (role) res.user.role = role;

  try {
    const updatedUser = await res.user.save();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: res.user.email,
      subject: "Updated your account Successfully!",
      text: `Thank you ${res.user.fullname}, we have updated your account successfully. `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    res.status(201).send(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a user
router.delete("/:id", getUser, async (req, res) => {
  const { fullname, email } = res.user;
  try {
    await res.user.remove();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Removed account Successfully!",
      text: `Your account has been removed succesfully, thank you ${fullname}, for your loyalty thus far.`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    res.json({ message: "Deleted user" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
