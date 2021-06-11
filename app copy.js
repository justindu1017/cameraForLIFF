var express = require("express");
var fs = require("fs");
var cfenv = require("cfenv");
var bodyParser = require("body-parser");
var app = express();

var stream = require("stream");

app.use(bodyParser.json());

// serve the files out of ./public as our main files
// app.use(express.static(__dirname + '/public'));

app.post("/test", authProcess, (req, res) => {
  req.on("data", (chunk) => {
    console.log("You received a chunk of data", chunk);
    try {
      fs.appendFileSync(
        __dirname + "/public/videos/" + newFileName() + ".webm",
        chunk
      );
    } catch (error) {
      console.log("err with ", error);
    }
  });

  console.log(req.file);

  req.on("end", () => {
    res.end();
  });
});

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, "0.0.0.0", function () {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

// the auth process
// looking for cert in header
function authProcess(req, res, next) {
  let authCode = req.headers.authcode;
  let Referer = req.headers.referer;

  if (
    authCode === "fromLine" &&
    Referer === "https://liff.line.me/1656053787-5zn8QjRX"
  ) {
    console.log("auth pass");
    next();
  } else {
    res.status(401);
    res.send("還敢亂打阿冰鳥");
  }
}

// the function to create the name of the video get from request body
function newFileName() {
  const nowDate = new Date();
  const year = nowDate.getFullYear();
  const manth = nowDate.getMonth();
  const date = nowDate.getDate();
  const hour = nowDate.getHours();
  const minute = nowDate.getMinutes();
  const second = nowDate.getSeconds();

  const fName =
    year + "-" + manth + "-" + date + "_" + hour + "-" + minute + "-" + second;
  console.log("created fName..." + fName);
  return fName;
}
