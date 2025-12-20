import express from 'express';
import bcrypt, { hash } from 'bcrypt';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import fileUpload from "express-fileupload"
import path from "node:path"
import dotenv from "dotenv"
import ragRoutes from './ragRoutes.js';
import fs from "fs"
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3"

dotenv.config()

const app = express();
const PORT = 4000;
const URI = process.env.MONGO_URI
const mongoClient = new MongoClient(URI)
const dbName = "ragtivity"
const s3client = new S3Client({})

app.use(cors());
app.use(fileUpload()); 
app.use(express.json()); 
app.use('/rag', ragRoutes);

async function connect_mongo() {
  try {
    await mongoClient.connect()
    console.log("Connected to MongoDB")
  }
  catch (err) {
    console.error(`Error while connecting to MongoDB. `, err)
  }
}

app.get("/", async (req, res) => {
  const bucket = {
    Bucket: "ragtivity",
  }
  const headBucketCommand = new HeadBucketCommand(bucket)
  const response = await s3client.send(headBucketCommand) 

  if (response.$metadata.httpStatusCode == 200) {
    return res.send("Bucket exists!")
  }
  else {
    return res.status(500).send("S3 bucket does not exist! Contact developers")
  }

}) 

// Get all user's document
app.get("/documents", async (req, res) => {
  const userEmail = req.query.email

  // Get users collection
  const usersCollection = mongoClient.db(dbName).collection("users")
  
  // Query user's documents
  const queryUserDocuments = {email: userEmail}
  const queryOptions = {projection: {documents:1, _id:0}}
  let userDocuments
  try {
    userDocuments = await usersCollection.findOne(queryUserDocuments, queryOptions)
    
    // If user has no documents, return an empty list
    if (Object.keys(userDocuments).length === 0) {
      return res.json({
        documents: []
      })
    }
  }
  catch (err) {
    return res.status(500).json({message: "Something went wrong while querying user's documents. Error message: " + err})
  }

  return res.json({documents: userDocuments.documents})
})

// Upload documents 
app.post("/documents", async (req, res) => {
  const userEmail = req.body.email
  let files = req.files.files
  
  const storagePath = "files"
  let uploadPath

  // Get user collection
  const usersCollection = mongoClient.db(dbName).collection("users")
  const queryGetUser = {email: userEmail}
  let filesToInsert = []

  if (Array.isArray(files) == false) {
    files = [files]
  }

  // Loop through each file uploaded and store file to storage location
 for (const file of files) {
    uploadPath = path.join(storagePath, userEmail, file.name)

    // Check if path exists. If not, make directory recursively
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(path.dirname(uploadPath), {recursive: true})
    }

    // Check if there's a duplicate file
    const filenameDuplicate = fs.existsSync(uploadPath)

    // If there is, check if content is the same by comparing the content's MD5 hash value
    if (filenameDuplicate) {
      return res.status(400).send("FILENAME_EXISTS")
    }

    // Move file to storage location
    try {
      await file.mv(uploadPath)
    }
    catch (err) {
        return res.status(500).send("Something went wrong while uploading file to storage. Error message: " + err)
    }

    filesToInsert.push({
      filename: file.name,
      uploadPath: uploadPath
    })
  }

  // Update query to MongoDB
  const queryAddFiles = {
    $push: {
      documents: {$each: filesToInsert}
    }
  }
  // Add newly added documents to the user's document in the database
  try {
    const result = await usersCollection.updateOne(queryGetUser, queryAddFiles)
  }
  catch (err) {
    res.status(500).send("Something went wrong while adding document to database. Error message: ", err)
  }

  return res.send("Documents uploaded successfully")
})

app.post("/delete_document", async (req, res) => {
  console.log(req.body)
  const { email, filename } = req.body
  const fileStoragePath = path.join("files", email, filename)

  const usersCollection = mongoClient.db(dbName).collection("users")
  
  const queryIdentifyUser = {email: email}
  const queryDeleteFile = {$pull: {documents: {filename: filename}}}
  
  try {
    const deleteFileFromDB = await usersCollection.updateOne(queryIdentifyUser, queryDeleteFile)
    const deleteFileFromStorage = fs.unlinkSync(fileStoragePath)

  }
  catch (err) {
    return res.status(500).send("Something went wrong while deleting document. Error message: " + err)
  }

  return res.status(200).send("Document successfully deleted")
})

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
    console.error(`Error while connecting to MongoDB. `, e)
  }

  app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
  }) 
}

main()