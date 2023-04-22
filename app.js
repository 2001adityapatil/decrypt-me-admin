//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://adi:2001@cluster0.ozlgteg.mongodb.net/authDB?retryWrites=true&w=majority");
mongoose.set("useCreateIndex", true);

const adminSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  secret: String,
  username: String,
});

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  secret: String,
  username: String,
  task1: String,
  task2: String,
  task3: String,
  star: Number,
  time: Number,
});

adminSchema.plugin(passportLocalMongoose);
adminSchema.plugin(findOrCreate);

const Admin = new mongoose.model("Admin", adminSchema);
const User = new mongoose.model("User", userSchema);

passport.use(Admin.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  Admin.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get("/", function(req, res){
  // res.render("home");
  res.sendFile(__dirname + "/views/index.html")
});

app.get("/auth/google/admin",
  passport.authenticate('google', { failureRedirect: "/adminlogin" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/admin");
  });

app.get("/adminlogin", function(req, res){
  res.render("adminlogin");
});


app.get("/admin", function(req, res){
  Admin.find({"admin": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        

      User.find({}).count(function (err, totuser) {
          if (err)
             throw err;
             User.find({task1: "completed"}).count(function (err, task1) {
               if (err)
                  throw err;
              User.find({},(function(err, records){
                if(err) throw err;
                User.find({}).sort({star:-1, time: 1}).exec(function(err, rank1){
                  if(err) {throw err;}
                  
                  
                  let avgtime = 0;
                  User.aggregate([
                    {
                      $group:
                      {
                        _id: { task3: "$task3" },
                        time: { $avg: "$time" }
                      }
                    }
                  ])
                  .then(result => {
                    result.forEach(function(t){
                      if(t._id.task3 !== null)
                      avgtime = t.time;
                    })
                    res.render("admin", {totalusers:totuser, activeusers: task1, avgtime: avgtime, users: records, rank1: rank1[0]});
                  })
                  .catch(error => {
                    console.log(error)
                  })
                })
                }))
                
              });
                  
      });
      
      }
    }
  });
});

app.post("/deleteuser", function(req, res){
  var delitem = req.body.userid;
  // console.log(req.body);

  User.deleteOne({_id: ""+delitem}, function(err){
    if(err)
    console.log(err);
    else
    res.redirect("/admin");
});
})

app.get("/leaderboard", function(req, res){
  User.find({}).sort({star:-1, time: 1}).exec(function(err, result){
    if(err) {throw err;}
    // console.log(result);
    res.render("leaderboard", {res: result});
  }
  )
})


app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});



app.post("/adminlogin", function(req, res){
  
  const user = new Admin({
    username: req.body.username,
    password: req.body.password
  });
  
  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/admin");
      });
    }
  });
  
});




app.listen(3000, function() {
  console.log("Server started on port 3000.");
});

// app.get("/register", function(req, res){
//   res.render("register");
// });

// app.post("/register", function(req, res){

//   Admin.register({username: req.body.username}, req.body.password, function(err, user){
//     if (err) {
  //       console.log(err);
//       res.redirect("/register");
//     } else {
//       passport.authenticate("local")(req, res, function(){
  //         res.redirect("/admin");
//       });
//     }
//   });

// });

// app.get("/submit", function(req, res){
  //   if (req.isAuthenticated()){
    //     res.render("submit");
    //   } else {
      //     res.redirect("/login");
      //   }
      // });

      // app.post("/submit", function(req, res){
        //   const submittedSecret = req.body.secret;

        // //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
        //   // console.log(req.user.id);
        
        //   Admin.findById(req.user.id, function(err, foundUser){
//     if (err) {
//       console.log(err);
//     } else {
  //       if (foundUser) {
//         foundUser.secret = submittedSecret;
//         foundUser.save(function(){
//           res.redirect("/admin");
//         });
//       }
//     }
//   });
// });