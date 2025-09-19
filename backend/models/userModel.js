import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID, // or INTEGER
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    unique: true,
  },
  password: DataTypes.STRING,
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});

export { User };
