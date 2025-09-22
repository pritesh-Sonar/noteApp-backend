const express  = require("express")
const mongoose  = require("mongoose")
const cors = require("cors")
const UserModel = require("./Models/user.js")
const NotesModel =  require("./Models/userNotes.js")
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();


app.use(express.json())



app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true,              
}));

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
.then(()=> console.log("connected to mongodb"))
.catch(err => console.log(err))

app.post("/",(req,res)=>{
    res.json("Hello Welcome To backend !!");
})


app.post("/login",async (req,res) => {
    const {email, password} = req.body;
    await UserModel.findOne({email:email})
    .then(user => {
        if(user){
            bcrypt.compare(password, user.password, (err,response)=>{
                if(response){
                    const token = jwt.sign({email: user.email, role: user.role},   
                     "jwt_secret_key", {expiresIn: "1d"} )
                    res.cookie('token',token)
                    return res.json("Success")
                }else{
                    return res.json("password is incorrect")
                }
            })
        }
        else{
            res.json("user is not exist")
        }
    })
});


app.post("/Signup", (req,res) =>{
    const {name, email, password} = req.body;
    bcrypt.hash(password,10)
    .then(hash => {
    UserModel.create({name, email, password: hash})
    .then(users => res.json("Success"))
    .catch(err => res.json(err))
    })
    .catch(err => res.json(err))
    
})

app.post("/home/create",async(req,res) =>{
   await  NotesModel.create(req.body)
    .then(notes=> res.json(notes))
    .catch(err => res.json(err))
})

app.post("/pastes", async(req,res) => {
    const {email} = req.body
    await NotesModel.find({userEmail:email})
    .then(userNotes => {
        if(userNotes){
            res.json(userNotes);
        }
    })
})

app.post("/user",(req,res)=>{
    const {email} = req.body
    UserModel.findOne({email : email})
    .then(user => {
        if(user){
        res.json(user.name)
        }
        
    }
    )
})

app.post("/updatePost",async(req,res) =>{
  const {email,title,value,prevTitle} = req.body
  await NotesModel.findOneAndUpdate(
    { userEmail: email, title: prevTitle }, 
      { $set: { title: title, value: value } }, 
      { new: true } 
  )
  .then(user =>{
    // savedData = user;
    res.json(user)
  })
  .catch(err => res.json(err))
})

app.post("/delete",async(req,res)=>{
    const{email,userTitle} = req.body
   await NotesModel.deleteOne({userEmail : email, title : userTitle.current})
    .then(
        res.json("success")
    )
    .catch(err => res.json(err))
    
})


app.post('/forgot-password', (req, res) => {
    const {email} = req.body;
    UserModel.findOne({email: email})
    .then(user => {
        if(!user) {
            return res.send({Status: "User not existed"})
        } 
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET_KEY, {expiresIn: "1d"})
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });
          
          var mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset Password Link',
            text: `${process.env.FRONTEND_URL}/reset_password/${user._id}/${token}`
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              return res.send({Status: "Success"})
            }
          });
    })
})

app.post('/reset-password/:id/:token', (req, res) => {
    const {id, token} = req.params
    const {password} = req.body

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if(err) {
            return res.json({Status: "Error with token"})
        } else {
            bcrypt.hash(password,10)
            .then(hash => {
                UserModel.findByIdAndUpdate({_id: id}, {password: hash})
                .then(u => res.send({Status: "Success"}))
                .catch(err => res.send({Status: err}))
            })
            .catch(err => res.send({Status: err}))
        }
    })
})


app.listen(3001, () => {
    console.log("server is running on port 3001");
})
