const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const productsRoutes = require("./routes/products-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.json());

app.use("/api/products", productsRoutes);

app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 401);
  throw error;
});

mongoose.set("strictQuery", false);

// main().catch((err) => console.log(err));

// async function main() {
//   await mongoose.connect(
//     "mongodb+srv://choco:nuRpPYQPgNd7Kai3@cluster0.glivzlo.mongodb.net/choco?retryWrites=true&w=majority"
//   );
//   app.listen(5000);
// }
mongoose
  .connect(
    `mongodb+srv://choco:nuRpPYQPgNd7Kai3@cluster0.glivzlo.mongodb.net/choco?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(5000);
  })
  .catch((error) => {
    console.log(error);
  });
