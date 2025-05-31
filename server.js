const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Expo } = require("expo-server-sdk");

const app = express();
app.use(bodyParser.json());
app.use(express.json());

app.use(
  cors({
    origin: ["https://areviewmarketing.com"],
    methods: ["POST, GET, PUT, DELETE"],
    credentials: true,
  })
);

// Initalize Expo SDK
let expo = new Expo();
// Endpoint to send push notifications
app.post("/send-notification", async (req, res) => {
  // check if the request body contains the required fields
  if (!req.body || !req.body.pushToken || !req.body.title || !req.body.body) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const { pushToken, title, body } = req.body;

  if (!Expo.isExpoPushToken(pushToken)) {
    return res.status(400).json({ error: "Invalid Expo push token" });
  }

  if (title.length > 100) {
    return res.status(400).json({ error: "Title is too long" });
  }
  if (body.length > 200) {
    return res.status(400).json({ error: "Body is too long" });
  }
  let messages = [];
  messages.push({
    to: pushToken,
    sound: "default",
    title: title,
    body: body,
    data: { withSome: "data" },
  });

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  try {
    for (let chunk of chunks) {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }
    return res.status(200).json({ success: true, tickets });
  } catch (error) {
    console.error("Error sending notifications:", error);
    return res.status(500).json({ error: "Failed to send notifications" });
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to the Expo Push Notification Server!");
});

const PORT = process.env.PORT || 8800;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
