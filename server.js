// require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("Connected to Database"));

app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Haniah's Pokémart! ≧◡≦ " });
});

const productsRouter = require("./routes/product");
const usersRouter = require("./routes/user");

const cartRouter = require("./routes/cart");
app.use("/products", productsRouter);
app.use("/users", usersRouter);

app.use("/cart", cartRouter);

app.listen(process.env.PORT || 3400, () =>
  console.log(`Server started on port 3400`)
);
