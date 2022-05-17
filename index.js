const express = require("express");
const app = express(); // create app by calling express()
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const port = process.env.PORT || 5000;

require("dotenv").config();

// use middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yffpy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    //   console.log("mongodb connected")
    const serviceCollection = client.db("doctorDB").collection("services");
    const appointmentCollection = client.db("doctorDB").collection("appointments");

    // Get all services
    // http://localhost:5000/service
    app.get("/service", async (req, res) => {
      const query = req.query;
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // Post appointment
    // http://localhost:5000/appointment
    /* 
    post method এর ভিতর query চালায় find করে সেই result এর উপর depend করে new item add হবে।
    */
    app.post("/appointment", async (req, res) => {
      const appointment = req.body;
      const query = {treatment: appointment.treatment, date: appointment.date, patientName: appointment.patientName}
      const exists = await appointmentCollection.findOne(query)
      if(exists){
        return res.send({success: false, appointment: exists})
      }
      const result = await appointmentCollection.insertOne(appointment);
      res.send({success: true, result});
    });
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

// for testing
app.get("/", (req, res) => {
  res.send({ message: "Success" });
});

app.listen(port, () => {
  console.log("Listening to port", port);
});
