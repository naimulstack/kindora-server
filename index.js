import express from "express";
import { MongoClient } from 'mongodb';
import 'dotenv/config'
import cors from "cors";


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB();

const db = mongoClient.db("kindora");
const eventsCollection = db.collection("events");

// http://localhost:5000/create-event
app.post("/create-event", async (req, res) => {
    const data = req.body;
    const result = await eventsCollection.insertOne(data);
    console.log(result);
    res.send(result);
})

// http://localhost:5000/events

app.get("/events", async (req, res) => {
    const result = await eventsCollection.find({}).toArray();
    res.send(result);
});


app.get("/", (req, res) => {
  res.send({message: "Server is running successfully"});
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})

