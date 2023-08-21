const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

// mongodb connected

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.stpdj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const eFoodCollection = client.db("eFoodDb").collection("eFoodData");
    const foodReviewsCollection = client.db("eFoodDb").collection("ratings");
    const foodCartCollection = client.db("eFoodDb").collection("cart");

    app.get("/menu", async (req, res) => {
      const result = await eFoodCollection.find().toArray();
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const result = await foodReviewsCollection.find().toArray();
      res.send(result);
    });

    app.post("/cart", async (req, res) => {
      const cart = req.body;

      const result = await foodCartCollection.insertOne(cart);
      res.send(result);
    });

    app.get("/cart", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return [];
      }
      const query = { email: email };
      const result = await foodCartCollection.find(query).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// all routes below
app.get("/", (req, res) => {
  res.send("E-Food server is running");
});

app.listen(port, () => {
  console.log(`E-Food server is running at ${port}`);
});
