"use strict";

const express         = require("express");
const app             = express();
const bodyParser      = require("body-parser");
const methodOverride  = require('method-override');
var cookieParser      = require('cookie-parser');


// ----------------------------------------------------------------------------
// Config

const PORT    = process.env.PORT || 8080;
app.set('view engine', 'ejs');

// ----------------------------------------------------------------------------
// Middleware

app.use(bodyParser.urlencoded( { extended: false } ));
app.use(methodOverride('_method'));
app.use(cookieParser());

// ----------------------------------------------------------------------------
// Data

let data = {
  users: [
    {
      id: "1",
      email: "paulocamboim@gmail.com",
      password: "123"
    },

    {
      id: "2",
      email: "email@email.com",
      password: "1234"
    }
  ],

  urls: [
    {
      id: "b2xVn2",
      longUrl: "http://www.lighthouselabs.ca",
      idUser: "1"
    },
    {
      id: "9sm5xK",
      longUrl: "http://www.google.com",
      idUser: "1"
    },
    {
      id: "ui2h3",
      longUrl: "http://www.globo.com.br",
      idUser: "2"
    }

  ]

};

// ----------------------------------------------------------------------------
// Functions

/**
 * Generate a random string with 6 digits long
 *
 * Note:
 * Base36 is a binary-to-text encoding scheme that represents binary data in an
 * ASCII string format by translating it into a radix-36 representation.
 * The choice of 36 is convenient in that the digits can be represented using
 * the Arabic numerals 0–9 and the Latin letters A–Z[1] (the ISO basic Latin alphabet).
 *
 * Source: https://en.wikipedia.org/wiki/Base36
 *
 * @param {integer} n         - The random string length
 */

function generateRandomString(n) {
  return Math.random().toString(36).substr(2, n);
}

/**
 * Find user in array by Id
 *
 * @param {integer} id        - User's id
 * @param {array} array       - An array with many users
 */

function findUserById(id, arr) {
  return arr.find( function(user) {
    return id == user.id;
  });
}

/**
 * List all URLs from a specific user
 *
 * @param {integer} id        - User's id
 * @param {array} array       - An array with many urls
 */


function findUrlByUserId(id, arr) {
  return arr.filter( function(url) {
    return id == url.idUser;
  });
}

/**
 * Return an URL by ID, only if the idUser own the url
 *
 * @param {integer} id        - URL id - ie. Short Url
 * @param {integer} idUser    - User's id
 * @param {array} array       - An array with many urls
 */

function findUrlById(id, idUser, arr) {
  return arr.find( function(url) {
    return id == url.id && idUser == url.idUser;
  });
}

// ----------------------------------------------------------------------------
// Routers

// ----------------------------------------------------------------------------
// Authtentication Sutff

app.get("/login", (req,res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  var user = data.users.find( function(user) {
    return email === user.email && password === user.password
  });

  if(user) {
    res.cookie("user_id" , user.id);
    res.redirect("/");
  } else {
    res.status(403).send("Email not found or Passoword incorrect");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id").redirect("/");
});

// Create a new user
app.get("/register", (req,res) => {
  res.render("register");
});

app.post("/register", (req,res) => {

  // Add user to database
  let id        = generateRandomString(10);
  let email     = req.body.email;
  let password  = req.body.password;

  // Find if email is already registered
  var emailExists = data.users.find( function(user) {
    return email === user.email
  });

  if ((emailExists) || (email === "") || (password === "")) {
    res.status(400).send("Email already registered! / Email or Username blank");
  } else {
    // add user
    data.users.push({ id: id, email: email, password: password });
    res.cookie("user_id", id).redirect("/");
  }
});


// ----------------------------------------------------------------------------
// CREATE (CRUD)

// Render page to add an URL
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: findUserById(req.cookies["user_id"], data.users)
  };

  if(req.cookies.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.sendStatus(401);
  }
});

// Add a new URL
app.post("/urls", (req, res) => {

  const idUser = req.cookies.user_id;

  data.urls.push( {
    id: generateRandomString(6),
    longUrl: req.body.longUrl,
    idUser: idUser
  });

  res.redirect("/urls");
});

// ----------------------------------------------------------------------------
// READ (CRUD)

app.get("/", (req, res) => {
  if(req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Show all urls
app.get("/urls", (req, res) => {

  let idUser = req.cookies["user_id"];

  let templateVars = {
    urls: findUrlByUserId(idUser, data.urls),
    user: findUserById(idUser, data.users)
  };

  if(req.cookies.user_id) {
    res.render("urls_index", templateVars);
  } else {
    res.sendStatus(401);
  }
});

// Show details of tinyUrl
app.get("/urls/:id", (req, res) => {

  let id      = req.params.id;
  let idUser  = req.cookies["user_id"];
  let url     = findUrlById(id, idUser, data.urls);

  // In case the tinyUrl not exist return 404
  if (url) {
    let templateVars = {
      url: url,
      user: findUserById(req.cookies["user_id"], data.users)
    };
    res.render("urls_show", templateVars);
  } else {
    res.sendStatus(404);
  }
});

// ----------------------------------------------------------------------------
// UPDATE (CRUD)

// Update an URL
app.put("/urls/:id", (req, res) => {

  const id      = req.params.id;
  const idUser  = req.cookies["user_id"];
  const url     = findUrlById(id, idUser, data.urls);


  // Check if the user own that url
  if(url) {
    const i = data.urls.findIndex( function(url) {
      return id == url.id && idUser == url.idUser;
    });

   data.urls[i].longUrl = req.body.longUrl;
   res.redirect("/urls");
  } else {
    res.sendStatus(400);
  }


});

// ----------------------------------------------------------------------------
// DELETE (CRUD)

// Delete url
app.delete("/urls/:id/delete", (req, res) => {

  const id      = req.params.id;
  const idUser  = req.cookies["user_id"];
  const url     = findUrlById(id, idUser, data.urls);

  // Check if the user own that url
  if (url) {
    const i = data.urls.findIndex( function(url) {
      return id == url.id && idUser == url.idUser;
    });

    delete data.urls[i];
  }

  res.redirect("/urls");
});

// ----------------------------------------------------------------------------
// MISC ROUTERS

// Redirect from shortUrl to LongUrl
app.get("/u/:shortURL", (req, res) => {

  const id = req.params.shortURL;
  let url = data.urls.find( function(url) {
    return id == url.id;
  });

  if(url) {
    res.redirect(url.longUrl);
  } else {
    res.sendStatus(404);
  }

});

// Display JSON with URLS
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// ----------------------------------------------------------------------------
// Listening for incoming connections

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});