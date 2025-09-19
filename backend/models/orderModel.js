import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { User } from './userModel.js';
import { Product } from './productModel.js';

const Order = sequelize.define(
  'Order',
  {
    paymentMethod: { type: DataTypes.STRING, allowNull: false },
    itemsPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    taxPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    shippingPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    totalPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    isPaid: { type: DataTypes.BOOLEAN, defaultValue: false },
    paidAt: { type: DataTypes.DATE },
    isDelivered: { type: DataTypes.BOOLEAN, defaultValue: false },
    deliveredAt: { type: DataTypes.DATE },
    shippingAddress: { type: DataTypes.JSON, allowNull: false },
    paymentResult: { type: DataTypes.JSON },
  },
  { timestamps: true }
);

// Associations
Order.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
Order.belongsTo(Product, { foreignKey: 'productId', onDelete: 'CASCADE' });

export { Order };
