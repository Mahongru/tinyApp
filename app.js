const express       = require("express");
const app           = express();
const bodyParser    = require("body-parser");


// ----------------------------------------------------------------------------
// Config

// default port 8080
const PORT    = process.env.PORT || 8080;

app.set('view engine', 'ejs');

// ----------------------------------------------------------------------------
// Middleware

app.use(bodyParser.urlencoded( { extended: false } ));

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
 * @param {integer} n - The random string length
 */

function generateRandomString(n) {
  return Math.random().toString(36).substr(2, n);
}

// ----------------------------------------------------------------------------
// Routers


app.get("/", (req, res) => {
  res.render("index", { urls: {} } );
});

// Render page to add an URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new", { urls: {} } );
});

// Show all urls
app.get("/urls", (req, res) => {
  res.render("urls_index", { urls: urlDatabase });
});

// Add a new URL
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// Show specific url
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    fullURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

// Redirect from shortUrl to LongUrl
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if(longURL) {
    res.redirect(longURL);
  } else {
    res.status(404);
    res.send("NOT FOUND!");
  }
});

//
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


// ----------------------------------------------------------------------------
// Listening for incoming connections

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});