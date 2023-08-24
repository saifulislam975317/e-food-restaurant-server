const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

// mongodb connected

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    const menuCollection = client.db("eFoodDb").collection("eFoodData");
    const foodReviewsCollection = client.db("eFoodDb").collection("ratings");
    const foodCartCollection = client.db("eFoodDb").collection("cart");
    const userCollection = client.db("eFoodDb").collection("users");

    // Middleware verify jwt token

    const verifyJwt = (req, res, next) => {
      const authToken = req.headers.authorization;

      if (!authToken) {
        return res
          .status(401)
          .send({ error: true, message: "unauthorized access" });
      }
      const token = authToken.split(" ")[1];

      jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
          return res.status(403).send({ message: "forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // jwt api

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      res.send({ token });
    });
    // menu related api

    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    app.post("/menu", verifyJwt, async (req, res) => {
      const newItem = req.body;
      const result = await menuCollection.insertOne(newItem);
      res.send(result);
    });

    // delete menu item api
    app.delete("/menu/:id", async (req, res) => {
      const id = req.params.id;
      const filterMenu = { _id: new ObjectId(id) };
      const result = await menuCollection.deleteOne(filterMenu);
      res.send(result);
    });

    app.get("/menu/:id", async (req, res) => {
      const id = req.params.id;

      const filterMenu = { _id: new ObjectId(id) };
      const result = await menuCollection.findOne(filterMenu);
      res.send(result);
    });

    app.put("/menu/:id", async (req, res) => {
      const id = req.params.id;
      console.log("update id", id);
      const updateItems = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updateItems.name,
          category: updateItems.category,
          price: updateItems.price,
          recipe: updateItems.recipe,
          image: updateItems.image,
        },
      };
      const result = await menuCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
    // reviews related api
    app.get("/reviews", async (req, res) => {
      const result = await foodReviewsCollection.find().toArray();
      res.send(result);
    });
    // cart related api

    app.post("/cart", async (req, res) => {
      const cart = req.body;

      const result = await foodCartCollection.insertOne(cart);
      res.send(result);
    });

    app.get("/cart/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      if (!email) {
        return [];
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden access" });
      }
      const query = { email: email };
      const result = await foodCartCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/cart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log("cart query", query);
      const result = await foodCartCollection.deleteOne(query);
      res.send(result);
    });

    // user information save to database
    app.post("/users", async (req, res) => {
      const user = req.body;

      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exits" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.delete("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/users/admin/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;

      const decodedEmail = req.decoded.email;

      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
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
