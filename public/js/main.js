Vue.config.devtools = false;
Vue.config.debug = false;
$(function () {
  console.log("ready!");
  var indexVue = new Vue({
    el: "#mainDiv",
    data: {
      isRecording: false,
      recorder: "",
      reqInfo: "",
    },
    methods: {
      promiseStopRecord() {
        this.recorder.stop();
        console.log("Stopping...", this.recorder);
        return new Promise((resolve, reject) => {
          this.recorder.ondataavailable = (e) => {
            console.log("user press stop record...");
            this.reqInfo = e.data;
            console.log("the info is ", this.reqInfo);
            resolve();
            console.log("resolving...");
          };
        });
      },
      startRecord() {
        console.log("recording...");
        MediaRecorder.isTypeSupported("video/webm;codecs=h264")
          ? this.recordH264()
          : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? this.recordVp8()
          : this.recordMp4();
        this.isRecording = true;
      },
      stopRecord() {
        $("#stopBtn").prop("disabled", true);
        console.log("stop recording...");
        this.promiseStopRecord()
          .then(() => {
            console.log("here is ", this.reqInfo);

            axios
              .post(
                // "https://cameralifftest.us-south.cf.appdomain.cloud/postStream",
                "http://localhost:8080/postStream",

                this.reqInfo,
                {
                  headers: {
                    "csrf-token": document.getElementById("_csrf").value,
                  },
                }
              )
              .then((res) => {
                this.isRecording = false;
              })
              .catch((err) => {
                alert(err);
                this.isRecording = false;
              });
          })
          .catch((err) => {
            console.log(err);
          });
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
      recordMp4() {
        this.recorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=mp4",
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
});
