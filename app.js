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

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
 * @param {integer} n - The random string length
 */

function generateRandomString(n) {
  return Math.random().toString(36).substr(2, n);
}

// ----------------------------------------------------------------------------
// Routers

// ----------------------------------------------------------------------------
// Authtentication Sutff

app.post("/login", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  res.cookie("username" , username).redirect("/");
});

app.post("/logout", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  res.clearCookie("username").redirect("/");
});

// ----------------------------------------------------------------------------
// CREATE (CRUD)

// Render page to add an URL
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

// Add a new URL
app.post("/urls", (req, res) => {

  // Generate a unique tinyUrl
  let shortURL = generateRandomString(6);

  // add the new url to array
  urlDatabase[shortURL] = req.body.longURL;

  res.redirect("/urls");
});

// ----------------------------------------------------------------------------
// READ (CRUD)

app.get("/", (req, res) => {
  if(req.cookies.username) {
    res.redirect("/urls");
  } else {
    res.render("login");
  }
});

// Show all urls
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

// Show details of tinyUrl
app.get("/urls/:id", (req, res) => {

  let id = req.params.id;

  // In case the tinyUrl not exist return 404
  if (urlDatabase[id]) {
    let templateVars = {
      shortURL: id,
      fullURL: urlDatabase[id],
      username: req.cookies["username"]
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
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// ----------------------------------------------------------------------------
// DELETE (CRUD)

// Delete url
app.delete("/urls/:id/delete", (req, res) => {
  // id
  let id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");

});

// ----------------------------------------------------------------------------
// MISC ROUTERS

// Redirect from shortUrl to LongUrl
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if(longURL) {
    res.redirect(longURL);
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