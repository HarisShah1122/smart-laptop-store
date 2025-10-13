import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { User } from './userModel.js';

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID, 
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    orderItems: {
      type: DataTypes.JSON,
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false
    },
    itemsPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    taxPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    shippingPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    totalPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    paidAt: {
      type: DataTypes.DATE
    },
    isDelivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deliveredAt: {
      type: DataTypes.DATE
    },
    shippingAddress: {
      type: DataTypes.JSON,
      allowNull: false
    },
    paymentResult: {
      type: DataTypes.JSON
    }
  },
  { timestamps: true }
);

// Associations
Order.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

export { Order };