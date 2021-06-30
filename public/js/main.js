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
      isIos: "",
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
                "https://f481ff969d17.ngrok.io/postStream",
                // "http://localhost:8080/postStream",

                this.reqInfo,
                {
                  headers: {
                    "csrf-token": document.getElementById("_csrf").value,
                    isIos: this.isIos,
                  },
                }
              )
              .then((res) => {
                this.isRecording = false;
              })
              .catch((err) => {
                console.log("err", err);
                alert("Oops...有地方出狀況了!");
                this.isRecording = false;
              });
          })
          .catch((err) => {
            console.log(err);
            alert("Oops...有地方出狀況了!");
          });
      },

      recordH264() {
        this.recorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=h264",
        });
        this.isIos = "false";

        this.recorder.start();
      },
      recordVp8() {
        this.recorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp8",
        });
        this.isIos = "false";

        this.recorder.start();
      },
      recordMp4() {
        try {
          this.recorder = new MediaRecorder(stream, {
            mimeType: "video/mp4",
          });
          this.isIos = "true";
          this.recorder.start();
        } catch (error) {
          alert(error);
        }
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
