import express from 'express';
import sqlite3 from 'sqlite3';
import bcrypt, { hash } from 'bcrypt';
import cors from 'cors';
import atlas_uri from './atlas_uri.js';
import { MongoClient } from 'mongodb';

const app = express();
const db = new sqlite3.Database('./users.db');
const PORT = 4000;
const mongoClient = new MongoClient(atlas_uri)
const dbName = "ragtivity"

async function connect_mongo() {
  try {
    await mongoClient.connect()
    console.log("Connected to MongoDB")
  }
  catch (err) {
    console.error(```Error while connecting to MongoDB. ${e}```)
  }
}

app.use(cors());
app.use(express.json());


// Signup endpoint
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  
  // Input validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // Get users collection
  const usersCollection = mongoClient.db(dbName).collection("users")

  // Check if user exists or not first
  const queryIfUserExists = {email: email}
  try {
    const user = await usersCollection.findOne(queryIfUserExists)
    if (user != null) {
      return res.status(409).json({message: "Users already exists. "})
    }
  }
  catch (err) {
    return res.status(500).json({message: "Something went wrong while querying if user already exists or not. Error message: " + err})
  }

  // Hash user's password
  const hashed_password = await bcrypt.hash(password, 10)

  // Insert new user to database
  const queryInsertUser = {
    email: email,
    hashed_password: hashed_password
  }
  try {
    const insertUserResult = await usersCollection.insertOne(queryInsertUser)
    if (insertUserResult.acknowledged == false) {
      return res.status(500).json({message: "Write operation to the database not confirmed while inserting new user"})
    }
  }
  catch (err) {
    return res.status(500).json({message: "Something went wrong while inserting user to database. Error message: " + err})
  }

  return res.json({message: "User inserted successfully!"})
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // Input validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

   // Get users collection
  const usersCollection = mongoClient.db(dbName).collection("users")

  // Query user's details by email field
  const queryUser = {email: email}
  const queryUserProjection = {email:1, hashed_password:1}
  let userDetails
  try {
    userDetails = await usersCollection.findOne(queryUser, queryUserProjection)
    if (userDetails == null) {
      return res.status(401).json({message: "User doesn't exist"})
    }
  }
  catch (err) {
    return res.status(500).json({message: "Something went wrong while querying if user's details. Error message: " + err})
  }
 
  // Compare hashed password in database and inputted password
  const passwordIsCorrect = await bcrypt.compare(password, userDetails.hashed_password)

  if (!passwordIsCorrect) {
      return res.status(401).json({ message: 'Invalid credentials.' });
  }

  return res.json({message: "Login successful"})
});

// DEV ONLY: List all users (do not use in production)
app.get('/users', async (req, res) => {
  const usersCollection = mongoClient.db(dbName).collection("users")

  let allUsers
  try {
    allUsers = await usersCollection.find().toArray()
  }
  catch (err) {
    return res.status(500).json({message: "Something went wrong while fetching all users. Error message: " + err})
  }

  return res.json(allUsers)
});


async function main() {
  try {
    await connect_mongo()
  }
  catch (err) {
    console.error(`Error while connecting to MongoDB. ${e}`)
  }

  app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
  }) 
}

main()