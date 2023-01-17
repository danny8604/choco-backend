const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const productsRoutes = require("./routes/products-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, XMLHttpRequest,Authorization"
  );
  res.setHeader("Access-Control-Allow-methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/products", productsRoutes);

app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 401);
  throw error;
});

mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    app.listen(5000);
  })
  .catch((error) => {
    console.log(error);
  });
