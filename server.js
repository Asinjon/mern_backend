import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotEnv from "dotenv";
import http from "http";
import {Server} from "socket.io";
import multer from "multer";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import {v4} from "uuid";
import userRoute from "./routes/user.js";
import profileRoutes from "./routes/profile.js";
import conversationRoutes from "./routes/conversations.js";
import messageRoutes from "./routes/messages.js";
import postRoutes from "./routes/post.js";
import commmentRoutes from "./routes/comments.js";
import User from "./models/User.js";
import commentRoutes from "./routes/comments.js";
import UserData from "./models/UserData.js";
dotEnv.config();

const app = express();
const httpserver = http.createServer(app);
const io = new Server(httpserver, {
  cors: {
    origin: [process.env.frontend_url,"http://localhost:3000/"],
  }
});

const fileStorageEngine = multer.diskStorage({
  destination: (request, file, callback) => {
    console.log("destination in fileStorageEngine");
    callback(null, "./public/users");
  },
  filename: (request, file, callback) => {
    console.log("filename in fileStorageEngine");
    callback(null, Date.now() + "_" + file.originalname);
  }
});//when function upload starts it will work
const upload = multer({storage: fileStorageEngine});

const postStorage = multer.diskStorage({
  destination: (request, file, callback) => {
    console.log("destination in postStorageEngine");
    callback(null, "./public/posts");
  },
  filename: (request, file, callback) => {
    console.log("filename in postStorageEngine");
    callback(null, Date.now() + "-" + file.originalname);
  }
});
const uploadPost = multer({storage: postStorage});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const corsOptions ={
  origin: process.env.frontend_url,
  credentials: true,            //access-contol-allow-credentials:true
  optionSuccessStatus: 200
}
app.use(cors(corsOptions));
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(
  session({
    secret: "supersecret difficult to guess string",
    cookie: { httpOnly: true, secure: false },
    resave: false,
    saveUninitialized: false
  })
);
app.use(express.static("public"));

app.post("/single", upload.single("image"), async (request, response) => {
  console.log("/single");
  const {userID, userDataId} = request.body;
  try {
    const newUser = await User.findOneAndUpdate({_id: userID}, {profile_img: request.file.filename}, {
      returnOriginal: false
    });
    const newUserData = await UserData.findByIdAndUpdate(userDataId, {$set: {data: newUser}}, {new: true});
    console.log("newUser:", newUser);
    console.log("newUserData:", newUserData);
    response.send({uploaded: true, user: newUser, userDataId: newUserData._id});
  } catch (error) {
    console.log("error in /single:", error);
  }
});

app.post("/post", uploadPost.single("postImg"), (request, response) => {
  console.log("/post while uploading image for post");
  console.log("request.file:", request.file);
  request.file.filename ? response.status(200).json({imgName: request.file.filename}) : response.status(404).send("Image did not uploaded to the server");
});

app.use("/api/auth", userRoute);
app.use("/api/submit", profileRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);

app.post("/userdata", async (req, res) => {
  const users = await UserData.find({});
  res.json(users);
});

let users = [];

const addUser = (userId, socketId) => {
  !users.some(user => user.userId === userId) && users.push({userId, socketId});
}
const removeUser = (socketId) => {
  users = users.filter(user => user.socketId !== socketId);
}
const getUser = (userId) => {
  return users.find(user => user.userId === userId);
}
io.on("connection", socket => {
  socket.on("addUser", userId => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  socket.on("sendMessage", ({senderId, receiverId, text}) => {
    console.log("users: " + JSON.stringify(users));
    const user = getUser(receiverId);
    io.to(user?.socketId).emit("getMessage", {senderId, text});
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

const port = process.env.PORT || 4000;

mongoose.connect(
    process.env.mongo_url,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => {
      httpserver.listen(port, () => console.log('listening on port ' + port));
    }
  );
