"use strict";

const express         = require("express");
const app             = express();
const bodyParser      = require("body-parser");
const methodOverride  = require('method-override');
const cookieSession   = require('cookie-session');
const bcrypt          = require('bcrypt');
const uuid            = require('uuid');


// ----------------------------------------------------------------------------
// Config

const PORT    = process.env.PORT || 8080;
app.set('view engine', 'ejs');

// ----------------------------------------------------------------------------
// Middleware

app.use(bodyParser.urlencoded( { extended: false } ));
app.use(methodOverride('_method'));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// ----------------------------------------------------------------------------
// Data

const data = {
  users: [
    {
      id: "1",
      email: "paulocamboim@gmail.com",
      //123
      password: "$2a$05$JwWUQH7pt29/stg559a5EOJxYHNqIs568Q3BmwGtYIhzqvpwC0hu."
    },

    {
      id: "2",
      email: "email@email.com",
      password: "$2a$05$JwWUQH7pt29/stg559a5EOJxYHNqIs568Q3BmwGtYIhzqvpwC0hu."
    }
  ],

  urls: [
    {
      id: "b2xVn2",
      longUrl: "http://www.lighthouselabs.ca",
      user_id: "1"
    },
    {
      id: "9sm5xK",
      longUrl: "http://www.google.com",
      user_id: "1"
    },
    {
      id: "ui2h3",
      longUrl: "http://www.globo.com.br",
      user_id: "2"
    }
  ],
  logs: [

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
    return id === user.id;
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
    return id === url.user_id;
  });
}

/**
 * Return an URL by ID, only if the user_id own the url
 *
 * @param {integer} id        - URL id - ie. Short Url
 * @param {integer} user_id    - User's id
 * @param {array} array       - An array with many urls
 */

function findUrlById(id, user_id, arr) {
  return arr.find( function(url) {
    return id === url.id && user_id === url.user_id;
  });
}

// ----------------------------------------------------------------------------
// Middlewares

/**
 * Verify if a cookie exists. If yes, get all information that will be used
 * Set "res.locals" for data be available inside all EJS templates
 *
 */

app.use((req, res, next) => {

  if(req.session.user_id) {
    req.user = findUserById(req.session.user_id, data.users);

    // User doesnt exists anymore, get rid of cookie
    // It happens when sign up a user and then restart ther server
    if(!req.user) {
      req.session = null;
      return res.redirect('/');
    }

    req.urls = findUrlByUserId(req.user.id, data.urls);


    // All EJS Template can access
    res.locals.user = req.user;
    res.locals.urls = req.urls;
    res.locals.logs = data.logs;
  }

  res.isAuthenticated = !!req.user;

  next();
});

const authenticatedMiddleware = (req, res, next) => {

  if(!res.isAuthenticated) {
    return res.status(401).send('Not authenticated');
  }
  next();
};

// ----------------------------------------------------------------------------
// Routers

// MUST be authenticated for access any /urls*
app.all("/urls*", authenticatedMiddleware);

// ----------------------------------------------------------------------------
// Authtentication Sutff

app.get("/login", (req, res) => res.render("login"));

app.post("/login", (req, res) => {
  // ES6 same as: email = req.body.email and password  = req.body.password;
  const { email, password } = req.body;

  // Check for email
  const user = data.users.find(user => user.email === email);

  if(!user) {
    return res.status(403).send("Email not found!!");
  }

  // bcrypt Async
  bcrypt.compare(password, user.password, (err, same) => {

    if(err) {
      return res.status(500).send(err.message);
    }

    if(!same) {
      return res.status(403).send("Invalid password");
    } else {
      req.session.user_id = user.id;
      res.redirect("/");
    }
  });
});

// Logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

// Create a new user
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {

  // Add user to database
  const id        = uuid.v1();
  const email     = req.body.email;
  const password  = req.body.password;
  const password2 = req.body.password2;

  // aSync
  bcrypt.hash(password, 10, (err, hash) => {

    if(err) {
      return res.status(500).send(err.message);
    }

    // Find if email is already registered
    const emailExists = data.users.find( function(user) {
      return email === user.email;
    });

    // Valid inputs by user?
    if ((emailExists) || (email === "") || (password === "") || (password !== password2)) {
      res.status(400).send("Email already registered! / Email or Username blank");
    } else {

      // add user
      data.users.push(
        {
          id: id,
          email: email,
          password: hash
        });

      let user = data.users.find( function(user) {
        return email === user.email && password === user.password;
      });

      req.session.user_id = id;
      res.redirect("/");
    }
  });
});

// ----------------------------------------------------------------------------
// CREATE (CRUD)

// Render page to add an URL
app.get("/urls/new", (req, res) => res.render("urls_new"));

// Add a new URL
app.post("/urls", (req, res) => {

  let longUrl = req.body.longUrl;

  if ( longUrl.indexOf("http://") < 0) {
    longUrl = "http://" + longUrl
  }

  data.urls.push({
    id: generateRandomString(6),
    longUrl ,
    user_id: req.user.id
  });

  res.redirect("/urls");
});

// ----------------------------------------------------------------------------
// READ (CRUD)

app.get("/", (req, res) => {
  if(req.user) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Show all urls
app.get("/urls", (req, res) => res.render("urls_index"));

// Show details of tinyUrl
app.get("/urls/:id", (req, res) => {

  const id      = req.params.id;
  const url     = findUrlById(id, req.user.id, data.urls);

  // In case the tinyUrl not exist return 404
  if (url) {
    res.render("urls_show", { url });
  } else {
    res.sendStatus(401);
  }
});

// ----------------------------------------------------------------------------
// UPDATE (CRUD)

// Update an URL
app.put("/urls/:id", (req, res) => {

  const id      = req.params.id;
  const url     = findUrlById(id, req.user.id, data.urls);

  // Check if the user own that url
  if(url) {
    url.longUrl = req.body.longUrl;
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
  const url     = findUrlById(id, req.user.id, data.urls);

  data.urls = data.urls.filter(url => !(url.id === id && url.user_id === req.user.id));

  res.redirect("/urls");
});

// ----------------------------------------------------------------------------
// MISC ROUTERS

// Redirect from shortUrl to LongUrl
app.get("/u/:shortURL", (req, res) => {

  const id  = req.params.shortURL;

  let url = data.urls.find( function(url) {
    return id === url.id;
  });

  if(url) {

    // Count numbers of visitors
    url.count ? url.count += 1 : url.count = 1;

    // Create a cookie for identify users
    if (!req.session.visitor_id) {
      req.session.visitor_id = uuid.v1();
      url.uniqCount ? url.uniqCount += 1 : url.uniqCount = 1;
    }

    // Log
    data.logs.push({
      id: id,
      timestamp: new Date().getTime(),
      visitor_id: req.session.visitor_id
    });

    res.redirect(url.longUrl);
  } else {
    res.sendStatus(404);
  }

});

// ----------------------------------------------------------------------------
// Listening for incoming connections

app.get("/json", (req, res) => res.send(data));


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

