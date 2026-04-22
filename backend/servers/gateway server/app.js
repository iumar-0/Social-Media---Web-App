import "dotenv/config";
import express from "express";
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import createHttpError from "http-errors";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { mainRouter } from './routes/mainRouter.js';
import { connectDB } from "./config/db.js";
import { registerSocket } from "./socket/socket.js";

connectDB();

const app = express();
const server = http.createServer(app);


app.use(cookieParser());
// app.use(morgan("dev"));
app.use(cors({
  origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));


const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/', mainRouter);


app.use(function (req, res, next) {
  next(createHttpError(404, "No router found"));
});

// error handler
app.use((err, req, res, next) => {
  console.log(err)
  return res.status(err.status || 500).json({
    success: false,
    message: err.message,
    data: null,
    errors: err || null,
    meta: null
  });
});

app.set("io", io);

registerSocket(io);

server.listen(3000, () => {
  console.log(`\nThe Websocket is listening on 3000 Port...`);
})

app.listen(3000, () => {
  console.log(`\nThe server is listening on 3000 Port...`);
});