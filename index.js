import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

async function connectToMongoDB() {
  await client.connect();
  console.log("You successfully connected to MongoDB!");
  return client;
}

const mongoClient = await connectToMongoDB();

const db = mongoClient.db("kindora");
const eventsCollection = db.collection("events");
const joinEventCollection = db.collection("joinevent");
const userCollection = db.collection("user");
const galleryCollection = db.collection("gallery");
const messagesCollection = db.collection("messages");

app.get("/", (req, res) => {
  res.send({ message: "Server is running successfully" });
});

// create event
app.post("/create-event", async (req, res) => {
  try {
    const { _id, ...data } = req.body;
    const result = await eventsCollection.insertOne(data);
    res.status(201).send(result);
  } catch {
    res.status(500).send({ message: "Failed to create event" });
  }
});

// get event
app.get("/events", async (req, res) => {
  const result = await eventsCollection.find({}).toArray();
  res.send(result);
});

// create event id
app.get("/events/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid Event ID format" });
  }
  const result = await eventsCollection.findOne({ _id: new ObjectId(id) });
  if (!result) {
    return res.status(404).send({ message: "Event not found" });
  }
  res.send(result);
});

// Edit event details page
app.patch("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid Event ID format" });
    }
    const { _id, ...updatedData } = req.body;
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData },
    );
    res.send(result);
  } catch {
    res.status(500).send({ message: "Failed to update event" });
  }
});

// Delete event details page
app.delete("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid Event ID format" });
    }
    const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });
    res.json(result);
  } catch {
    res.status(500).send({ message: "Failed to delete event" });
  }
});

// join event
app.post("/joinevent", async (req, res) => {
  const {
    eventId,
    email,
    title,
    type,
    date,
    location,
    image,
    description,
    organizerEmail,
  } = req.body;
  const existing = await joinEventCollection.findOne({ eventId, email });
  if (existing) {
    return res.status(409).json({ message: "Already joined" });
  }
  const result = await joinEventCollection.insertOne({
    eventId,
    email,
    title,
    type,
    date,
    location,
    image,
    description,
    organizerEmail,
  });
  res.send(result);
});

// delete join event
app.delete("/joinevent", async (req, res) => {
  const { eventId, email } = req.body;
  const result = await joinEventCollection.deleteOne({ eventId, email });
  res.json(result);
});

app.get("/joinevent/check", async (req, res) => {
  const { eventId, email } = req.query;
  const existing = await joinEventCollection.findOne({ eventId, email });
  res.json({ joined: !!existing });
});

// joined event
app.get("/joined-events/:email", async (req, res) => {
  const { email } = req.params;
  const result = await joinEventCollection.find({ email }).toArray();
  res.send(result);
});

// manage event
app.get("/events/organizer/:email", async (req, res) => {
  const { email } = req.params;

  const result = await eventsCollection
    .find({
      organizerEmail: email,
    })
    .toArray();

  res.send(result);
});

// upcoming events for homepage
app.get("/homepage-event", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const result = await eventsCollection
    .find({ date: { $gte: today } })
    .sort({ date: 1 })
    .limit(6)
    .toArray();
  res.send(result);
});

// past events for homepage
app.get("/past-events", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const result = await eventsCollection
    .find({ date: { $lt: today } })
    .sort({ date: -1 })
    .limit(6)
    .toArray();

  res.send(result);
});

// Top volunteers
app.get("/top-volunteers", async (req, res) => {
  const result = await joinEventCollection
    .aggregate([
      {
        $group: {
          _id: "$email",
          eventsJoined: { $sum: 1 },
        },
      },
      { $sort: { eventsJoined: -1 } },
      { $limit: 4 },
    ])
    .toArray();

  const volunteers = await Promise.all(
    result.map(async (person) => {
      const user = await userCollection.findOne(
        { email: person._id },
        { projection: { name: 1, image: 1 } },
      );
      return {
        email: person._id,
        name: user?.name,
        image: user?.image,
        eventsJoined: person.eventsJoined,
      };
    }),
  );
  res.send(volunteers);
});

// Gallery page
app.get("/gallery", async (req, res) => {
  const result = await galleryCollection.find({}).toArray();
  res.send(result);
});

app.post("/gallery", async (req, res) => {
  const data = req.body;
  const result = await galleryCollection.insertOne(data);
  res.send(result);
});


// Contact us message
app.post("/messages", async (req, res) => {
    const message = req.body;
    const result = await messagesCollection.insertOne(message);
    res.send(result);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
