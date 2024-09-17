import express, { json, urlencoded } from 'express';
import db from "./config/database.js";
import configureProductsRouter from './routes/products.router.js';
import configureCartsRouter from './routes/carts.router.js';
import { engine } from "express-handlebars";
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import viewsRouter from './routes/views.router.js';
import userRouter from './routes/user.router.js';
import authRouter from "./routes/auth.router.js";
import passport from "./config/passport.js";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
  })
);
app.set("view engine", "hbs");
app.set("views", "./src/views");

// Middlewares 
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(passport.initialize());



// HTTP
const httpServer = http.createServer(app);

// Socket.IO
const io = new Server(httpServer);


// Routers
app.use("/api/carts", configureCartsRouter(io));
app.use("/api/products", configureProductsRouter(io));
app.use("/api/users", userRouter);
app.use("/", viewsRouter);
app.use("/auth", authRouter);


httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});