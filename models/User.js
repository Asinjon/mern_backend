import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    address: {
        type: String,
        default: ""
    },
    birth: {
        type: Date,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    country: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        default: ""
    },
    friends: {
        type: Array
    },
    gender: {
        type: String,
        default: ""
    },
    last_name: {
        type: String,
        default: ""
    },
    marital_status: {
        type: String,
        default: ""
    },
    password: {
        type: String,
        required: true 
    },
    post: {
        type: Array
    },
    profile_img: {
        type: String,
        default: "noAvatar-big.png"
    },
    invitations: {type: Array},
    state: {
        type: String,
        default: ""
    },
    username: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    }
});

const User = new mongoose.model("User", userSchema);

export default User;
