import express from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import fileUpload from "express-fileupload"
import dotenv from "dotenv"
import ragRoutes from './ragRoutes.js';
import { Blob } from "buffer"
import cookieParser from 'cookie-parser';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  DeleteObjectsCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3"

dotenv.config()

const app = express();
const PORT = 4000;
const URI = process.env.MONGO_URI
const mongoClient = new MongoClient(URI)
const dbName = "ragtivity"
const s3client = new S3Client({
  region: "ap-southeast-2"
})
const S3_BUCKET_NAME = "ragtivity"

app.use(cors({ 
  origin: "http://localhost:5173",
  credentials: true 
}));
app.use(fileUpload()); 
app.use(express.json()); 
app.use(cookieParser());
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
    Bucket: S3_BUCKET_NAME,
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
  
  let chunk_and_embeddings
  let uploadFileInput
  let uploadFileCommand
  let uploadFileResponse
  
  // Check if it is a single file or an array of files
  if (Array.isArray(files) == false) {
    files = [files]
  }
  
  // Get user collection
  const usersCollection = mongoClient.db(dbName).collection("users")
  const chunkedCollection = mongoClient.db(dbName).collection("chunked_documents")
  const queryGetUser = {email: userEmail}
  let filesToInsert = []
  let userId

  // Check if the uploaded file has a same filename as previously uploaded ones
  try {
    let userDocuments = await usersCollection.findOne(queryGetUser, {projection: {documents:1}})
    userId = userDocuments._id
    userDocuments = userDocuments.documents    
    for (const uploadedFile of files) {
      for (const recordedFile of userDocuments) {
        if (uploadedFile.name == recordedFile.filename) {
          throw new Error("Duplicated file(s)", {cause: "Duplicate"})
        }
      }
    }
  } catch (e) {
    if (e.cause == "Duplicate") {
      return res.status(400).json({
        reason: "FILENAME_EXISTS",
        message: "One or more file was found to have the same name as a previously uploaded one(s)"
      })
    }
  }    

  // Chunk the documents and get each chunk's embeddings
  // TODO: Bulk file calls. Right now, we can only upload 1 file at a time
  try {
    // Reformat file from a Buffer type -> Blob type. Buffer type is not serialisable whereas Blob is
    const blobFile = new Blob([files[0].data], { type: 'application/pdf' })
    let formData = new FormData()
    formData.append("file", blobFile, files[0].name)
    const response = await fetch("http://rag:8000/upload", {
      method: "POST",
      body: formData
    })

    chunk_and_embeddings = await response.json()
  } catch(err) {
    console.error(err)
    return res.status(500).send("Something went wrong while trying to get the file chunked and get its embeddings")
  }
  // Build the insert query for later on. 
  const mongoChunkedDocumentsToInsert = []
  for (let i = 0; i < chunk_and_embeddings.text.length; i++) {
    // Each chunk will be its own MongoDB document. Common denominator to identify a file will be through its filename and userId
    mongoChunkedDocumentsToInsert.push({
      userId: userId,
      filename: files[0].name,
      chunk_num: i,
      text: chunk_and_embeddings.text[i],
      embeddings: chunk_and_embeddings.embeddings[i]
    })  
  }

  // Loop through each file to upload to storage and record in database
  for (const file of files) {
    let uploadFilename = `${userEmail}/${file.name}`
    
    // Upload to S3
    uploadFileInput = {
      Body: file.data,
      Bucket: S3_BUCKET_NAME,
      Key: uploadFilename
    }
    uploadFileCommand = new PutObjectCommand(uploadFileInput)
    uploadFileResponse = await s3client.send(uploadFileCommand)
    
    // Check if storage upload failed
    if (uploadFileResponse.$metadata.httpStatusCode != 200) {
      // If some files have been previously uploaded, delete them from the storage to prevent partial uploads
      if (filesToInsert.length != 0) {
        // Build the delete command input
        let deleteObjectsInput = {
          Bucket: S3_BUCKET_NAME,
          Delete: {
            Objects: filesToInsert.map(item => ({Key: item.name}))
          }
        }
        const deleteObjectsCommand = new DeleteObjectsCommand(deleteObjectsInput)
        await s3client.send(deleteObjectsCommand)
      }

      return res.status(500).json({
        "message": "Something went wrong while uploading file to S3 storage",
        "AWS_code": uploadFileResponse.$metadata.httpStatusCode 
      })
    }
    
    // Keep a record of each file that has been uploaded to storage to insert them into the database
    filesToInsert.push({
      filename: file.name,
      uploadedFilename: uploadFilename
    })
  }

  // Update query for what documents a user has. This query adds the newly added documents to the user's document list
  const queryAddFiles = {
    $push: {
      documents: {$each: filesToInsert}
    }
  }
  // Start session for an ACID transaction
  const mongoSession = mongoClient.startSession()
  try {
    // Start ACID transaction
    mongoSession.startTransaction()
    // Add newly added documents to the user's document in the database
    await usersCollection.updateOne(queryGetUser, queryAddFiles, { mongoSession })
    // Add chunked texts and its embeddings to the chunked_documents collection
    await chunkedCollection.insertMany(mongoChunkedDocumentsToInsert, { mongoSession })
    // Commit ACID transaction
    mongoSession.commitTransaction()
  }
  catch (err) {
    // Abort ACID transaction if an error occurs
    mongoSession.abortTransaction()
    return res.status(500).send("Something went wrong while adding document to database. Error message: ", err)
  } finally {
    mongoSession.endSession()
  }

  return res.send("Documents uploaded successfully")
})


app.post("/delete_document", async (req, res) => {
  const { email, filename } = req.body

  const usersCollection = mongoClient.db(dbName).collection("users")
  const chunkedCollection = mongoClient.db(dbName).collection("chunked_documents")
  
  let userId

  // Build queries for MongoDB
  const queryIdentifyUser = {email: email}
  const queryDeleteFile = {$pull: {documents: {filename: filename}}}
  const queryDocumentStoragePath = {
    projection: {
      documents: {
        $elemMatch: {filename: filename}
      }
    }
  }
  
  // Get the target document's storage path
  let documentStoragePath
  try {
    documentStoragePath = await usersCollection.findOne(queryIdentifyUser, queryDocumentStoragePath)
    userId = documentStoragePath._id
    documentStoragePath = documentStoragePath.documents[0].uploadedFilename
  } 
  catch (err) {
    return res.status(500).send("Something went wrong while querying if document exists or not. Error message: " + err)
  }
  
  // Delete the object from S3 bucket
  const deleteObjectInput = {
    Bucket: S3_BUCKET_NAME,
    Key: documentStoragePath,
  }
  const deleteObjectCommand = new DeleteObjectCommand(deleteObjectInput)
  const deleteObjectResponse = await s3client.send(deleteObjectCommand)
  // Check for errors in the response
  if (deleteObjectResponse.$metadata.httpStatusCode != 204) {
    return res.status(500).send("Something went wrong while deleting object from S3 bucket")
  }
  
  // Build query to delete chunked documents from MongoDB chunked_documents collection
  const queryDeleteChunkedDocuments = {
    userId: userId,
    filename: filename
  }
  // Delete file record from MongoDB
  const mongoSession = mongoClient.startSession()
  try {
    // Start ACID transaction
    mongoSession.startTransaction()
    // Delete the filename from the user's file list
    await usersCollection.updateOne(queryIdentifyUser, queryDeleteFile, { mongoSession })
    await chunkedCollection.deleteMany(queryDeleteChunkedDocuments, { mongoSession })
    // Commit ACID transaction
    mongoSession.commitTransaction()
  }
  catch (err) {
    mongoSession.abortTransaction()
    return res.status(500).send("Something went wrong while deleting file records from MongoDB. Error message: " + err)
  } finally {
    mongoSession.endSession()
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

  let userId

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
    userId = userDetails._id
  }
  catch (err) {
    return res.status(500).json({message: "Something went wrong while querying if user's details. Error message: " + err})
  }
 
  // Compare hashed password in database and inputted password
  const passwordIsCorrect = await bcrypt.compare(password, userDetails.hashed_password)

  if (!passwordIsCorrect) {
      return res.status(401).json({ message: 'Invalid credentials.' });
  }

  res.cookie("userId", userId)

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


async function createMongoDBSearchIndex() {
    const existingIndexes = await mongoClient.db(dbName).collection("chunked_documents").listSearchIndexes().toArray()
    const indexExists = existingIndexes.some(index => index.name == "vectorChunkIndex")

    if (indexExists){
        console.log("Index has already been created")
        return
    }

    await mongoClient.db("ragtivity").collection("chunked_documents").createSearchIndex({
        name: "vectorChunkIndex",
        type: "vectorSearch",
        definition: {
            fields: [{
                type: "vector",
                numDimensions: 768,
                path: "embeddings",
                similarity: "cosine"
            },
            {
                type: "filter",
                path: "userId"
            },
            {
              type: "filter",
              path: "filename"
            }
        ]
        }
    })

    console.log("Vector search index created successfully")
}



async function main() {
  try {
    await connect_mongo()
  }
  catch (err) {
    console.error(`Error while connecting to MongoDB. `, err)
  }

  app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
  }) 
}

createMongoDBSearchIndex()
main()