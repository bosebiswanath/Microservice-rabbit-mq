const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 8080;
const mongoose = require("mongoose");
const Product = require("./Product");
const jwt = require("jsonwebtoken");
const amqp = require("amqplib");
const isAuthenticated = require("../isAuthenticated");
var order;

var channel, connection;

const username = "bose-biswanath";
const password = "QazWsx@3148";
const cluster = "cluster0.nzfc7hr";
const dbname = "Rabitmq-Microservice-product-service";

app.use(express.json());

mongoose.connect(
    `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbname}?retryWrites=true&w=majority`, 
    {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    },
    () => {
        console.log(`Product-Service DB Connected`);
    }
  );


// mongoose.connect(
//     "mongodb://localhost:27017/Rabitmq-Microservice-product-service",
//     {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//     },
//     () => {
//         console.log(`Product-Service DB Connected`);
//     }
// );

async function connect() {
    //const amqpServer = "amqp://localhost:5672";
    const amqpServer = "amqps://ovohfrfb:7DytnYgqfWoDPl3QMGFoh1f0YU3fXEQ2@shrimp.rmq.cloudamqp.com/ovohfrfb";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT");
}
connect();

app.post("/product/create", isAuthenticated, async (req, res) => {
    const { name, description, price } = req.body;
    if (name && description && price ) {
        const newProduct = new Product({
            name,
            description,
            price,
        });
        newProduct.save();
        return res.json(newProduct);
    }else{
        return res.json({ message: "Product Name/Description/Price is missed" });
    }
});

app.post("/product/buy", isAuthenticated, async (req, res) => {
    const { ids } = req.body;
    if (ids) {
        const products = await Product.find({ _id: { $in: ids } });
        channel.sendToQueue(
            "ORDER",
            Buffer.from(
                JSON.stringify({
                    products,
                    userEmail: req.user.email,
                })
            )
        );
        channel.consume("PRODUCT", (data) => {
            console.log("Consuming PRODUCT service");
            order = JSON.parse(data.content);
        });
        return res.json(order);
    }else{
        return res.json({ message: "Product id's is required" });

    }
});

app.listen(PORT, () => {
    console.log(`Product-Service at ${PORT}`);
});
