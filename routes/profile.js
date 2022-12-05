import express from "express";
import User from "../models/User.js";
import UserVerification from "../models/UserVerification.js";
import UserData from "../models/UserData.js";
import dotenv from "dotenv";

dotenv.config();


const profileRoutes = express.Router();

profileRoutes.post("/", (request, response) => {
    const {user, ...data} = request.body.datas;
    console.log("gender:", data.gender);
    console.log("data in updating profile:", data);
    let firstName = "";
    let lastName = "";
    let userName = "";
    let birth = "";
    let address = "";
    const id = user._id;
    console.log(data.birth === "" || data.address === "" ? "Adress is empty" : "Adress is not empty");
    if (data.firstName === "" ||
        data.lastName === "" ||
        data.userName === "" ||
        data.birth === "" ||
        data.address === "") {
            data.firstName === "" ? firstName = user.first_name : firstName = data.firstName;
            data.lastName === "" ? lastName = user.last_name : lastName = data.lastName;
            data.userName === "" ? userName = user.username : userName = data.userName;
            data.birth === "" ? birth = user.birth : birth = data.birth;
            data.address === "" ? address = user.address : address = data.address;
    } else {
        firstName = data.firstName;
        lastName = data.lastName;
        userName = data.userName;
        birth = data.birth;
        address = data.address;
    }
    User.findByIdAndUpdate(id, {
        $set: {
            first_name: firstName,
            last_name: lastName,
            username: userName,
            gender: data.gender,
            marital_status: data.status,
            age: data.age,
            city: data.city,
            country: data.country,
            state: data.state,
            birth: birth,
            address: address
        }
    }, {new: true}, async (error, user) => {
        console.log("error in submit:", error);
        console.log("user in submit in updating:", user);
        if (!error) {
            const newUserData = await UserData.findByIdAndUpdate(request.body.userDataId, {$set: {data: user}}, {new: true});
            response.send({user, userDataId: newUserData._id})
        }
    });
});

profileRoutes.post("/friend", async (req, res) => {
    const {friendId, userId, userDataId} = req.body;
    try {
        const oldUser = await User.findById(userId);
        if (!oldUser.friends.includes(friendId)) {
            const newUser = await User.findByIdAndUpdate(userId, {
                "$push": {"friends": friendId},
                "$pull": {"invitations": friendId}
            }, {"new": true, "upsert": true});
            console.log("newUser:", JSON.stringify(newUser));
            if (newUser) {
                const newFriend = await User.findByIdAndUpdate(friendId, {
                    "$push": {"friends": userId},
                    "$pull": {"invitations": userId}
                }, {"new": true, "upsert": true});
            }
            const savedUserData = await UserData.findByIdAndUpdate(userDataId, {$set: {data: newUser}});
            console.log("savedUser in profile.js:", JSON.stringify(savedUserData));
            res.send(newUser);
        }
    } catch (error) {
        console.log("error:", error);
    }
});

profileRoutes.post("/invite", async (request, response) => {
    const {id, userId} = request.body;
    try {
        const oldUser = await User.findById(id);
        if (oldUser.invitations.includes(userId)) response.send({message: "User already has been invited!"});
        else {
            const newUser = await User.findByIdAndUpdate(id, { "$push": { "invitations": userId } },
            { "new": true, "upsert": true });
            if (Object.keys(newUser).length > 0) response.send({message: "Invited!"});
            else response.send({message: "Wasn't invited! Please try again later"});
        }
    } catch (error) {
        console.log("error:", error);
    }
});


export default profileRoutes;