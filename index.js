const express=require('express')
const bodyParser=require('body-parser');
const fileUpload=require('express-fileupload')
const cors =require('cors');
const MongoClient=require('mongodb').MongoClient;
require('dotenv').config()
const fs=require('fs-extra');



const app=express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('doctors'));
app.use(fileUpload())

const port=5000;


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cigf8.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {

  const appointmentCollection= client.db("DoctorsPortal").collection("Appointment");
  const doctorCollection = client.db("DoctorsPortal").collection("Doctors");

  app.post('/appointment',(req,res)=>{
      const appointment=req.body;
      appointmentCollection.insertOne(appointment)
      .then(result=>{
          res.send(result.insertedCount>0);
      })
  })

  app.get('/patients',(req,res)=>{
    appointmentCollection.find()
    .toArray((err,documents)=>{
        res.send(documents);
    })
})
  app.post('/appointmentByDate',(req,res)=>{
    const date=req.body;
    const email=req.body.email;
    appointmentCollection.find({date:date.date})
    .toArray((err,documents)=>{
        res.send(documents);
    })
})

app.post('/addDoctor',(req,res)=>{

    const file=req.files.file;
    const name=req.body.name;
    const email=req.body.email;
    const filePath=`${__dirname}/doctors/${file.name}`;

    console.log(name,file,email)

    file.mv(filePath,err=>{
        if (err) {
            console.log(err)
            return res.status(500).send({msg:'Failed to upload img'})
        }

        const newImg=fs.readFileSync(filePath);
        const encImg=newImg.toString('base64');

        var image={
            contentType: req.files.file.mimetype,
            size: req.files.file.size,
            img: Buffer(encImg, 'base64')
        }

        doctorCollection.insertOne({name,email,image})
        .then(result=>{
            console.log(result)
            fs.remove(filePath,error=>{
                if (error) {
                    console.log(error)
                }
                res.send(result.insertedCount>0);
            })
            
        })

    })

})

});


app.get('/',(req,res)=>{
    res.send('Hello,server is working')
})

app.listen(process.env.PORT||port)