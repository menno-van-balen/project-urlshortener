"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dns = require("dns");
const { DB_URI } = require("./config");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

const schema = mongoose.Schema;

// we need a schema with original_url and short_url
const urlSchema = new schema({
  original_url: { type: String, required: true },
  short_url: { type: String, required: true },
});

const Url = mongoose.model("Url", urlSchema);

// we need a schema with count to keep track of the (last) short url's used
const countSchema = new schema({
  count: Number,
});

const Count = mongoose.model("Count", countSchema);

// find last count (else create the first one) and update count (+ 1) function
// (for every countnumber there should be a short_url)
const findCount = () => {
  Count.find({})
    .exec()
    .then((doc) => {
      if (doc[0]) {
        return (count = doc[0].count);
      } else {
        count = 1;
        console.log("creating count");
        Count.create({ count: 1 }, (err) => {
          if (err) console.log(err);
        });
      }
    })
    .catch((err) => console.log(err));
};

const onePlusCount = () => {
  Count.findOneAndUpdate(
    { count: count },
    { count: (count += 1) },
    { new: true }
  ).catch((err) => console.log(err));
};

// find original_url, create url and find short_url functions
const findOriginal_url = (original_url, short_url, res) => {
  Url.findOne({ original_url })
    .exec()
    .then((doc) => {
      if (doc) {
        console.log("url already in database");
        const original_url = doc.original_url;
        const short_url = doc.short_url;
        res.json({ original_url, short_url });
      } else {
        console.log("creating new short_url");
        createUrl(original_url, short_url, res);
        onePlusCount();
      }
    })
    .catch((err) => console.log(err));
};

const createUrl = (original_url, short_url, res) => {
  Url.create({
    original_url,
    short_url,
  })
    .then((doc) => {
      const original_url = doc.original_url;
      const short_url = doc.short_url;
      res.json({ original_url, short_url });
    })
    .catch((err) => console.log(err));
};

const findShort_url = (short_url, res) => {
  Url.findOne({ short_url })
    .exec()
    .then((doc) => {
      if (doc) {
        const original_url = doc.original_url;
        console.log("redirecting to: ", original_url);
        return res.redirect(original_url);
      } else {
        res.json({ error: "this short_url doesn't exist" });
      }
    })
    .catch((err) => console.log(err));
};

// init count on pageload
let count;
findCount();

// handle new url requests
app.post("/api/shorturl/new", (req, res) => {
  console.log("request for new shor_url: ", count);
  const original_url = req.body.url;
  const short_url = count.toString();
  dns.lookup(original_url.replace(/^https?:\/\//, ""), (err) => {
    if (err) {
      console.log(err);
      res.json({ error: "invalid URL" });
    } else {
      findOriginal_url(original_url, short_url, res);
    }
  });
});

// handle short_url requests
app.get("/api/shorturl/:short_url", (req, res) => {
  const short_url = req.params.short_url;
  console.log("request for link short_url nr: ", short_url);
  findShort_url(short_url, res);
});

// init server
app.listen(port, function () {
  console.log("Node.js listening ...");
});
