import { Sequelize } from "sequelize";
import "dotenv/config";

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    port: process.env.DB_PORT || 3306,
    logging: false,
  }
);

// Function to connect to the database
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL Database connected!");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// Export as **named exports**
export { connectDB, sequelize };
