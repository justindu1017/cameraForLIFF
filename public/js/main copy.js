Vue.config.devtools = true;

var indexVue = new Vue({
  el: "#mainDiv",
  data: {
    isRecording: false,
    recorder: "",
  },
  methods: {
    startRecord() {
      console.log("recording...");
      MediaRecorder.isTypeSupported("video/webm;codecs=h264")
        ? this.recordH264()
        : this.recordVp8();
      this.isRecording = true;
    },
    stopRecord() {
      var reqInfo;

      console.log("stop recording...");
      this.recorder.ondataavailable = (e) => {
        // console.log("here: ", e);
        // var a = document.createElement("a");
        // a.download = ["video_", (new Date() + "").slice(4, 28), ".webm"].join("");
        // a.href = URL.createObjectURL(e.data);
        // a.textContent = a.download;
        // document.getElementById("as").appendChild(a);

        console.log("user press stop record...");
        reqInfo = {
          headers: {
            referer: "https://liff.line.me/1656053787-5zn8QjRX",
            authcode: "fromLine",
          },
          data: e.data,
        };
        console.log("the info is ", reqInfo);
      };
      setTimeout(() => {
        console.log("here is ", reqInfo);
      }, 3000);
      //    need to change url
      axios
        .post("http://localhost:6003/test", reqInfo)
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log("err ", err);
        });

      this.recorder.stop();

      this.isRecording = false;
    },
    recordH264() {
      this.recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=h264",
      });
      this.recorder.start();
    },
    recordVp8() {
      this.recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8",
      });
      this.recorder.start();
    },
  },
  computed: {
    Recording() {
      return this.isRecording;
    },
  },
});

const videoConstrain = {
  video: true,
  // audio: true,
};
const localVideo = document.querySelector("video");
var stream;

function getMediaSuccess(mediaStream) {
  //   $("localVideo").attr("srcObject") = mediaStream;
  stream = mediaStream;
  localVideo.srcObject = mediaStream;
}

function getMediaFailed(err) {
  console.log("getUserMedia jump to catch with err: ", err);
}

function streamVideo() {
  console.log("streaming...");

  navigator.mediaDevices
    .getUserMedia(videoConstrain)
    .then(getMediaSuccess)
    .catch(getMediaFailed);
}

streamVideo();
