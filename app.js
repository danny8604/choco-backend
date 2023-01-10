const express = require("express");
const bodyParser = require("body-parser");

const productsRoutes = require("./routes/products-routes");

const app = express();

app.use(bodyParser.json());

app.use("/api/products", productsRoutes);

app.use((req, res, next) => {
  const error = new Error("Could not find this route.", 404);
  throw error;
});

app.listen(5000);
