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

// we need a schema with id, original_url and short_url
const urlSchema = new schema({
  // id: { type: Number, required: true },
  original_url: { type: String, required: true },
  short_url: { type: String, required: true },
});

const Url = mongoose.model("Url", urlSchema);

// we need a schema with count to keep track of the short url's used
const countSchema = new schema({
  count: Number,
});

const Count = mongoose.model("Count", countSchema);

// find last count on pageloading and update count
// for every countnumber there is a short_url
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

// find url
const findUrl = (original_url, short_url, res) => {
  Url.findOne({ original_url })
    .exec()
    .then((doc) => {
      if (doc) {
        const original_url = doc.original_url;
        const short_url = doc.short_url;
        res.json({ original_url, short_url });
      } else {
        console.log("creating url");
        createUrl(original_url, short_url, res);
        onePlusCount();
      }
    })
    .catch((err) => console.log(err));
};

const createUrl = (original_url, short_url, res) => {
  Url.create(
    {
      original_url,
      short_url,
    }
    // (err) => console.log(err)
  )
    .then((doc) => {
      const original_url = doc.original_url;
      const short_url = doc.short_url;
      res.json({ original_url, short_url });
    })
    .catch((err) => console.log(err));
};

// get post url
let count;
findCount();
app.post("/api/shorturl/new", function (req, res) {
  console.log(count);
  const original_url = req.body.url.replace(/^https?:\/\//, "");
  const short_url = count.toString();
  dns.lookup(original_url, (err) => {
    if (err) {
      console.log(err);
      res.json({ error: "invalid URL" });
    } else {
      findUrl(original_url, short_url, res);
    }
  });
});

app.listen(port, function () {
  console.log("Node.js listening ...");
});
