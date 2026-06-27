
const express =require('express');
const mysql=require('mysql');
const cors = require("cors");
const bcrypt = require('bcrypt');
const bodyParser=require("body-parser");
const cookieparser=require("cookie-parser")
const session=require("express-session");
const validator = require("validator"); //Added this line
const jwt = require("jsonwebtoken");  //Added this line
const helmet = require("helmet");  //Added this line
const winston = require("winston"); //Added this line
const saltRounds = 10;






const PORT=process.env.PORT || 8000;

const app=express();

const logger = winston.createLogger({
    level: "info",
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "security.log" })
    ]
});

app.use(cors({
    origin:"http://localhost:3000",
    credentials:true,
}));
app.use(helmet()); //Added this line
app.use(express.json());
app.use(cookieparser());
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    key:"userId",
    secret:"atanu",
    resave:false,
    saveUninitialized:false,
    // cookie:{
    //     expires:60*60*60*24,
    // }
}))

const db=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'login_react'
})





app.get("/",(req,res)=>{
    res.send("hi");
})

app.post("/register",(req,res)=>{
    const email=req.body.email;
    const password=req.body.password;

     // ✅ VALIDATION (STOP IF INVALID)
    if (!validator.isEmail(email)) {
        return res.status(400).send("Invalid email");
    }

    if (validator.isEmpty(password)) {
        return res.status(400).send("Password required");
    }

    bcrypt.hash(password,saltRounds,(errr,hash)=>{
        const data={
       
            email:req.body.email,
            password:hash,        
       
       };
       if(errr)
       {
        console.log(err);
       }
       else{
        let sqll=`select * from users where email='${email}'`;
        db.query(sqll,(er,ress)=>{
            if(ress.length > 0)
            {
                res.send({msg:"User Email Already Present"})

            }
            else{
                let sql="INSERT INTO `users` SET ?";
                db.query(sql,data,(err,result)=>{
                    if(err)
                    {
                        console.log(err)
                    }
                    else{
                        //  console.log(result);
                         res.send(result);
                        // res.send()
            
                    }
                })
            }
        })

       

       }
      

    })
   
    
     
})

app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    let sql = `select * from users where email='${email}'`;

    db.query(sql, (err, result) => {
        if (err) {
            console.log(err);
        } else {

            if (result.length > 0) {

                bcrypt.compare(password, result[0].password, (errr, response) => {

                    // PASSWORD MATCHED
                    if (response) {

                        req.session.user = result;

                        // JWT TOKEN
                        const jwt = require("jsonwebtoken");

                        const token = jwt.sign(
                            { id: result[0].id, email: result[0].email },
                            "secretKey",
                            { expiresIn: "1h" }
                        );

                        logger.info(`Successful login: ${email}`);  //Added this line

                        return res.send({
                            login: true,
                            useremail: email,
                            token: token
                        });

                    }

                    else {
                        return res.send({
                            login: false,
                            msg: "Wrong Password"
                        });
                    }
                });

            }

            else {
                return res.send({
                    login: false,
                    msg: "User Email Not Exists"
                });
            }
        }
    });
});
app.get("/login",(req,res)=>{
    if(req.session.user)
    {
        res.send({login:true,user:req.session.user});
    }
    else{
        res.send({login:false});
    }
})




app.listen(PORT, () => {
    logger.info(`Application started on port ${PORT}`);
    console.log(`app running in ${PORT}`);
});