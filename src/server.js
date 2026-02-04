import dotenv from 'dotenv'
import app from './app.js';
import connectToDb from './config/db.js';
dotenv.config();

const PORT = process.env.PORT || 3000;

//db connection
await connectToDb();

app.listen(PORT,()=>{
    console.log("Server running on",PORT)
})