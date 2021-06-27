const { exec } = require("child_process");

exec("ffmpeg", (err, stdout, stderr) => {
  console.log(stderr);
});

// testfun();

// function pro1() {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       console.log("OKK");
//       resolve();
//     }, 4000);
//   });
// }

// async function testfun() {
//   console.log("START~");
//   await pro1();
//   console.log("FF");
// }
