const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const app = express();
const port = process.env.port || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6c8obk5.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJwt = (req, res, next) => {
  console.log(req.headers.authorization)
  const authorization = req.headers.authorization
  if (!authorization) {
    return res.status(403).send({ error: true, message: 'Unauthorized access' })
  }
  const token = authorization.split(' ')[1]
  console.log(token)
  jwt.verify(token, proccess.env.ACCESS_TOKEN, (error, decoded) => {
    if (error) {
      return res.status(403).send({ error: true, message: 'Unauthorized access' })
    }
    req.decoded = decoded;
    next()
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('CarDoctor').collection('service')
    const bookingCollection = client.db('CarDoctor').collection('booking')

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "1h" })
      res.send({ token })

    })

    app.get('/services', async (req, res) => {
      const cursor = serviceCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/service/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const options = {
        projection: { title: 1, img: 1, price: 1, },
      };
      const result = await serviceCollection.findOne(query, options)
      res.send(result)
    })

    app.get('/booking', verifyJwt, async (req, res) => {
      const email = req.query.email
      let query = {}
      if (email) {
        query = { email: email }
      }
      const result = await bookingCollection.find(query).toArray()
      res.send(result)
    })

    app.post('/booking', async (req, res) => {
      const booking = req.body;
      console.log(booking)
      const result = await bookingCollection.insertOne(booking)
      res.send(result)
    })

    app.patch('/booking/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDetails = req.body;
      console.log(updatedDetails)
      const updatedDoc = {
        $set: {
          status: updatedDetails.status
        }
      };
      const result = await bookingCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    app.delete('/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollection.deleteOne(query)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('doctor is running')
})

app.listen(port, () => {
  console.log('server is running on port', port)
})