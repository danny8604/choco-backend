const getAllProducts = (req, res, next) => {
  res.json({ products: "teststset" });
};

const getProductById = (req, res, next) => {
  const productId = req.params.productId;
  res.json({
    product: productId,
  });
};

const getProductByCategory = (req, res, next) => {
  const category = req.params.categoryId;
  res.status(200).json({ category: category });
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductByCategory,
};
