const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const shortid = require('shortid');

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) {
      console.log("error - " + err);
    }
  }
);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
/////////////////////////////////////////////////////////////////////////////////////
//MODEL CREATING
var Schema = mongoose.Schema;
var userSchema = new Schema({
  username: String,
  _id: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
}, {versionKey: false})

userSchema.methods.toJSON = function() {
 var obj = this.toObject();
 delete obj.log._id;
 return obj;
}

var Users = mongoose.model("Users", userSchema, "Users")
//////////////////////////////////////////////////////////////////////////////////////

// Not found middleware
// app.use((req, res, next) => {
//   return next({status: 404, message: 'not found'})
// })

// // Error Handling middleware
// app.use((err, req, res, next) => {
//   let errCode, errMessage

//   if (err.errors) {
//     // mongoose validation error
//     errCode = 400 // bad request
//     const keys = Object.keys(err.errors)
//     // report the first validation error
//     errMessage = err.errors[keys[0]].message
//   } else {
//     // generic or custom error
//     errCode = err.status || 500
//     errMessage = err.message || 'Internal Server Error'
//   }
//   res.status(errCode).type('txt')
//     .send(errMessage)
// })
/////////////////////////////////////////////////////////////////////////////////////
//SAVING USERNAME TO DATABASE AND RETURNING JSON WITH USERNAME AND ID
app.post("/api/exercise/new-user", (req, res)=> {
  var user = req.body.username
  //////////////////////////////////////////////////////
  //CHECKING DATABASE TO AVOID SAME NAME ENTRIES
  
    Users.findOne({username: user}, (err, data)=> {
      if(err) {
        res.send("something wrong - "+ err)
      }
      else if(data){
        res.send("already exists")
      }
      else {
        var id = shortid.generate()
        var newuser = new Users({
          username: user,
          _id: id,
          count: 0,
        })
        newuser.save((err)=> {
            if(err) {
              res.send("error saving the username - " + err)
            }
            else {
              console.log("new user added to database")
            }  
        })
        res.json({username: user, _id: id})
      }
    })
})
/////////////////////////////////////////////////////////////////////////////
//ADDING EXERCISE DATA TO USERNAME IN THE DATABASE
app.post("/api/exercise/add", (req, res)=> {
  if(req.body.userId && req.body.description && req.body.duration) {
    var userid = req.body.userId;
    var desc = req.body.description;
    var dur = req.body.duration;
    var date
    if(!req.body.date) {
      date = "No data"
    }else {
      date = new Date(req.body.date).toDateString()
    }
  
  Users.findOne({_id: userid},"-log._id",  (err, data)=> {    
    if(err) {
      res.send("error fetching data - " + err)
    }
    else if(!data) {
      res.send("error fetching data - no username with that id")
    }
    else {
      data.count += 1;
      data.save()
      
      data.log.push({
        description: desc,
        duration: dur,
        date: date,
      })
      
        res.json({
        username: data.username,
        _id: data._id,
        description: desc,
        duration: dur,
        date: date,
        }) 
 
    }
  })
  }else {
    res.send("put ALL required data to add exercise")
  }
  
})
///////////////////////////////////////////////////////////////////////
//GET USERNAME INFO FROM USERID IN A FORM OF JSON
app.get("/api/exercise/log", (req, res)=> {
  var userId = req.query.userId;
  var from = req.query.from || 0;
  var to = req.query.to || 0;
  var limit = req.query.limit || 0;
  
  
  Users.findOne({_id: userId}, (err, data)=> {
    if(err) {
      res.send("error - "+ err)
    }
    else if(!data) {
      res.send("no matching userId found ")
    }
    else {
      ////////////////////////////////////////////////////////////////////////////
      // ALL OPTIONS OUTPUT
      if(limit > 0 && from != 0 && to != 0) {
        
        var tempFrom = Date.parse(from)
        var tempTo = Date.parse(to)
        var finalLog = []
        
        Users.findOne({_id: userId}, "-log._id", (err, data)=> {
          
          data.log.forEach((x) => {
            if(Date.parse(x.date)>tempFrom && Date.parse(x.date)<tempTo)
            {
              finalLog.push(x)
            }
          
          })
          if(err) {
            res.send("wrong option input?")
          }
          else {
            res.json({
              _id: data._id,
              username: data.username,
              count: data.count,
              log: finalLog.slice(0,limit)
            })
          }
        })
      }
      //////////////////////////////////////////
      //FROM AND TO OPTION OUTPUT
      if(from != 0 && to != 0) {
        
        var tempFrom = Date.parse(from)
        var tempTo = Date.parse(to)
        var finalLog = []
        
        Users.findOne({_id: userId}, "-log._id", (err, data)=> {
          
          data.log.forEach((x) => {
            if(Date.parse(x.date)>tempFrom && Date.parse(x.date)<tempTo)
            {
              finalLog.push(x)
            }
          
          })
          if(err) {
            res.send("wrong option input?")
          }
          else {
            res.json({
              _id: data._id,
              username: data.username,
              count: data.count,
              log: finalLog
            })
          }
        })
      }
      //////////////////////////////////////////
      //LIMIT AND FROM OPTION OUTPUT
      if(limit > 0 && from != 0) {
        
        var tempFrom = Date.parse(from)
        var finalLog = []
        
        Users.findOne({_id: userId}, "-log._id", (err, data)=> {
          
          data.log.forEach((x) => {
            if(Date.parse(x.date)>tempFrom)
            {
              finalLog.push(x)
            }
          
          })
          if(err) {
            res.send("wrong option input?")
          }
          else {
            res.json({
              _id: data._id,
              username: data.username,
              count: data.count,
              log: finalLog.slice(0,limit)
            })
          }
        })
      }
      //////////////////////////////////////////
      //LIMIT AND TO OPTION OUTPUT
      if(limit > 0 && to != 0) {
        
        var tempTo = Date.parse(to)
        var finalLog = []
        
        Users.findOne({_id: userId}, "-log._id", (err, data)=> {
          
          data.log.forEach((x) => {
            if(Date.parse(x.date)<tempTo)
            {
              finalLog.push(x)
            }
          
          })
          if(err) {
            res.send("wrong option input?")
          }
          else {
            res.json({
              _id: data._id,
              username: data.username,
              count: data.count,
              log: finalLog.slice(0,limit)
            })
          }
        })
      }
      //////////////////////////////////////////
      //LIMIT OPTION OUTPUT
      else if(limit!=0) {
        Users.findOne({_id: userId}, "-log._id", (err, data)=> {
          if(err) {
            res.send("wrong LIMIT?")
          }
          else if(+limit != limit || limit<0) {
            res.send("wrong LIMIT format(only positive whole numbers)")
          }
          else {
            res.json({
              _id: data._id,
              username: data.username,
              count: data.count,
              log: data.log.slice(0,limit)
            })
          }
        })
      }
      /////////////////////////////////////////////////////
      //FROM OPTION OUTPUT
      else if(from !=0) {
        var tempFrom = Date.parse(from)
        var finalLog = []
        
        Users.findOne({_id: userId}, "-log._id", (err, data)=> {
          
          data.log.forEach((x) => {
            if(Date.parse(x.date)>tempFrom)
            {
              finalLog.push(x)
            }
          
          })
          if(err) {
            res.send("wrong FROM limit?")
          }
          else {
            res.json({
              _id: data._id,
              username: data.username,
              count: data.count,
              log: finalLog
            })
          }
        })      
      }
      /////////////////////////////////////////////////////
      // TO OPTION OUTPUT
      else if (to != 0) {
        var tempTo = Date.parse(to)
        var finalLog = []
        
        Users.findOne({_id: userId}, "-log._id", (err, data)=> {
          
          data.log.forEach((x) => {
            if(Date.parse(x.date)<tempTo)
            {
              finalLog.push(x)
            }
          
          })
          if(err) {
            res.send("wrong TO limit?")
          }
          else {
            res.json({
              _id: data._id,
              username: data.username,
              count: data.count,
              log: finalLog
            })
          }
        })  
      }
      /////////////////////////////////////////////////////////
      //NO EXTRA OPTIONS OUTPUT
      else {
        Users.findOne({_id: userId},"-log._id",  (err, data)=> {
        if(err) {
          res.send("error fetching data")
        }
        else{
          res.json(data)
        }
      })
      }
      /////////////////////////////////////////////////////////
    }
  })
})
//////////////////////////////////////////////////////////////////////
















const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
