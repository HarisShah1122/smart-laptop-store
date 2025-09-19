import { sequelize } from './config/db.js';
import { User } from './models/userModel.js';
import { Product } from './models/productModel.js';
import { Order } from './models/orderModel.js';
import users from './data/users.js';
import products from './data/products.js';
import colors from 'colors';
import 'dotenv/config';

const importData = async () => {
  try {
    // Sync database (create tables if they don't exist)
    await sequelize.sync({ force: true });

    // Seed users
    const createdUsers = await User.bulkCreate(users, { validate: true });
    console.log('Users seeded successfully'.green);

    // Get admin user ID
    const adminUser = createdUsers.find(user => user.isAdmin);

    // Seed products (assign to admin user)
    const sampleProducts = products.map(product => ({
      ...product,
      userId: adminUser.id, // Sequelize uses integer id
    }));

    await Product.bulkCreate(sampleProducts, { validate: true });
    console.log('Products seeded successfully'.green);

    // Note: Orders are not seeded since no sample data is provided
    console.log('Data Imported!'.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    // Drop all tables
    await sequelize.sync({ force: true });
    console.log('Data Destroyed!'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`.red.inverse);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}