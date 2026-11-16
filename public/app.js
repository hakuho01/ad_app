const SCALE = 2;
const W = 675 * SCALE;
const H = 981 * SCALE;
const u = (px) => px * SCALE;

const BG = "#ffffff";
const RED = "#ff0000";
const PRICE_YELLOW = "#fff000";
const FAMILY = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif';

const TEXT_LEFT = u(42);
const NAME_STROKE = u(10);
const NOTE_STROKE = u(7);
const PRICE_OUTER = u(22);
const PRICE_INNER = u(14);
const ART_ALPHA = 0.35;
const ART_CROP = { x: 0.08, y: 0.11, w: 0.84, h: 0.4 };
const COPY_GAP = u(16);
const PRICE_GAP = u(40);

const fileInput = document.querySelector("#file");
const drop = document.querySelector("#drop");
const thumb = document.querySelector("#thumb");
const dropLabel = document.querySelector("#drop-label");
const nameInput = document.querySelector("#name");
const noteInput = document.querySelector("#note");
const priceInput = document.querySelector("#price");
const saveButton = document.querySelector("#save");
const nextButton = document.querySelector("#next");
const status = document.querySelector("#status");
const canvas = document.querySelector("#preview");
const ctx = canvas.getContext("2d");

const state = { image: null, url: null };
const footer = new Image();
footer.onload = () => render();
footer.src = "shop-footer.png";

const headline = new Image();
let headlineReady = false;
headline.onload = () => {
  headlineReady = true;
  render();
};
headline.onerror = () => {
  headlineReady = false;
  render();
};
headline.src = "headline.png";

fileInput.addEventListener("change", () => {
  const file = fileInput.files && fileInput.files[0];
  if (file) loadFile(file);
});

drop.addEventListener("click", () => fileInput.click());

window.addEventListener("paste", (event) => {
  const items = event.clipboardData && [...event.clipboardData.items];
  const imageItem = items && items.find((item) => item.type.startsWith("image/"));
  if (!imageItem) return;
  const file = imageItem.getAsFile();
  if (!file) return;
  event.preventDefault();
  loadFile(file);
});

priceInput.addEventListener("input", () => {
  priceInput.value = priceInput.value.replace(/[^\d]/g, "");
  clearStatus();
  render();
});

for (const input of [nameInput, noteInput]) {
  input.addEventListener("input", () => {
    clearStatus();
    render();
  });
}

saveButton.addEventListener("click", download);
nextButton.addEventListener("click", nextCard);
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    download();
  }
});

render();

function isImageFile(file) {
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(file.name);
}

function loadFile(file) {
  if (!isImageFile(file)) {
    setStatus("画像ファイルを選んでください");
    return;
  }
  if (state.url) URL.revokeObjectURL(state.url);
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    state.image = image;
    state.url = url;
    thumb.src = url;
    thumb.classList.add("show");
    dropLabel.textContent = "⌘V で差し替え";
    clearStatus();
    render();
    priceInput.focus();
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    setStatus("この画像は読み込めません");
  };
  image.src = url;
}

function nextCard() {
  if (state.url) URL.revokeObjectURL(state.url);
  state.image = null;
  state.url = null;
  fileInput.value = "";
  thumb.removeAttribute("src");
  thumb.classList.remove("show");
  dropLabel.textContent = "クリックして選択、または ⌘V で貼り付け";
  priceInput.value = "";
  nameInput.value = "";
  noteInput.value = "";
  clearStatus();
  render();
  drop.focus();
}

function download() {
  const missing = missingFields();
  if (missing.length) {
    setStatus(`${missing.join("、")}を入れてください`);
    return;
  }
  render();
  canvas.toBlob((blob) => {
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = downloadName();
    link.click();
    URL.revokeObjectURL(url);
    setStatus("保存しました");
  }, "image/png");
}

function render() {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.setLineDash([]);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  drawArtBackground(state.image);
  drawHeadlineImage();
  drawCard(state.image);
  drawCopy();
  drawFooter();
  saveButton.disabled = missingFields().length > 0;
}

function drawArtBackground(image) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  if (!image) return;
  const sx = image.width * ART_CROP.x;
  const sy = image.height * ART_CROP.y;
  const sw = image.width * ART_CROP.w;
  const sh = image.height * ART_CROP.h;
  const scale = Math.max(W / sw, H / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.save();
  ctx.globalAlpha = ART_ALPHA;
  ctx.drawImage(image, sx, sy, sw, sh, (W - dw) / 2, (H - dh) / 2, dw, dh);
  ctx.restore();
}

function drawHeadlineImage() {
  if (headlineReady && headline.naturalWidth) {
    const maxW = W - u(36);
    const maxH = u(150);
    const scale = Math.min(1, maxW / headline.naturalWidth, maxH / headline.naturalHeight);
    const dw = headline.naturalWidth * scale;
    const dh = headline.naturalHeight * scale;
    const areaTop = u(16);
    const areaBottom = u(190);
    const y = areaTop + Math.max(0, (areaBottom - areaTop - dh) / 2);
    ctx.drawImage(headline, (W - dw) / 2, y, dw, dh);
    return;
  }

  const outer = u(18);
  const inner = u(11);
  const text = "店頭特価";
  const size = fitWidth(text, W - u(28) - outer, u(132), u(72));
  drawBag(text, W / 2, u(112), {
    size,
    fill: RED,
    align: "center",
    baseline: "middle",
    layers: [
      { color: "#111", width: outer },
      { color: "#fff", width: inner }
    ]
  });
}

function drawCopy() {
  const priceDigits = priceInput.value.replace(/[^\d]/g, "");
  const priceText = priceDigits ? formatYen(priceDigits) : "¥----";
  const nameText = bracketName(nameInput.value) || "《カード名》";
  const noteText = noteInput.value.trim();
  const textWidth = W - TEXT_LEFT - u(28);

  const nameSize = fitWidth(nameText, textWidth, u(46), u(26));
  const nameInk = measureInk(nameText, nameSize, NAME_STROKE);
  let noteInk = null;
  if (noteText) {
    const noteSize = fitWidth(noteText, textWidth, u(26), u(15));
    noteInk = measureInk(noteText, noteSize, NOTE_STROKE);
  }

  const price = placePrice(priceText, nameInk, noteInk);

  ctx.save();
  ctx.globalAlpha = priceDigits ? 1 : 0.4;
  drawBag(priceText, W - u(18) - PRICE_OUTER / 2, price.baseline, {
    size: price.size,
    fill: PRICE_YELLOW,
    align: "right",
    baseline: "alphabetic",
    layers: [
      { color: "#111", width: PRICE_OUTER },
      { color: RED, width: PRICE_INNER }
    ]
  });
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = nameInput.value.trim() ? 1 : 0.35;
  drawBag(nameText, inkLeft(nameInk), price.nameBaseline, {
    size: nameSize,
    fill: "#fff",
    align: "left",
    baseline: "alphabetic",
    layers: [{ color: "#111", width: NAME_STROKE }]
  });
  ctx.restore();

  if (noteInk) {
    drawBag(noteText, inkLeft(noteInk), price.noteBaseline, {
      size: noteInk.size,
      fill: "#fff",
      align: "left",
      baseline: "alphabetic",
      layers: [{ color: "#111", width: NOTE_STROKE }]
    });
  }
}

function placePrice(text, nameInk, noteInk) {
  const maxWidth = W - u(36) - PRICE_OUTER;
  let size = u(100);
  let box = priceBox(text, size);
  while (size > u(64) && box.width > maxWidth) {
    size -= 2;
    box = priceBox(text, size);
  }

  const shiftFor = (priceTop) => {
    const resting = linePositions(nameInk, noteInk, 0);
    return Math.max(0, resting.noteBottom - (priceTop - PRICE_GAP));
  };

  let shift = shiftFor(box.top);
  while (size > u(64) && linePositions(nameInk, noteInk, shift).nameTop < u(440)) {
    size -= 2;
    box = priceBox(text, size);
    shift = shiftFor(box.top);
  }

  const lines = linePositions(nameInk, noteInk, shift);
  return { size, baseline: box.baseline, nameBaseline: lines.nameBaseline, noteBaseline: lines.noteBaseline };
}

function linePositions(nameInk, noteInk, shift) {
  const nameBaseline = u(636) - shift;
  const nameBottom = nameBaseline + nameInk.descent + NAME_STROKE / 2;
  const nameTop = nameBaseline - nameInk.ascent - NAME_STROKE / 2;
  if (!noteInk) {
    return { nameBaseline, nameTop, noteBaseline: 0, noteBottom: nameBottom };
  }
  const noteBaseline = nameBottom + COPY_GAP + NOTE_STROKE / 2 + noteInk.ascent;
  const noteBottom = noteBaseline + noteInk.descent + NOTE_STROKE / 2;
  return { nameBaseline, nameTop, noteBaseline, noteBottom };
}

function priceBox(text, size) {
  const ink = measureInk(text, size, PRICE_OUTER);
  const bottom = H - u(97) - u(12);
  const baseline = bottom - PRICE_OUTER / 2 - ink.descent;
  return {
    size,
    width: ink.width,
    baseline,
    top: baseline - ink.ascent - PRICE_OUTER / 2
  };
}

function inkLeft(ink) {
  return TEXT_LEFT + ink.bearing + ink.stroke / 2;
}

function measureInk(text, size, stroke) {
  setFont(size);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const metrics = ctx.measureText(text);
  return {
    size,
    stroke,
    width: metrics.width,
    bearing: metrics.actualBoundingBoxLeft || 0,
    ascent: metrics.actualBoundingBoxAscent || size * 0.8,
    descent: metrics.actualBoundingBoxDescent || size * 0.18
  };
}

function drawCard(image) {
  const x = u(118);
  const y = u(198);
  const w = u(440);
  const h = w * (88 / 63);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.33)";
  ctx.shadowBlur = u(12);
  ctx.shadowOffsetY = u(5);
  ctx.fillStyle = "#222";
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  if (!image) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.setLineDash([u(8), u(7)]);
    ctx.lineWidth = u(2);
    ctx.strokeRect(x + u(8), y + u(8), w - u(16), h - u(16));
    setFont(u(22));
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("カード画像", x + w / 2, y + h / 2);
    ctx.restore();
    return;
  }

  const scale = Math.min(w / image.width, h / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawFooter() {
  const y = H - u(97);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, y, W, u(97));
  if (footer.complete && footer.naturalWidth) {
    ctx.drawImage(footer, 0, y, W, u(97));
  }
}

function drawBag(text, x, y, { size, fill, align, baseline, layers }) {
  setFont(size);
  ctx.textAlign = align;
  ctx.textBaseline = baseline || "alphabetic";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  for (const layer of layers) {
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.width;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function fitWidth(text, maxWidth, start, min) {
  let size = start;
  setFont(size);
  ctx.textAlign = "left";
  while (size > min && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    setFont(size);
  }
  return size;
}

function setFont(size) {
  ctx.font = `900 ${size}px ${FAMILY}`;
  ctx.letterSpacing = "0px";
}

function bracketName(value) {
  const text = value.trim();
  if (!text) return "";
  if (text.startsWith("《") && text.endsWith("》")) return text;
  return `《${text}》`;
}

function formatYen(digits) {
  return `¥${Number(digits).toLocaleString("ja-JP")}`;
}

function missingFields() {
  const missing = [];
  if (!state.image) missing.push("カード画像");
  if (!priceInput.value.replace(/[^\d]/g, "")) missing.push("販売価格");
  if (!nameInput.value.trim()) missing.push("カード名");
  return missing;
}

function downloadName() {
  const name = nameInput.value
    .trim()
    .replace(/\//g, "_")
    .replace(/[\\:*?"<>|\n《》]/g, "")
    .slice(0, 40) || "card";
  const price = priceInput.value.replace(/[^\d]/g, "");
  return `店頭特価_${name}_${price}.png`;
}

function setStatus(message) {
  status.textContent = message;
}

function clearStatus() {
  if (status.textContent) status.textContent = "";
}
