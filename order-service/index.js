const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 9091;
const mongoose = require("mongoose");
const Order = require("./Order");
const amqp = require("amqplib");
const isAuthenticated = require("../isAuthenticated");

var channel, connection;

const username = "bose-biswanath";
const password = "QazWsx@3148";
const cluster = "cluster0.nzfc7hr";
const dbname = "Rabitmq-Microservice-order-service";

// mongoose.connect(
//     "mongodb://localhost:27017/Rabitmq-Microservice-order-service",
//     {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//     },
//     () => {
//         console.log(`Order-Service DB Connected`);
//     }
// );

mongoose.connect(
    `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbname}?retryWrites=true&w=majority`, 
    {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    },
    () => {
        console.log(`Order-Service DB Connected`);
    }
  );

app.use(express.json());

function createOrder(products, userEmail) {
    let total = 0;
    for (let t = 0; t < products.length; ++t) {
        total += products[t].price;
    }
    const newOrder = new Order({
        products,
        user: userEmail,
        total_price: total,
    });
    newOrder.save();
    return newOrder;
}

async function connect() {
    //const amqpServer = "amqp://localhost:5672";
    const amqpServer = "amqps://ovohfrfb:7DytnYgqfWoDPl3QMGFoh1f0YU3fXEQ2@shrimp.rmq.cloudamqp.com/ovohfrfb";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER");
}
connect().then(() => {
    channel.consume("ORDER", (data) => {
        console.log("Consuming ORDER service");
        const { products, userEmail } = JSON.parse(data.content);
        const newOrder = createOrder(products, userEmail);
        channel.ack(data);
        channel.sendToQueue(
            "PRODUCT",
            Buffer.from(JSON.stringify({ newOrder }))
        );
    });
});

app.listen(PORT, () => {
    console.log(`Order-Service at ${PORT}`);
});
