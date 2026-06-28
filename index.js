const express = require('express');
const app = express();
const port = 8080;
var cors = require('cors');
app.use(cors());

app.use(express.json());
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
        const BookedTeachers = db.collection("BookedTeachers");
        const Mytutors = db.collection("Mytutors");

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
            const { search, startDate, endDate } = req.query;
            const query = {};

            if (search) {
                query.name = { $regex: search, $options: 'i' };
            }

            if (startDate || endDate) {
                query.sessionStartDate = {};
                if (startDate) {
                    query.sessionStartDate.$gte = startDate;
                }
                if (endDate) {
                    query.sessionStartDate.$lte = endDate;
                }
            }

            const projectFields = {
                name: 1,
                photo: 1,
                subject: 1,
                availableDays: 1,
                hourlyFee: 1,
                location: 1,
                sessionStartDate: 1
            }
            const teachers = await teachersInfo.find(query).project(projectFields).toArray();
            res.send(teachers);
        });
        app.get('/tutors/details/:id', async (req, res) => {
            const id = req.params.id;


            const teachers = await teachersInfo.find({ _id: new ObjectId(id) }).toArray();
            res.send(teachers);

        });



        app.get("/my-booked-sessions/:id", async (req, res) => {
            const UserId = req.params.id;

            const BookedTutorByUser = await BookedTeachers.find({ UserId: UserId }).project({ tutorId: 1 }).toArray();
            const tutorIds = BookedTutorByUser.map(
                item => new ObjectId(item.tutorId)
            );

            const teacherDetails = await teachersInfo.find({
                _id: { $in: tutorIds }
            }).toArray();

            res.send(teacherDetails);


        })
        app.delete("/my-booked-sessions/:id", async (req, res) => {
            const id = req.params.id;


            const BookedTutorByUser = await BookedTeachers.deleteOne({ tutorId: id });
            res.send(BookedTutorByUser);
        })


        app.post('/tutors/details/:id', async (req, res) => {
            const id = req.params.id;
            const doc = req.body;

            try {
                const tutor = await teachersInfo.findOne({ _id: new ObjectId(id) });
                if (!tutor) {
                    return res.status(404).send({ error: "Tutor not found" });
                }

                // Check slot availability
                let totalSlotNum = Number(tutor.totalSlot);
                if (isNaN(totalSlotNum) || totalSlotNum <= 0) {
                    return res.status(400).send({ error: "This session is fully booked. You can't join at the moment." });
                }

                // System should auto-generate: Book Status
                doc.status = "Reviewing";

                // Insert booking
                const result = await BookedTeachers.insertOne(doc);

                // Auto Decrease Slot by 1
                await teachersInfo.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { totalSlot: totalSlotNum - 1 } }
                );

                res.send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({ error: "Internal server error" });
            }
        });


        app.post("/add-tutor", async (req, res) => {
            const tutor = req.body;

            const result = await Mytutors.insertOne(tutor);

            res.send(result);
        });


        app.get("/my-tutors/:id", async (req, res) => {
            const userId = req.params.id;
            const result = await Mytutors.find({ UserId: userId }).toArray();
            console.log(result);
            res.send(result);


        })

    } finally {

        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});