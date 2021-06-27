// const { exec } = require("child_process");

// exec(
//   "ffmpeg -i C:\\Users\\Jacques_Du\\Desktop\\CODE\\IBM\\cameraLIFFTest-master\\backend\\videos\\2021-6-15_0-46-42.mp4 C:\\Users\\Jacques_Du\\Desktop\\CODE\\IBM\\cameraLIFFTest-master\\backend\\videos\\2021.avi",
//   (err, stdout, stderr) => {
//     console.log(err);
//     // console.log(stderr);
//   }
// );

testfun();

function pro1() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log("OKK");
      resolve();
    }, 4000);
  });
}

async function testfun() {
  console.log("START~");
  await pro1();
  console.log("FF");
}
