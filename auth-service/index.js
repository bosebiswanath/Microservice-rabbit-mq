const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 7071;
const mongoose = require("mongoose");
const User = require("./User");
const jwt = require("jsonwebtoken");

const username = "bose-biswanath";
const password = "QazWsx@3148";
const cluster = "cluster0.nzfc7hr";
const dbname = "Rabitmq-Microservice-auth-service";

mongoose.connect(
    `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbname}?retryWrites=true&w=majority`, 
    {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    },
    () => {
        console.log(`Auth-Service DB Connected`);
    }
  );

// mongoose.connect(
//     "mongodb://localhost:27017/Rabitmq-Microservice-auth-service",
//     {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//     },
//     () => {
//         console.log(`Auth-Service DB Connected`);
//     }
// );

app.use(express.json());

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.json({ message: "User doesn't exist" });
    } else {
        if (password !== user.password) {
            return res.json({ message: "Password Incorrect" });
        }
        const payload = {
            email,
            name: user.name
        };
        jwt.sign(payload, "secret", (err, token) => {
            if (err) console.log(err);
            else return res.json({ token: token });
        });
    }
});

app.post("/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.json({ message: "User already exists" });
    } else {
        const newUser = new User({
            email,
            name,
            password,
        });
        newUser.save();
        return res.json(newUser);
    }
});

app.listen(PORT, () => {
    console.log(`Auth-Service at ${PORT}`);
});
