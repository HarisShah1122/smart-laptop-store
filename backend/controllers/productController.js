import { Product } from "../models/productModel.js";
import { deleteFile } from "../utils/file.js";
import { Op } from "sequelize";

// @desc    Fetch all products
const getProducts = async (req, res, next) => {
  try {
    const defaultLimit = 12;
    const maxLimit = Number(process.env.PAGINATION_MAX_LIMIT) || 20;

    let limit = Number(req.query.limit) || defaultLimit;
    if (limit < defaultLimit) limit = defaultLimit;
    if (limit > maxLimit) limit = maxLimit;

    const skip = Number(req.query.skip) || 0;
    const search = req.query.search || "";

    const { count: total, rows: products } = await Product.findAndCountAll({
      where: { name: { [Op.like]: `%${search}%` } },
      limit,
      offset: skip < 0 ? 0 : skip,
    });

    res.status(200).json({
      products,
      total,
      limit,
      maxLimit,
      maxSkip: total === 0 ? 0 : total - limit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch single product
const getProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;

    if (!productId || isNaN(Number(productId))) {
      res.status(400);
      throw new Error("Invalid product ID");
    }

    const product = await Product.findByPk(productId);

    if (!product) {
      res.status(404);
      throw new Error("Product not found!");
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
const createProduct = async (req, res, next) => {
  try {
    const { name, image, description, brand, category, price, countInStock } =
      req.body;

    const product = await Product.create({
      userId: req.user.id,
      name,
      image,
      description,
      brand,
      category,
      price,
      countInStock,
    });

    res.status(201).json({ message: "Product created", product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found!");
    }

    const previousImage = product.image;

    await product.update({
      name: req.body.name || product.name,
      image: req.body.image || product.image,
      description: req.body.description || product.description,
      brand: req.body.brand || product.brand,
      category: req.body.category || product.category,
      price: req.body.price || product.price,
      countInStock: req.body.countInStock || product.countInStock,
    });

    if (previousImage && previousImage !== product.image) {
      deleteFile(previousImage);
    }

    res.status(200).json({ message: "Product updated", product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found!");
    }

    await product.destroy();
    deleteFile(product.image);

    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product review
const createProductReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found!");
    }

    // Parse reviews (stored as string in DB)
    let reviews = [];
    if (product.reviews) {
      try {
        reviews = JSON.parse(product.reviews);
      } catch (e) {
        reviews = [];
      }
    }

    // Check if user already reviewed
    const alreadyReviewed = reviews.find((r) => r.userId === req.user.id);
    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Product already reviewed");
    }

    const review = {
      userId: req.user.id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    reviews.push(review);

    const numReviews = reviews.length;
    const avgRating =
      reviews.reduce((acc, r) => acc + r.rating, 0) / numReviews;

    await product.update({
      reviews: JSON.stringify(reviews), // Save back as string
      numReviews,
      rating: avgRating,
    });

    res.status(201).json({ message: "Review added" });
  } catch (error) {
    next(error);
  }
};


// @desc    Get top rated products
const getTopProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      order: [["rating", "DESC"]],
      limit: 3,
    });

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts, 
};
