import express from "express";
import User from "../models/User.js";
import UserVerification from "../models/UserVerification.js";
import UserData from "../models/UserData.js";
import bcryptjs from "bcryptjs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import {v4} from "uuid";
import { log } from "console";

dotenv.config();

console.log("env.email:", process.env.auth_email);

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.auth_email,
        pass: process.env.auth_password
    }
});

transporter.verify((error, success) => {
    if (error) console.log(error);
    else console.log("Success:", success);
});

const userRoutes = express.Router();

userRoutes.post("/signup", (request, response) => {
    console.log("signup");
    let {username, email, password} = request.body;
    let data = {inputError: true, username: "", email: "", password: ""};
    if (username == "" || email == "" || password == "") {
        if (username === "") data.username = "Username is empty!";
        if (email === "") data.email = "Email is empty!";
        if (password === "") data.password = "Password is empty!";
        response.send(data);
    }else {
            User.find({email})
            .then(result => {
                console.log("result in signup:", result);
                if (result.length) {
                    console.log("IF WORKED");
                    if (username.length < 8) {
                        data.username = "Username must be at least 8 characters!";
                    } else {
                        data.username = "";
                    }
                    data.email = "User with provided email already exists!";
                    data.password = "";
                    response.send(data);
                } else {
                    console.log("ELSE WORKED");
                    const saltRound = 10;
                    bcryptjs.hash(password, saltRound)
                        .then(hashedPass => {
                            const newUser = new User({
                                email,
                                username,
                                password: hashedPass
                            });
                            newUser.save()
                                .then(result => {
                                    sendVerificationEmail(result, response, data);
                                })
                                .catch(error => {
                                    console.log("error::", error);
                                    data = {inputError: false, 
                                            username: "",
                                            email: "",
                                            password: "",
                                            message: "An error occured while saving user"
                                        };
                                    response.send(data);
                                });
                        })
                        .catch(error => {
                            console.log("error::", error);
                            data = {inputError: false, 
                                username: "",
                                email: "",
                                password: "",
                                message: "An error occured while hashing password"
                            };
                            response.send(data);
                        }); 
                }
            })
            .catch(error => {
                console.log("error::", error);
                data = {inputError: false, 
                        username: "",
                        email: "",
                        password: "",
                        message: "An error occured while checking for existing user"
                    };
                response.send(data);
            });
    }
});
userRoutes.post("/signin", async (request, response) => {
    let {email, userDataId, password} = request.body;
    console.log("email:", email);
    console.log("password:", password);
    email = email.trim();
    password = password.trim();
    let data = {inputError: false, verifyError: false, email:"", password:"", message:"", user:null, isLogged: false};
    if (email === "" || password === "") {
        if (email === "") data.email = "Email is empty!";
        if (password === "") data.password = "Password is empty!";
        data.inputError = true;
        response.json(data);
    }
    else {
        User.find({email})
        .then(result => {
            if (result.length) {
                if (!result[0].verified) {
                    data = {
                        inputError: false,
                        verifyError: true,
                        email: "",
                        password: "",
                        message: "You did not verify your email!",
                        user: null,
                        isLogged: false
                    };
                    response.json(data);
                }else {
                    const hashedPass = result[0].password;
                    bcryptjs.compare(password, hashedPass)
                        .then(async (dataCompared) => {
                            if (dataCompared) {
                                console.log("password are same");
                                data.verifyError = false;
                                data.message = "";
                                data.user = result[0];
                                data.isLogged = true;
                                console.log("USER has successfully logged in!");
                                console.log("userDataId in /signin/:", userDataId);
                                try {
                                    const userDatas = await UserData.findById(userDataId);
                                } catch (e) {
                                    const userData = new UserData({data: result[0]});
                                    const savedUserData = await userData.save();
                                    console.log("savedUserData while signin:", savedUserData);
                                    return response.json({data, userDataId: savedUserData._id});
                                }
                                console.log("userDatas in /signin/:", userDatas);
                                if (Object.keys(userDatas[0].data).length === 0) {
                                    const newUserData = await UserData.findByIdAndUpdate(userDataId, {$set: {data: result[0]}}, {new: true});
                                    console.log("newUserData while signin:", newUserData);
                                    response.json({data, userDataId: newUserData._id});
                                }
                                else {
                                    response.json({data, userDataId: userDatas._id});
                                }
                            } else {
                                console.log("password are not equal");
                                data.verifyError = true;
                                data.message = "INVALID password entered!";
                                data.user = null;
                                data.isLogged = false;
                                response.json(data);
                            }
                        })
                        .catch(error => {
                            console.log("error:", error);
                            data.verifyError = true;
                            data.message = "An error occured while comparing passwords!";
                            data.user = null;
                            data.isLogged = false;
                            response.json(data);
                        });
                }
            }else {
                data.verifyError = true;
                data.message = "INVALID email entered!";
                data.user = null;
                data.isLogged = false;
                response.json(data);
            }
        })
        .catch(error => {
            console.log("error::", error);
            data.verifyError = true;
            data.message = "An error occured while checking for existing user!";
            data.user = null;
            data.isLogged = false;
            response.json(data);
        });
    }
});

userRoutes.post("/signin/user", async (request, response) => {
    console.log("req.body.userDataId in /signin/user:", request.body.userDataId);
    try {
        const savedUserData = await UserData.findById(request.body.userDataId);
    } catch (e) {
        console.log("e.message in /signin/user:", e.message);
        return response.send({isLogged: false});
    }
    console.log("savedUserData in /signin/user:", savedUserData);
    if (savedUserData.length === 0) {
        response.send({isLogged: false});
    } else {
        console.log("savedUserData in get(signin):", savedUserData);
        if (savedUserData !== null && Object.keys(savedUserData.data).length > 0) {
            response.send({user: savedUserData.data, isLogged: true, userDataId: savedUserData._id});
        } else {
            response.send({isLogged: false});
        }
    }
});

userRoutes.post("/signout", async (request, response) => {
    console.log("user is signing out");
    const savedUserData = await UserData.findByIdAndUpdate(request.body.userDataId, {data: {}}, {new: true});
    if (!Object.keys(savedUserData.data).length > 0) {
        response.send({signout: true});
    } else {
        response.send({signout: false});
    }
});
const sendVerificationEmail = ({_id, email}, response, data) => {
    const currentUrl = "https://mern-project-backend.onrender.com";
    const uniqueString = v4();
    const mailOptions = {
        from: process.env.auth_email,
        to: email,
        subject: "Verify your email",
        html: `<p>Verify your email address to complete the sign up and login into your account</p>
        <p>This link <b>expires in 6 hours</b></p>
        <p>Press <a href="${currentUrl + "/api/auth/verify/" + _id + "/" + uniqueString}">here</a> to proceed</p>`
    };
    console.log("mailOptions:", mailOptions);
    const saltRound = 10;
    bcryptjs.hash(uniqueString, saltRound)
        .then(hashedUniqueString => {
            console.log("after .then(hashedUniqueString =>");
            const newVerification = new UserVerification({
                userId: _id,
                uniqueString: hashedUniqueString,
                createdAt: Date.now(),
                expiredAt: Date.now() + 21600000
            });
            newVerification.save()
                .then(() => {
                    console.log("after newVerification.save.then()");
                    transporter.sendMail(mailOptions)
                        .then(() => {
                            // response.redirect("http://localhost:3000/confirm");
                            console.log("Verification email sent!");
                        })
                        .catch(error => {
                            console.log("error::", error);
                            data = {inputError: false, 
                                    username: "",
                                    email: "",
                                    password: "",
                                    message: "Verification email failed"
                            };
                            response.send(data);
                        });
                })
                .catch(error => {
                    console.log("error::", error);
                    data = {inputError: false, 
                            username: "",
                            email: "",
                            password: "",
                            message: "Couldn't save verification email data"
                    };
                    response.send(data);
                });
        })
        .catch(error => {
            console.log("error::", error);
            data = {inputError: false, 
                    username: "",
                    email: "",
                    password: "",
                    message: "An error occured while hashing email data"
            };
            response.send(data);
        });
}

userRoutes.get("/verify/:userId/:uniqueString", (request, response) => {
    let {userId, uniqueString} = request.params;
    console.log("userId:", userId);
    console.log("uniqueString:", uniqueString);
    UserVerification.find({userId})
        .then(result => {
            console.log("result:", result);
            if (result.length > 0) {
                console.log("if (result.length > 0) {");
                const expiresAt = result[0].expiresAt;
                const hashUniqueString = result[0].uniqueString;
                if (expiresAt < Date.now()) {
                    console.log("if (expiresAt < Date.now()) {");
                    UserVerification.deleteOne({userId})
                        .then(result => {
                            User.deleteOne({_id: userId})
                                .then(() => {
                                    console.log(("error::", error));
                                    response.redirect("../../verified/Link has expired. Please sign up again");
                                })
                                .catch(error => {
                                    console.log(("error::", error));
                                    response.redirect("../../verified/Clearing user with expired unique string failed");
                                });
                        })
                        .catch(error => {
                            console.log(("error::", error));
                            response.redirect("../../verified/An error occured while clearing expired user verification record");
                        });
                } else {
                    console.log("else in verify");
                    bcryptjs.compare(uniqueString, hashUniqueString)
                        .then(result => {
                            console.log("result", result);
                            if (result) {
                                User.updateOne({_id: userId}, {$set: {verified: true}})
                                    .then(() => {
                                        UserVerification.deleteOne({userId})
                                            .then(() => {
                                                console.log("in deleting verification");
                                                response.redirect(`${process.env.frontend_url}/signin`);
                                            })
                                            .catch(error => {
                                                console.log("error::", error);
                                                response.redirect("../../verified/An error occured while finalizing successful verification.");
                                            });
                                    })
                                    .catch(error => {
                                        console.log("error::", error);
                                        response.redirect("../../verified/An error occured while updating user record to show verified");    
                                    });
                            } else {
                                response.redirect("../../verified/Invalid varification details passed. Check your inbox");
                            }
                        })
                        .catch(error => {
                            console.log("error::", error);
                            response.redirect("../../verified/An error occured while comparing unique strings");
                        });
                }
            } else {
                response.redirect("../../verified/Account record doesn't exist or has been verified already. Please sign up or log in");
            }
        })
        .catch(error => {
            console.log("error::", error);
            response.redirect("../../verified/An error occured while checking for existing user verification record");
        });
});

userRoutes.get("/verified/:message", (request, response) => {
    console.log("message:", request.params.message);
    response.render("hello", {message: request.params.message});
});

userRoutes.get("/:userId", async (request, response) => {
    const userId = request.params.userId;
    try {
        const user = await User.findById(userId);
        const {password, updatedAt, ...data} = user._doc;
        response.status(200).json(data);
    } catch (error) {
        response.status(500).json(error);
    }
});

userRoutes.post("/change-password", async (request, response) => {
    try {
        // const isExistUser = await User.findById(request.body.id);
        // const hashedPassword = await bcryptjs.hash(request.body.current, 10);
        // console.log("hashedPassword:", hashedPassword);
        // const compared = await bcryptjs.compare(isExistUser.password, hashedPassword);
        // console.log("compared:", compared);
        // if (compared) {
        //     const saltedPassword = bcryptjs.hash(request.body.new, 10);
        //     if (saltedPassword) {
        //         const user = await User.findByIdAndUpdate(request.body.id, {
        //             $set: {password: saltedPassword}
        //         });
        //         response.send({user, error: false});
        //     } else {
        //         response.send({error: false});
        //     }
        // }
        const saltedPassword = await bcryptjs.hash(request.body.new, 10);
            if (saltedPassword) {
                const user = await User.findByIdAndUpdate(request.body.id, {
                    $set: {password: saltedPassword}
                }, {new: true});
                response.send({user, error: false});
            } else {
                response.send({error: false});
            }
    } catch (error) {
        console.log("eror", error);
    }
});

userRoutes.post("/", async (request, response) => {
    try {
        const users = await User.find({});
        response.send(users);
    } catch (error) {
        console.log("error:", error);
    }
});

export default userRoutes;
