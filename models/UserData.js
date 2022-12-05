import mongoose from "mongoose";

const userDataSchema = new mongoose.Schema({
    data: {type: Object}
}, {timestamps: true});

const UserData = new mongoose.model("UserData", userDataSchema);

export default UserData;