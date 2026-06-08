class Audio {
  constructor() {
    this.audioCtx = new AudioContext();

    // volume
    this.destination = this.audioCtx.createGain();
    this.volume = 1;
    this.destination.connect(this.audioCtx.destination);

    this.files = {};

    let _self = this;
    this.load(ASSETS.AUDIO.theme, "theme", function (key) {
      let source = _self.audioCtx.createBufferSource();
      source.buffer = _self.files[key];

      let gainNode = _self.audioCtx.createGain();
      gainNode.gain.value = 0.6;
      source.connect(gainNode);
      gainNode.connect(_self.destination);

      source.loop = true;
      source.start(0);
    });
  }

  get volume() {
    return this.destination.gain.value;
  }

  set volume(level) {
    this.destination.gain.value = level;
  }

  play(key, pitch) {
    if (this.files[key]) {
      let source = this.audioCtx.createBufferSource();
      source.buffer = this.files[key];
      source.connect(this.destination);
      if (pitch) source.detune.value = pitch;
      source.start(0);
    } else this.load(key, () => this.play(key));
  }

  load(src, key, callback) {
    let _self = this;
    let request = new XMLHttpRequest();
    request.open("GET", src, true);
    request.responseType = "arraybuffer";
    request.onload = function () {
      _self.audioCtx.decodeAudioData(
        request.response,
        function (beatportBuffer) {
          _self.files[key] = beatportBuffer;
          callback(key);
        },
        function () {}
      );
    };
    request.send();
  }
}
