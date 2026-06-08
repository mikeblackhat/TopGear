// ------------------------------------------------------------
// assets
// ------------------------------------------------------------
const ASSETS = {
  COLOR: {
    TAR: ["#959298", "#9c9a9d"],
    RUMBLE: ["#959298", "#f5f2f6"],
    GRASS: ["#eedccd", "#e6d4c5"],
  },

  IMAGE: {
    TREE: {
      src: "images/tree.png",
      width: 132,
      height: 192,
    },

    HERO: {
      src: "images/hero.png",
      width: 110,
      height: 56,
    },

    CAR: {
      src: "images/car04.png",
      width: 50,
      height: 36,
    },

    FINISH: {
      src: "images/finish.png",
      width: 339,
      height: 180,
      offset: -0.5,
    },

    SKY: {
      src: "images/cloud.jpg",
    },
  },

  AUDIO: {
    theme: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/155629/theme.mp3",
    engine: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/155629/engine.wav",
    honk: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/155629/honk.wav",
    beep: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/155629/beep.wav",
  },
};

// ------------------------------------------------------------
// helper functions
// ------------------------------------------------------------
Number.prototype.pad = function (numZeros, char = 0) {
  let n = Math.abs(this);
  let zeros = Math.max(0, numZeros - Math.floor(n).toString().length);
  let zeroString = Math.pow(10, zeros)
    .toString()
    .substr(1)
    .replace(0, char);
  return zeroString + n;
};

Number.prototype.clamp = function (min, max) {
  return Math.max(min, Math.min(this, max));
};

const timestamp = (_) => new Date().getTime();
const accelerate = (v, accel, dt) => v + accel * dt;
const isCollide = (x1, w1, x2, w2) => (x1 - x2) ** 2 <= (w2 + w1) ** 2;

function getRand(min, max) {
  return (Math.random() * (max - min) + min) | 0;
}

function randomProperty(obj) {
  let keys = Object.keys(obj);
  return obj[keys[(keys.length * Math.random()) << 0]];
}

function sleep(ms) {
  return new Promise(function (resolve, reject) {
    setTimeout((_) => resolve(), ms);
  });
}

// ------------------------------------------------------------
// global variables & constants
// ------------------------------------------------------------
const width = 800;
const halfWidth = width / 2;
const height = 500;
const roadW = 4000;
const segL = 200;
const camD = 0.2;
const H = 1500;
const N = 70;

const maxSpeed = 200;
const accel = 38;
const breaking = -80;
const decel = -40;
const maxOffSpeed = 40;
const offDecel = -70;
const enemy_speed = 8;
const hitSpeed = 20;

const LANE = {
  A: -2.3,
  B: -0.5,
  C: 1.2,
};

const mapLength = 15000;
const targetFrameRate = 1000 / 25; // in ms
