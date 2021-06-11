const ffmpeg = require("fluent-ffmpeg");
console.log(__dirname);
// ffmpeg("1.webm").toFormat("mp4").output("fff.mp4").run();
ffmpeg("1.webm").output("fff.mp4").run();
