const express = require("express");
const fs = require("fs");
// const { unlink } = require("fs/promises");
const cfenv = require("cfenv");
const bodyParser = require("body-parser");
const ffmpeg = require("fluent-ffmpeg");
const streamBuffers = require("stream-buffers");
const ejs = require("ejs");
const helmet = require("helmet");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const { exec } = require("child_process");
// const cors = require("cors");
const dateFormatter = require("./dateFormatter.js");

const app = express();

//implement Cross-site request forgery protection
var csrfProtection = csrf({ cookie: true });
// inclued due to cookie: true in csrfProtection
app.use(cookieParser());

var parseForm = bodyParser.urlencoded({ extended: false });

// implement helmet
app.use(helmet());
// to allow loading js and css file from local or cdn, must set the web address
//  of the package in script-src and style-src
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      // "connect-src": ["https://cameralifftest.us-south.cf.appdomain.cloud/"],
      "script-src": [
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/",
        "https://cdnjs.cloudflare.com/ajax/libs/",
      ],
      "style-src": ["https://cdnjs.cloudflare.com/ajax/libs/", "'self'"],
    },
    // reportOnly: true,
  })
);

app.use(bodyParser.json());

// serve the files out of ./public as our main files
app.use("/js", express.static(__dirname + "/public/js"));
app.use("/stylesheets", express.static(__dirname + "/public/stylesheets"));

app.use("/backend", express.static(__dirname + "/backend"));

// use ejs as render engine in order to render csrf on html dynamically
app.engine("html", ejs.renderFile);
app.set("view engine", "html");

// the route to index.html
// and randering csrfToken
app.get("/", csrfProtection, (req, res) => {
  res.render(__dirname + "/public/index.html", {
    csrfToken: req.csrfToken(),
  });
});

// when user "stop" recording, the frontend call this api
// in order to get the recorded video
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
    // ready to pass to streamBuffers
  });
  req.on("end", () => {
    console.log("in end");
    try {
      // initialize a new streamBuffers.ReadableStreamBuffer, which will later be user
      // as input of fluent-ffmpeg
      let readableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
        // the initial size of the streamBuffer
        initialSize: 10 * 1024,
        // everytime the size of incoming data exceed
        // current size of streamBuffer, the latter increase its size with 10*512
        incrementAmount: 10 * 512,
      });

      // put the data into the streambuffer
      readableStreamBuffer.put(data);
      readableStreamBuffer.stop();

      // initialize the filename of the mp4 file
      let fName = newFileName();
      // call toMp4
      toMP4(readableStreamBuffer, fName)
        .then(() => {
          res.json({ status: "success" });
        })
        .catch((err) => {
          // if something when wrong with fluent-ffmpeg
          // will jump to catch and perform noFFmpegInstalled
          console.log("err toMp4 Reject ", err);

          try {
            noFFmpegInstalled(data, fName)
              .then((resolve) => res.json({ status: resolve }))
              .catch((err) => res.status(500).send(err));
          } catch (error) {
            console.log("err withh ", error.toString());
            // res.status(500).send({ error: error.toString() });
            res.status(500).send({ error: error.toString() });
          }
        });
    } catch (error) {
      console.log("err with ", error);
      res.status(500).send({ error: error.toString() });
    }
  });
});

// for file listing in backend/index.html
app.post("/getList", (req, res) => {
  const dirForVideo = __dirname + "/backend/videos";
  let returnArr = [];
  fs.readdir(dirForVideo, (err, files) => {
    for (var file of files) {
      // making the list to return
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

// the function that convert the streambuffer object
// to mp4
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

// if ffmpeg is not installed or something when wrong
// with toMP4, will perform noFFmpegInstalled, also
// get the job done but much slower
function noFFmpegInstalled(data, fName) {
  return new Promise((resolve, reject) => {
    console.log("in noFFmpegInstalled");
    fs.appendFile(
      __dirname + "/backend/videos/" + fName + ".webm",
      data,
      (err) => {
        if (err) reject(err);
        else {
          try {
            exec(
              `./ffmpeg -i ${__dirname}/backend/videos/${fName}.webm ${__dirname}/backend/videos/${fName}.mp4`,
              (err, stdout, stderr) => {
                console.log("deleting...");
                // unlink(`${__dirname}/backend/videos/${fName}.webm`)
                //   .then((res) => {
                //     resolve("succrss");
                //   })
                //   .catch((err) => {
                //     reject(err);
                //   });
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
