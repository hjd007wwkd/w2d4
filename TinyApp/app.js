var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session');
var middleware = require("./middleware/middleware.js");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["secret"]
}));

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": {
    short_URL: "b2xVn2",
    long_URL: "http://www.lighthouselabs.ca",
    user_id: "userRandomID",
    date: "12/01/2015",
    visits: 0
  },
  "9sm5xK": {
    short_URL: "9sm5xK",
    long_URL: "http://www.google.com",
    user_id: "userRandomID",
    date: "12/05/2016",
    visits: 0
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

app.get("/", middleware.checkCurrentUser, function(req, res){
  res.redirect("/urls");
});

app.get("/urls", middleware.checkCurrentUserWError, function(req, res){
  var currentUserId = req.session.user_id;
  let templateVars = { user: users[currentUserId], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//the page for adding a new URL
app.get("/urls/new", middleware.checkCurrentUser,function(req, res){
  var currentUserId = req.session.user_id;
  let templateVars = { user: users[currentUserId] };
  res.render("urls_new", templateVars);
});

//add new URL data to database object
app.post("/urls", middleware.checkCurrentUserWError, function(req, res){
  var currentDate = new Date();
  var date = currentDate.getDate();
  var month = currentDate.getMonth();
  var year = currentDate.getFullYear();
  var dateString = (month + 1) + "/" + date + "/" + year;
  var randomString = generateRandomString();
  urlDatabase[randomString] = {short_URL: randomString, long_URL: req.body.longURL, user_id: req.session.user_id, date: dateString, visits: 0};
  res.redirect("/urls");
});

//edit page for each URL
app.get("/urls/:id", middleware.checkCurrentUserWError, function(req, res){
  //if you haven't login
  //if the id does not exist in database
  //if the url is not made by current user
  //send a error message
  if (urlDatabase[req.params.id] === undefined){
    res.send("<h2>No page Found</h2>");
  } else if (req.session.user_id !== urlDatabase[req.params.id].user_id){
    res.send("<h2>You are not authorized!!</h2>");
  } else {
    var currentUserId = req.session.user_id;
    let templateVars = { user: users[currentUserId], shortURL: req.params.id, url: urlDatabase[req.params.id]};
    res.render("urls_show", templateVars);
  }
});

//set the updated URL
app.post("/urls/:id", middleware.checkCurrentUserWError, function(req, res){
  if (req.session.user_id !== urlDatabase[req.params.id].user_id){
    return res.send("<h2>You are not authorized!!</h2>");
  }
  var newLongURL = req.body.updatedURL;
  urlDatabase[req.params.id].long_URL = newLongURL;
  res.redirect("/urls");
})

//get into the URL with the shortURL
app.get("/u/:shortURL", function(req, res){
  if (urlDatabase[req.params.shortURL] === undefined){
    return res.send("<h2>No page Found</h2>");
  }
  urlDatabase[req.params.shortURL].visits++;
  let longURL = urlDatabase[req.params.shortURL].long_URL;
  res.redirect(longURL);
});

//delete the URL by owner
app.post("/urls/:id/delete", middleware.checkCurrentUserWError, function(req, res){
  if(req.session.user_id !== urlDatabase[req.params.id].user_id){
    res.send("<h2>You are not authorized to delete this URL</h2>");
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
})

app.get("/login", function(req, res){
  if(req.session.user_id !== undefined){
    return res.redirect("/urls");
  }
  res.render("urls_login");
})

app.post("/login", function(req, res){
  var email = req.body.email;
  var password = req.body.password;
  for(var user in users){
    //check if matching information with users database
    if(users[user].email === email && bcrypt.compareSync(password, users[user].password)){
      req.session.user_id = user;
      return res.redirect("/urls");
    };
  };
  //if not found, send error message to users
  res.send("<h2>403 status code, email or password is wrong</h2>");
});

app.get("/register", function(req, res){
  if(req.session.user_id !== undefined){
    return res.redirect("/urls");
  };
  res.render("urls_register");
});

app.post("/register", function(req, res){
  //check if there is same email in the database
  for(var user in users){
    if(users[user].email === req.body.email){
      return res.send("400 status code, existing email");
    };
  };
  //cannot be empty value for both
  if(req.body.email === "" || req.body.password === ""){
    return res.send("400 status code, email or password cannot be empty");
  };
  var userId = generateRandomString();
  var passwordEnc = bcrypt.hashSync(req.body.password, 10);
  users[userId] = {id: userId, email: req.body.email, password: passwordEnc};
  req.session.user_id = userId;
  res.redirect("/urls");
});

app.post("/logout", function(req, res){
  req.session = null;
  res.redirect("/urls");
});

app.get("/urls.json", function(req, res) {
  res.json(urlDatabase);
});

app.get("/hello", function(req, res){
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});


app.listen(PORT, function(){
  console.log(`Example app listening on port ${PORT}!`);
});