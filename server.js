const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const Stripe_Key = process.env.STRIPE_KEY;
const Price_Key = process.env.Price_Key;
const stripe = require("stripe")(Stripe_Key);
const Server_Url = process.env.Server_Url;
const mongoose = require("mongoose");
const TEST = require("./models/user");

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => console.log(err));

app.post("/payment", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: "auto",
      customer_email: req.body.email,
      payment_method_types: ["card", "cashapp", "us_bank_account"],
      line_items: [
        {
          price: Price_Key,
          // For metered billing, do not pass quantity
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${Server_Url}/paymentsucc`,
      cancel_url: `${Server_Url}/paymenterror`,
    });

    res.status(201).json({ url: session });
  } catch (err) {
    res.status(500).json({ err });
  }
});

app.get("/paymentsucc", async (req, res) => {
  const id = "64c0ea794630be7b7ca858c6";
  console.log("success on");
  const ress = await TEST.findByIdAndUpdate(
    { _id: id },
    {
      $set: {
        subscribe: true,
      },
    },
    {
      new: true,
    }
  );
  res.redirect("https://host.easintanvir.com/success");
});
app.get("/paymenterror", async (req, res) => {
  res.redirect("https://host.easintanvir.com/error");
});

const server = app.listen(process.env.PORT, () => {
  console.log("srver running");
});
const io = require("socket.io")(server, {
  cors: {
    origin: "https://host.easintanvir.com",
  },
});
io.on("connection", (socket) => {
  console.log("client connected");
});

app.post("/test", async (req, res) => {
  const data2 = {
    name: "My name is Easin",
  };

  console.log("I am on test");
  try {
    const data = await TEST.create(req.body);
    // io.emit("message", { delivery: data });

    res.status(200).json(data);
  } catch (err) {
    console.log(err);
  }
});

//start from here

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret =
  "whsec_ec50b28f29284c390bb90b0e1069671ab625907c58d259bda112c02e624b0847";

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (request, response) => {
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
        const customerSubscriptionCreated = event.data.object;
        io.emit("message", { event: customerSubscriptionCreated });
        // Then define and call a function to handle the event customer.subscription.created
        break;
      case "customer.subscription.deleted":
        const customerSubscriptionDeleted = event.data.object;
        io.emit("message", { event: customerSubscriptionDeleted });
        break;
      case "customer.subscription.updated":
        const customerSubscriptionUpdated = event.data.object;
        io.emit("message", { event: customerSubscriptionUpdated });
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.sendStatus(200);
  }
);
