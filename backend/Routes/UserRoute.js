const express = require("express");
const router = express.Router();
const User = require("../Modal/UserModal.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/createNewUser", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashPassword = await bcrypt.hash(password, 10);

        const emailExists = await User.findOne({ email: email });
        if (emailExists) {
            // console.log(emailExists);
            return res.status(400).json("Email already Exists");
        }

        const user = await User.create({ name, email, password: hashPassword });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "3d",
        });

        user.password = "";

        res.status(201).json({
            user,
            token,
        });
    } catch (error) {
        console.log("Error -> ", error);
        res.status(400).json(error);
    }
});

router.get("/getAllUser", async (req, res) => {
    try {
        // console.log("Getting Here user");
        const users = await User.find().select(
            "name email createdAt updatedAt chatGroups active"
        );
        console.log("user", users);

        res.status(200).json(users);
    } catch (error) {
        console.log("Error -> ", error);
        res.status(400).json(error);
    }
});

router.get("/getAllChatGroupOfAUser/:userId", async (req, res) => {
    try {
        // console.log("Getting Here user");
        const { userId } = req.params;
        const userDetails = await User.findById({_id: userId}).populate("chatGroups");
        console.log("user ----- ", userDetails);
        userDetails.password = "";

        res.status(200).json(userDetails);
    } catch (error) {
        console.log("Error -> ", error);
        res.status(400).json(error);
    }
});


router.post("/userLogin", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                status: "fail",
                message: "Email and Password should not be empty",
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "Email is not registered!",
            });
        }

        const verify = await bcrypt.compare(password, user.password);
        if (!verify) {
            return res.status(400).json({
                message: "Password is Incorrect!",
            });
        }

        user.password = "";

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "24h",
        });
        res.status(200).json({
            status: "success",
            user,
            token,
        });
    } catch (err) {
        res.status(500).json({
            error: err.message,
        });
    }
});

module.exports = router;
