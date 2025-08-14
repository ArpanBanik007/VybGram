import cookieParser from "cookie-parser";
import express from "express"
import cors from "cors"

const app= express();


// cors frontend





app.use(express.json({ limit: "10kb" }))
app.use(express.urlencoded({ extended: true, limit: "10kb" }))// For nested object
app.use(express.static("public"))// Access for public file data to server 
app.use(cookieParser())

// importing routes
import  userRoute from "./routes/user.routes.js"




// routes decleartion

app.use("/api/v1/user",userRoute)





export default app;



