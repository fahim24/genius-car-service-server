const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).send({ message: "unauthorized access" });
	}
	const token = authHeader.split(" ")[1];
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
		if (err) {
			return res.status(403).send({ message: "Forbidden access" });
		}
		console.log("decoded", decoded);
		req.decoded = decoded;
		next();
	});
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g07pe.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

async function run() {
	try {
		await client.connect();
		const servicesCollection = client.db("geniusCar").collection("services");
		const orderCollection = client.db("geniusCar").collection("order");
		console.log("Genius car DB Connected");

		app.get("/services", async (req, res) => {
			const query = {};
			const cursor = servicesCollection.find(query);
			const services = await cursor.toArray();
			res.send(services);
		});

		app.get("/service/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const service = await servicesCollection.findOne(query);
			res.send(service);
		});

		app.post("/services", async (req, res) => {
			const newService = req.body;
			const result = await servicesCollection.insertOne(newService);
			res.send(result);
		});

		app.delete("/service/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await servicesCollection.deleteOne(query);
			res.send(result);
		});

		app.get("/order", verifyJWT, async (req, res) => {
			const decodedEmail = req.decoded.email;
			const email = req.query.email;
			if (email === decodedEmail) {
				const query = { email: email };
				const cursor = orderCollection.find(query);
				const orders = await cursor.toArray();
				res.send(orders);
			} else {
				res.status(403).send({ message: "forbidden access" });
			}
		});

		app.post("/order", async (req, res) => {
			const order = req.body;
			const result = await orderCollection.insertOne(order);
			res.send(result);
		});
	} finally {
		// await client.close();
	}
}
run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("Running Genius car server");
});

app.listen(port, () => {
	console.log("listening to port", port);
});
