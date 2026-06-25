const express = require('express');
const app = express();
const port = 8080;
var cors = require('cors')
const dotenv = require("dotenv");
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        const db = client.db("Teachers");
        const teachersInfo = db.collection("teachersInfo");

        app.get('/', async (req, res) => {
            const projectFields = {

                name: 1,
                photo: 1,
                subject: 1,
                availableDays: 1,
                hourlyFee: 1,
                location: 1
            }
            const teachers = await teachersInfo.find().limit(6).project(projectFields).toArray();
            res.send(teachers);

        });
        app.get('/tutors', async (req, res) => {
            const projectFields = {

                name: 1,
                photo: 1,
                subject: 1,
                availableDays: 1,
                hourlyFee: 1,
                location: 1
            }
            const teachers = await teachersInfo.find().project(projectFields).toArray();
            res.send(teachers);

        });
        app.get('/tutors/details/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)

            const teachers = await teachersInfo.find({ _id: new ObjectId(id) }).toArray();
            res.send(teachers);

        });

    } finally {

        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});