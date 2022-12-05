import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    uniqueString: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    expiredAt: {
        type: Date,
        required: true
    }
});

const verification = new mongoose.model("UserVerification", verificationSchema);

export default verification;