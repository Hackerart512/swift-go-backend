// src/data-source.ts
import { DataSource } from "typeorm";
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD, // <-- This should be a string!
  database: process.env.DB_DATABASE,
  entities: [__dirname + "/modules/**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/migrations/*{.ts,.js}"],
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

console.log('DB_PASSWORD:', process.env.DB_PASSWORD, typeof process.env.DB_PASSWORD);
