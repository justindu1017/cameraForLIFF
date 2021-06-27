const express = require("express");
const fs = require("fs");
const cfenv = require("cfenv");
const bodyParser = require("body-parser");
const ffmpeg = require("fluent-ffmpeg");
const streamBuffers = require("stream-buffers");
const stream = require("stream");
const ejs = require("ejs");
const helmet = require("helmet");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const { exec } = require("child_process");
const dateFormatter = require("./dateFormatter.js");
const app = express();

var csrfProtection = csrf({ cookie: true });
var parseForm = bodyParser.urlencoded({ extended: false });

app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "script-src": [
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.1/dist/umd/popper.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/axios/0.9.1/axios.min.js",
        "https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js",
        "https://webrtc.github.io/adapter/adapter-latest.js",
      ],
      "style-src": [
        "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/5.0.2/css/bootstrap.min.css",
        "'self'",
      ],
    },
    // reportOnly: true,
  })
);

app.use(cookieParser());

app.use(bodyParser.json());

// serve the files out of ./public as our main files
app.use("/js", express.static(__dirname + "/public/js"));
app.use("/stylesheets", express.static(__dirname + "/public/stylesheets"));

app.use("/backend", express.static(__dirname + "/backend"));
// app.use("/backend/videos", express.static(__dirname + "backend/videos"));

// testing with render engine
app.engine("html", ejs.renderFile);
app.set("view engine", "html");

app.get("/", csrfProtection, (req, res) => {
  res.render(__dirname + "/public/index.html", {
    csrfToken: req.csrfToken(),
  });
});

app.post("/postStream", csrfProtection, (req, res) => {
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
        initialSize: 10 * 1024,
        incrementAmount: 10 * 512,
      });

      readableStreamBuffer.put(data);
      readableStreamBuffer.stop();

      let fName = newFileName();
      toMP4(readableStreamBuffer, fName)
        .then(() => {
          res.json({ status: "success" });
        })
        .catch((err) => {
          console.log("err toMp4 Reject ", err);
          noFFmpegInstalled(data, fName)
            .then((resolve) => res.json({ status: "resolve" }))
            .catch((err) => res.json({ err: err }));
        });
    } catch (error) {
      console.log("err with ", error);
    }
  });
});

// for file listing
app.post("/getList", (req, res) => {
  const dirForVideo = __dirname + "/backend/videos";
  let returnArr = [];
  fs.readdir(dirForVideo, (err, files) => {
    for (var file of files) {
      const status = fs.statSync(dirForVideo + "/" + file);
      const disDate = new dateFormatter(status.mtime);
      const fileInfo = {};
      fileInfo.fileName = file;
      fileInfo.lastModifiedTime = disDate.displayToSecond();
      returnArr.push(fileInfo);
    }
    res.json(returnArr);
  });
});

// get the app environment from Cloud Foundry
// var appEnv = cfenv.getAppEnv();

// // start server on the specified port and binding host
// app.listen(appEnv.port, "0.0.0.0", function () {
//   // print a message when the server starts listening
//   console.log("server starting on " + appEnv.url);
// });

port = process.env.PORT || 8080;

app.listen(port, function () {
  // print a message when the server starts listening
  console.log("server starting on " + port);
});

// the function to create the name of the video get from request body
function newFileName() {
  const nowDate = new Date();
  const year = nowDate.getFullYear();
  const month = nowDate.getMonth();
  const date = nowDate.getDate();
  const hour = nowDate.getHours();
  const minute = nowDate.getMinutes();
  const second = nowDate.getSeconds();

  const fName =
    year +
    "-" +
    (month + 1) +
    "-" +
    date +
    "_" +
    hour +
    "-" +
    minute +
    "-" +
    second;
  return fName;
}

function toMP4(readableStreamBuffer, fName) {
  return new Promise((resolve, reject) => {
    ffmpeg(readableStreamBuffer)
      .outputOptions([
        "-movflags frag_keyframe+empty_moov",
        "-movflags +faststart",
      ])
      .toFormat("mp4")
      .save(__dirname + "/backend/videos/" + fName + ".mp4")
      .on("end", () => {
        console.log(`Video rendered`);
        return resolve();
        // return reject();
      })
      .on("error", (err) => {
        return reject(err);
      });
  });
}

function noFFmpegInstalled(data, fName) {
  return new Promise((resolve, reject) => {
    console.log("in noFFmpegInstalled");
    fs.appendFile(
      __dirname + "/backend/videos/" + fName + ".webm",
      data,
      (err) => {
        if (err) reject();
        else {
          try {
            exec(
              `./ffmpeg -i ${__dirname}/backend/videos/${fName}.webm ${__dirname}/backend/videos/${fName}.mp4`,
              (err, stdout, stderr) => {
                console.log("deleting...");
                exec(
                  `rm ${__dirname}/backend/videos/${fName}.webm`,
                  (err, stdout, stderr) => {
                    resolve();
                  }
                );
              }
            );
          } catch (err) {
            reject(err);
          }
        }
      }
    );
  });
}
