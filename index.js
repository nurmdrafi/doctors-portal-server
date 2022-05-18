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
    const appointmentCollection = client
      .db("doctorDB")
      .collection("appointments");

    // Get all services
    // http://localhost:5000/service
    app.get("/service", async (req, res) => {
      const query = req.query;
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // Warning:
    // This is not the proper way to query
    // After learning more about mongodb, use aggregate lookup, pipeline, match, group
    // https://www.mongodb.com/docs/manual/aggregation/

    // Get available services
    app.get("/available", async (req, res) => {
      const date = req.query.date;

      // step 1: get all services [ 6 x {}]
      const services = await serviceCollection.find().toArray();

      // step 2: get the booking of that day [2 x {}]
      const query = { date: date };
      const appointments = await appointmentCollection.find(query).toArray();
      console.log(appointments)
      // step 3: for each service
      services.forEach((service) => {
        // step 4: filter which services are booked [2 x {}] from all services
        const serviceAppointments = appointments.filter(
          (appointment) => appointment.treatment === service.name
        );

        // step 5: select slots for the service bookings: ["", "", "", "", ""]
        const bookedSlots = serviceAppointments.map((s) => s.slot);

        // step 6: get available slots (service slots - booked slots)
        const available = service.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        // step 7: set available slots to make it easier
        service.slots = available;
        // service.available = available;
      });
      res.send(services);
    });

    // Post appointment
    // http://localhost:5000/appointment
    /* 
    post method এর ভিতর query চালায় find করে সেই result এর উপর depend করে new item add হবে।
    */
    app.post("/appointment", async (req, res) => {
      const appointment = req.body;
      const query = {
        treatment: appointment.treatment,
        date: appointment.date,
        patientName: appointment.patientName,
      };
      const exists = await appointmentCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, appointment: exists });
      }
      const result = await appointmentCollection.insertOne(appointment);
      res.send({ success: true, result });
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
