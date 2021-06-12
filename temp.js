function test2(num) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(num);
      resolve();
    }, 3000);
  });
}

function testFunc() {
  return new Promise((resolve, reject) => {
    console.log("1");
    console.log("2");
    console.log("3");
    console.log("4");

    test2(5).then(() => {
      console.log("6");
      resolve("OKK");
    });
  });
}

testFunc().then((res) => {
  console.log(res);
});
