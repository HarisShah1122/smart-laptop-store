import express from 'express';
import {
  getProducts,
  getProduct,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validator.js';
import { body, check, param } from 'express-validator';

const router = express.Router();

const validator = {
  getProducts: [
    check('limit')
      .optional()
      .isNumeric()
      .withMessage('Limit must be a number')
      .custom((value) => {
        if (value < 0) throw new Error('Limit must be >= 0');
        return true;
      }),
    check('skip')
      .optional()
      .isNumeric()
      .withMessage('Skip must be a number')
      .custom((value) => {
        if (value < 0) throw new Error('Skip must be >= 0');
        return true;
      }),
    check('search').optional().trim().escape(),
  ],
  createProduct: [
    check('name').trim().notEmpty().withMessage('Name is required').escape(),
    check('image').notEmpty().withMessage('Image is required'),
    check('description').trim().notEmpty().withMessage('Description is required').escape(),
    check('brand').trim().notEmpty().withMessage('Brand is required').escape(),
    check('category').trim().notEmpty().withMessage('Category is required').escape(),
    check('price').notEmpty().isNumeric().withMessage('Price must be a number'),
    check('countInStock').notEmpty().isNumeric().withMessage('Count in stock must be a number'),
  ],
  createProductReview: [
    param('id').notEmpty().withMessage('Id is required'),
    body('rating').notEmpty().isNumeric().withMessage('Rating must be a number'),
    body('comment').trim().escape(),
  ],
  getProduct: [param('id').notEmpty().withMessage('Id is required')],
  deleteProduct: [param('id').notEmpty().withMessage('Id is required')],
  updateProduct: [
    check('name').trim().notEmpty().withMessage('Name is required').escape(),
    check('image').notEmpty().withMessage('Image is required'),
    check('description').trim().notEmpty().withMessage('Description is required').escape(),
    check('brand').trim().notEmpty().withMessage('Brand is required').escape(),
    check('category').trim().notEmpty().withMessage('Category is required').escape(),
    check('price').notEmpty().isNumeric().withMessage('Price must be a number'),
    check('countInStock').notEmpty().isNumeric().withMessage('Count in stock must be a number'),
    param('id').notEmpty().withMessage('Id is required'),
  ],
};

// Routes
router
  .route('/')
  .get(validator.getProducts, validateRequest, getProducts)
  .post(validator.createProduct, validateRequest, protect, admin, createProduct);

router.get('/top', getTopProducts);

router.post(
  '/reviews/:id',
  validator.createProductReview,
  validateRequest,
  protect,
  createProductReview
);

router
  .route('/:id')
  .get(validator.getProduct, validateRequest, getProduct)
  .put(validator.updateProduct, validateRequest, protect, admin, updateProduct)
  .delete(validator.deleteProduct, validateRequest, protect, admin, deleteProduct);

export default router;
