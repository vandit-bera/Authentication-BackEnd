require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
var cookieParser = require("cookie-parser");

/* Middleware */
const auth = require("./middleware/auth");

/* import model User */
const User = require("./model/user");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Welcome to home page!");
});

app.post("/signup", async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    /* All required is filled or not */
    if (!(firstname && lastname && email && password)) {
      res.status(401).send("All fields are required!");
    }

    /* Check if user exists or not! */
    const existinguser = await User.findOne({ email });
    if (existinguser) {
      res.status(401).send("User is already exists!");
    }

    /* Encrypt the password */
    const encryptPassword = await bcrypt.hash(password, 10);

    /* Create a new entry in database */
    const user = await User.create({
      firstname: firstname,
      lastname: lastname,
      email: email,
      password: encryptPassword,
    });

    /* Create a token and send it to user */
    const token = jwt.sign(
      {
        id: user._id,
        email,
      },
      "shhhhh",
      { expiresIn: "2h" }
    );

    user.token = token;
    /* Don't send the password */
    user.password = undefined;

    res.status(201).json(user);
  } catch (error) {
    console.log(error);
    console.log("Error is in response route");
  }
});

app.post("/login", async (req, res) => {
  try {
    /* Collect info from front-end */
    const { email, password } = req.body;

    /* Validation */
    if (!(email && password)) {
      res.status(401).send("Email and Password is required!");
    }

    /* Check User in DataBase */
    const user = await User.findOne({ email });
    /* If User not exists! */
    if (!user) {
      res.status(401).send("User Doesn't Exist! Please SignUP!!!");
    }

    /* Match the password */
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id, email }, "shhhhh", {
        expiresIn: "2h",
      });

      user.token = token;
      user.password = undefined;

      /* Cookie */
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.status(201).cookie("token", token, options).json({
        success: true,
        token,
        user,
      });
    } else {
      res.status(401).send("Email or Password is incorrect!");
    }
    res.status(401).send("Please try again later!");
  } catch (error) {
    console.log(error);
  }
});

app.get("/user-list", async (req, res) => {
  try {
    const user = await User.find({});
    res.json(user);
  } catch (error) {
    console.log(error);
  }
});

app.put("/user-update", async (req, res) => {
  try {
    const { _id, firstname, lastname } = req.body;

    const findUser = await User.findOne({ _id });

    if (!findUser) {
      res.send("User is not exist");
    }

    const user = await User.updateOne(
      { _id },
      { $set: { firstname, lastname } },
      { upsert: true }
    );

    res.status(201).json(user);
  } catch (error) {
    console.log(error);
  }
});

app.delete("/user-delete", async (req, res) => {
  try {
    const { _id } = req.body;

    const findUser = await User.findOne({ _id });

    if (!findUser) {
      res.send("User is not exist");
    }

    const deleteUser = await User.deleteOne({ _id });

    res.status(201).json(deleteUser);
  } catch (error) {
    console.log(error);
  }
});

app.get("/dashboard", auth, (req, res) => {
  res.status(201).send("Welcome to Home page!");
});

module.exports = app;
