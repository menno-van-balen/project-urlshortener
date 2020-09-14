"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { DB_URI } = require("./config");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
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

const url = mongoose.model("url", urlSchema);

// get post url
let count = 0;
app.post("/api/shorturl/new", function (req, res) {
  count += 1;
  const original_url = req.body.url.replace(/^https?:\/\//, "");
  const short_url = count.toString();
  console.log(short_url);
  // res.json({ greeting: "hello API" });
});

app.listen(port, function () {
  console.log("Node.js listening ...");
});
