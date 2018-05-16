var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
var middleware = require("./middleware/middleware.js")
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": {
    short_URL: "b2xVn2",
    long_URL: "http://www.lighthouselabs.ca",
    user_id: "userRandomID"
  },
  "9sm5xK": {
    short_URL: "9sm5xK",
    long_URL: "http://www.google.com",
    user_id: "userRandomID"
  }
};


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

app.get("/", function(req, res){
  res.end("Hello!");
});

app.get("/urls", function(req, res){
  var currentUserId = req.cookies["user_id"]
  let templateVars = { user: users[currentUserId], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//the page for adding a new URL
app.get("/urls/new", middleware.checkCurrentUser,function(req, res){
  var currentUserId = req.cookies["user_id"]
  let templateVars = { user: users[currentUserId] }
  res.render("urls_new", templateVars);
});

//add new URL data to database object
app.post("/urls", function(req, res){
  var randomString = generateRandomString();
  urlDatabase[randomString] = {short_URL: randomString, long_URL: req.body.longURL, user_id: req.cookies["user_id"]};  // debug statement to see POST parameters
  res.redirect("/urls");         // Respond with 'Ok' (we will replace this)
});

//edit page for each URL
app.get("/urls/:id", function(req, res){
  //if you haven't login
  //if the id does not exist in database
  //if the url is not made by current user
  //send a error message
  if(req.cookies["user_id"] === undefined){
    res.send("You have to login")
  } else if (urlDatabase[req.params.id] === undefined){
    res.send("No page Found")
  } else if (req.cookies["user_id"] !== urlDatabase[req.params.id].user_id){
    res.send("You are not authorized!!")
  } else {
    var currentUserId = req.cookies["user_id"]
    let templateVars = { user: users[currentUserId], shortURL: req.params.id, url: urlDatabase[req.params.id]};
    res.render("urls_show", templateVars);
  }
});

//set the updated URL
app.post("/urls/:id", function(req, res){
  var newLongURL = req.body.updatedURL
  urlDatabase[req.params.id].long_URL = newLongURL;
  res.redirect("/urls");
})

//get into the URL with the shortURL
app.get("/u/:shortURL", function(req, res){
  let longURL = urlDatabase[req.params.shortURL].long_URL;
  res.redirect(longURL);
});

//delete the URL by owner
app.post("/urls/:id/delete", function(req, res){
  if(req.cookies["user_id"] !== urlDatabase[req.params.id].user_id){
    res.send("You are not authorized to delete this URL")
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls")
})

app.get("/login", function(req, res){
  var currentUserId = req.cookies["user_id"];
  let templateVars = { user: users[currentUserId] };
  res.render("urls_login", templateVars)
})

app.post("/login", function(req, res){
  var email = req.body.email;
  var password = req.body.password;
  for(var user in users){
    //check if matching information with users database
    if(users[user].email === email && users[user].password === password){
      res.cookie("user_id", user);
      return res.redirect("/urls");
    }
  }
  //if not found, send error message to users
  res.send("403 status code, email or password is wrong")
})

app.post("/logout", function(req, res){
  res.clearCookie("user_id");
  res.redirect("/urls");
})

app.get("/register", function(req, res){
  var currentUserId = req.cookies["user_id"];
  let templateVars = { user: users[currentUserId] };
  res.render("urls_register", templateVars);
})

app.post("/register", function(req, res){
  //check if there is same email in the database
  for(var user in users){
    if(users[user].email === req.body.email){
      return res.send("400 status code, existing email");
    }
  }
  //cannot be empty value for both
  if(req.body.email === "" || req.body.password === ""){
    return res.send("400 status code, email or password cannot be empty");
  }
  userId = generateRandomString()
  users[userId] = {id: userId, email: req.body.email, password: req.body.password};
  res.cookie("user_id", userId);
  res.redirect("/urls");
})

app.get("/urls.json", function(req, res) {
  res.json(urlDatabase);
});

app.get("/hello", function(req, res){
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});


app.listen(PORT, function(){
  console.log(`Example app listening on port ${PORT}!`);
});