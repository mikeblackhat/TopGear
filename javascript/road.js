function drawQuad(element, layer, color, x1, y1, w1, x2, y2, w2) {
  element.style.zIndex = layer;
  element.style.background = color;
  element.style.top = y2 + `px`;
  element.style.left = x1 - w1 / 2 - w1 + `px`;
  element.style.width = w1 * 3 + `px`;
  element.style.height = y1 - y2 + `px`;

  let leftOffset = w1 + x2 - x1 + Math.abs(w2 / 2 - w1 / 2);
  element.style.clipPath = `polygon(${leftOffset}px 0, ${
    leftOffset + w2
  }px 0, 66.66% 100%, 33.33% 100%)`;
}

class Line {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.z = 0;

    this.X = 0;
    this.Y = 0;
    this.W = 0;

    this.curve = 0;
    this.scale = 0;

    this.elements = [];
    this.special = null;
  }

  project(camX, camY, camZ) {
    this.scale = camD / (this.z - camZ);
    this.X = (1 + this.scale * (this.x - camX)) * halfWidth;
    this.Y = Math.ceil(((1 - this.scale * (this.y - camY)) * height) / 2);
    this.W = this.scale * roadW * halfWidth;
  }

  clearSprites() {
    for (let e of this.elements) e.style.background = "transparent";
  }

  drawSprite(depth, layer, sprite, offset) {
    let destX = this.X + this.scale * halfWidth * offset;
    let destY = this.Y + 4;
    let destW = (sprite.width * this.W) / 265;
    let destH = (sprite.height * this.W) / 265;

    destX += destW * offset;
    destY += destH * -1;

    let obj = layer instanceof Element ? layer : this.elements[layer + 6];
    obj.style.background = `url('${sprite.src}') no-repeat`;
    obj.style.backgroundSize = `${destW}px ${destH}px`;
    obj.style.left = destX + `px`;
    obj.style.top = destY + `px`;
    obj.style.width = destW + `px`;
    obj.style.height = destH + `px`;
    obj.style.zIndex = depth;
  }
}

class Car {
  constructor(pos, type, lane) {
    this.pos = pos;
    this.type = type;
    this.lane = lane;

    var element = document.createElement("div");
    road.appendChild(element);
    this.element = element;
  }
}
