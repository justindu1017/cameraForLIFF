const { exec } = require("child_process");

exec("dir", (err, stdout, stderr) => {
  console.log(stdout);
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
