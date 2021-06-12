const express = require("express");
const fs = require("fs");
const cfenv = require("cfenv");
const bodyParser = require("body-parser");
const app = express();
const ffmpeg = require("fluent-ffmpeg");
const streamBuffers = require("stream-buffers");
const stream = require("stream");
const { resolve } = require("path");
const { reject } = require("delay");
const { on } = require("events");

app.use(bodyParser.json());

// to avoid CROS
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5500");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type,authcode"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

// serve the files out of ./public as our main files
app.use(express.static(__dirname + "/public"));

// // for file listing
// app.post("/getImg", (req, res) => {
//   res.json();
// });

app.post("/test", authProcess, (req, res) => {
  // when get data,
  // the data variable will concat the receiving datas
  // due to the limitation of browser, if the data size
  // is larger than 68486(approximately 8MB),
  // the data will be chopped into several small data which
  // has the maximum size of 68486(i think is the browser, brcause EDGE and Firefox show different limitation)
  let data = new Buffer.from("");

  req.on("data", (chunk) => {
    console.log("you got ", chunk);
    data = Buffer.concat([data, chunk]);
  });
  req.on("end", () => {
    console.log("in end");
    try {
      let readableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
        initialSize: 100 * 1024, // start at 100 kilobytes.
        incrementAmount: 10 * 1024, // grow by 10 kilobytes each time buffer overflows.
      });

      readableStreamBuffer.put(data);
      readableStreamBuffer.stop();

      let fName = newFileName();
      toMP4(readableStreamBuffer, fName).then(() => {
        res.json({ res: "OKK" });
      });
    } catch (error) {
      console.log("err with ", error);
    }
  });
});

function toMP4(readableStreamBuffer, fName) {
  return new Promise((resolve, reject) => {
    // ffmpeg(readableStreamBuffer)
    //   .outputOptions([
    //     "-movflags frag_keyframe+empty_moov",
    //     "-movflags +faststart",
    //   ])
    //   .toFormat("mp4")
    //   .output(__dirname + "/public/videos/" + fName + ".mp4")
    //   .run();

    ffmpeg(readableStreamBuffer)
      .outputOptions([
        "-movflags frag_keyframe+empty_moov",
        "-movflags +faststart",
      ])
      .toFormat("mp4")
      .save(__dirname + "/public/videos/" + fName + ".mp4")
      .on("end", () => {
        console.log(`Video rendered`);
        return resolve();
      })
      .on("error", (err) => {
        return reject();
      });
  });
}

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

  if (authCode === "fromLine") {
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
  // console.log("created fName..." + fName);
  return fName;
}
