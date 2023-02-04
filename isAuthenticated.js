const jwt = require("jsonwebtoken");

module.exports = async function isAuthenticated(req, res, next) {   
    //console.log(req.headers)

    if (req.headers["authorization"]) {
        const token = req.headers["authorization"].split(" ")[1];
        jwt.verify(token, "secret", (err, user) => {
        if (err) {
            return res.json({ message: err });
        } else {
            req.user = user;
            next();
        }
        });
    }else{
        return res.json({ message: "Please provide Security Token" });
    }
    

};
