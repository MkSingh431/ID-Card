const form = document.querySelector("#idForm");
const resetBtn = document.querySelector("#resetBtn");
const downloadBtn = document.querySelector("#downloadBtn");
const formStatus = document.querySelector("#formStatus");
const previewState = document.querySelector("#previewState");

const fields = {
  cardNumber: document.querySelector("#cardNumber"),
  fullName: document.querySelector("#fullName"),
  fatherName: document.querySelector("#fatherName"),
  mobileNumber: document.querySelector("#mobileNumber"),
  villageCity: document.querySelector("#villageCity"),
  postOffice: document.querySelector("#postOffice"),
  policeStation: document.querySelector("#policeStation"),
  pincode: document.querySelector("#pincode"),
  district: document.querySelector("#district"),
  stateName: document.querySelector("#stateName"),
  photo: document.querySelector("#photo"),
};

const preview = {
  cardNumber: document.querySelector("#previewCardNumber"),
  backCardNumber: document.querySelector("#previewBackCardNumber"),
  idNumber: document.querySelector("#previewIdNumber"),
  name: document.querySelector("#previewName"),
  fatherName: document.querySelector("#previewFatherName"),
  mobile: document.querySelector("#previewMobile"),
  backMobile: document.querySelector("#previewBackMobile"),
  address: document.querySelector("#previewAddress"),
  photo: document.querySelector("#previewPhoto"),
  photoFrame: document.querySelector(".photo-frame"),
  watermarkScaleValue: document.querySelector("#watermarkScaleValue"),
};

const errors = {
  fullName: document.querySelector("#fullNameError"),
  fatherName: document.querySelector("#fatherNameError"),
  mobileNumber: document.querySelector("#mobileNumberError"),
  villageCity: document.querySelector("#villageCityError"),
  postOffice: document.querySelector("#postOfficeError"),
  policeStation: document.querySelector("#policeStationError"),
  pincode: document.querySelector("#pincodeError"),
  district: document.querySelector("#districtError"),
  stateName: document.querySelector("#stateNameError"),
  photo: document.querySelector("#photoError"),
};

const STATE_DISTRICT_DATA = window.INDIA_STATE_DISTRICTS || {};

const state = {
  cardNumber: generateCardNumber(),
  photoDataUrl: "",
  touched: new Set(),
};

const EMPTY_TEXT = "Not entered";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const fieldRules = {
  fullName: {
    label: "Full name",
    validate(value) {
      if (!value.trim()) return "Enter the full name.";
      if (value.trim().length < 2) return "Name must be at least 2 characters.";
      return "";
    },
  },
  fatherName: {
    label: "Father's name",
    validate(value) {
      if (!value.trim()) return "Enter the father's name.";
      if (value.trim().length < 2) return "Father's name must be at least 2 characters.";
      return "";
    },
  },
  mobileNumber: {
    label: "Mobile number",
    validate(value) {
      const cleaned = value.trim().replace(/[\s()-]/g, "");
      if (!cleaned) return "Enter a mobile number.";
      if (!/^\+?\d{7,15}$/.test(cleaned)) {
        return "Enter 7 to 15 digits. Only one leading + is allowed.";
      }
      return "";
    },
  },
  villageCity: {
    label: "Village/City",
    validate(value) {
      if (!value.trim()) return "Enter the village or city.";
      if (value.trim().length < 2) return "Village or city must be at least 2 characters.";
      return "";
    },
  },
  postOffice: {
    label: "Post Office",
    validate(value) {
      if (!value.trim()) return "Enter the post office.";
      if (value.trim().length < 2) return "Post office must be at least 2 characters.";
      return "";
    },
  },
  policeStation: {
    label: "Police Station",
    validate(value) {
      if (!value.trim()) return "Enter the police station.";
      if (value.trim().length < 2) return "Police station must be at least 2 characters.";
      return "";
    },
  },
  pincode: {
    label: "Pincode",
    validate(value) {
      if (!value.trim()) return "Enter the pincode.";
      if (!/^\d{6}$/.test(value.trim())) return "Enter a 6-digit pincode.";
      return "";
    },
  },
  district: {
    label: "District",
    validate(value) {
      if (!value.trim()) return "Select the district.";
      return "";
    },
  },
  stateName: {
    label: "State",
    validate(value) {
      if (!value.trim()) return "Select the state.";
      return "";
    },
  },
};

function valueOf(name) {
  return fields[name].value.trim();
}

function normalizeSpaces(value) {
  return value.replace(/\s+/g, " ").trim();
}

function formatProperName(value) {
  return normalizeSpaces(value)
    .split(" ")
    .map((word) =>
      word
        .split(/([.'-])/)
        .map((part) => {
          if (!/[A-Za-z\u0900-\u097F]/.test(part)) return part;
          if (part.length === 1) return part.toUpperCase();
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join(""),
    )
    .join(" ");
}

function formatNameField(name) {
  const formatted = formatProperName(fields[name].value);
  if (formatted) fields[name].value = formatted;
}

function populateStateOptions() {
  const states = Object.keys(STATE_DISTRICT_DATA);
  fields.stateName.innerHTML = '<option value="">Select state</option>';

  states.forEach((stateName) => {
    const option = document.createElement("option");
    option.value = stateName;
    option.textContent = stateName;
    fields.stateName.appendChild(option);
  });
}

function populateDistrictOptions(stateName, selectedDistrict = "") {
  const districts = STATE_DISTRICT_DATA[stateName] || [];
  fields.district.innerHTML = "";
  fields.district.disabled = !districts.length;

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = districts.length ? "Select district" : "Select state first";
  fields.district.appendChild(emptyOption);

  districts.forEach((district) => {
    const option = document.createElement("option");
    option.value = district;
    option.textContent = district;
    fields.district.appendChild(option);
  });

  fields.district.value = districts.includes(selectedDistrict) ? selectedDistrict : "";
}

function generateCardNumber() {
  const timestampPart = String(Date.now()).slice(-8);
  let randomValue = Math.floor(Math.random() * 10000);

  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    randomValue = values[0] % 10000;
  }

  return `${timestampPart}${String(randomValue).padStart(4, "0")}`;
}

function setText(element, value, fallback = EMPTY_TEXT) {
  const normalized = normalizeSpaces(value);
  element.textContent = normalized || fallback;
  element.classList.toggle("is-empty", !normalized);
}

function setError(name, message) {
  errors[name].textContent = message;
  fields[name].closest(".field").classList.toggle("invalid", Boolean(message));
}

function validateField(name, showError = true) {
  if (name === "photo") return validatePhoto(showError);
  const message = fieldRules[name].validate(fields[name].value);
  if (showError) setError(name, message);
  return !message;
}

function validatePhoto(showError = true) {
  const file = fields.photo.files[0];
  let message = "";
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!file && !state.photoDataUrl) {
    message = "Upload a portrait photo.";
  } else if (file) {
    if (!allowedTypes.includes(file.type)) {
      message = "Choose a JPG, PNG, or WebP image.";
    } else if (file.size > MAX_PHOTO_SIZE) {
      message = "Photo must be under 5 MB.";
    }
  }

  if (showError) setError("photo", message);
  return !message;
}

function validateAll(showError = true) {
  const results = getRequiredFieldNames().map((name) => validateField(name, showError));
  return results.every(Boolean);
}

function getRequiredFieldNames() {
  return [
    "fullName",
    "fatherName",
    "mobileNumber",
    "villageCity",
    "postOffice",
    "policeStation",
    "pincode",
    "district",
    "stateName",
    "photo",
  ];
}

function updatePreviewState() {
  const requiredComplete =
    valueOf("fullName") &&
    valueOf("fatherName") &&
    valueOf("mobileNumber") &&
    valueOf("villageCity") &&
    valueOf("postOffice") &&
    valueOf("policeStation") &&
    valueOf("pincode") &&
    valueOf("district") &&
    valueOf("stateName") &&
    state.photoDataUrl;

  previewState.textContent = requiredComplete ? "Ready to download" : "Waiting for details";
}

function fitAddressPreview() {
  const box = preview.address.closest(".address-box");
  preview.address.style.fontSize = "1rem";

  requestAnimationFrame(() => {
    let size = 16;
    while (size > 11 && preview.address.scrollHeight > box.clientHeight - 54) {
      size -= 0.5;
      preview.address.style.fontSize = `${size}px`;
    }
  });
}

function updatePreview() {
  fields.cardNumber.value = state.cardNumber;
  if (preview.cardNumber) preview.cardNumber.textContent = state.cardNumber;
  preview.backCardNumber.textContent = `ID No: ${state.cardNumber}`;
  setText(preview.name, fields.fullName.value);
  setText(preview.fatherName, fields.fatherName.value);
  setText(preview.mobile, fields.mobileNumber.value);
  // ID number under mobile on the front preview
  preview.idNumber.textContent = state.cardNumber || EMPTY_TEXT;
  preview.backMobile.textContent = `Mobile: ${normalizeSpaces(fields.mobileNumber.value) || EMPTY_TEXT}`;
  // watermark scale preview label
  const scaleEl = document.querySelector("#watermarkScale");
  const scale = parseFloat(scaleEl?.value || 0.75);
  if (preview.watermarkScaleValue) preview.watermarkScaleValue.textContent = `${Math.round(scale * 100)}%`;
  const formattedAddress = formatAddress();
  preview.address.textContent = formattedAddress || EMPTY_TEXT;
  preview.address.classList.toggle("is-empty", !formattedAddress);
  fitAddressPreview();
  updatePreviewState();
}

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Photo could not be read."));
    reader.readAsDataURL(file);
  });
}

async function handlePhotoChange() {
  state.touched.add("photo");
  const file = fields.photo.files[0];

  if (!validatePhoto(true)) {
    state.photoDataUrl = "";
    preview.photo.removeAttribute("src");
    preview.photoFrame.classList.remove("has-photo");
    updatePreviewState();
    return;
  }

  try {
    state.photoDataUrl = await readPhoto(file);
    preview.photo.src = state.photoDataUrl;
    preview.photoFrame.classList.add("has-photo");
    setError("photo", "");
  } catch (error) {
    state.photoDataUrl = "";
    preview.photoFrame.classList.remove("has-photo");
    setError("photo", error.message);
  }

  updatePreviewState();
}

function setStatus(message, type = "success") {
  formStatus.textContent = message;
  formStatus.classList.toggle("error", type === "error");
}

function getCardData() {
  return {
    cardNumber: state.cardNumber,
    name: formatProperName(fields.fullName.value),
    fatherName: formatProperName(fields.fatherName.value),
    mobile: normalizeSpaces(fields.mobileNumber.value),
    address: formatAddress(),
  };
}

function formatAddress() {
  const villageCity = normalizeSpaces(fields.villageCity.value);
  const postOffice = normalizeSpaces(fields.postOffice.value);
  const policeStation = normalizeSpaces(fields.policeStation.value);
  const district = normalizeSpaces(fields.district.value);
  const stateName = normalizeSpaces(fields.stateName.value);
  const pincode = normalizeSpaces(fields.pincode.value);
  const districtState = [
    district ? `District: ${district}` : "",
    stateName ? `State: ${stateName}` : "",
  ].filter(Boolean).join(", ");

  return [
    villageCity ? `Village/City: ${villageCity}` : "",
    postOffice ? `Post Office: ${postOffice}` : "",
    policeStation ? `Police Station: ${policeStation}` : "",
    districtState,
    pincode ? `Pincode: ${pincode}` : "",
  ].filter(Boolean).join("\n");
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = [];
  const hardLines = text.split("\n");

  hardLines.forEach((hardLine) => {
    const words = hardLine.split(/\s+/).filter(Boolean);
    let line = "";

    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width <= maxWidth) {
        line = testLine;
        return;
      }

      if (line) lines.push(line);

      if (ctx.measureText(word).width <= maxWidth) {
        line = word;
        return;
      }

      let chunk = "";
      Array.from(word).forEach((char) => {
        const testChunk = `${chunk}${char}`;
        if (ctx.measureText(testChunk).width <= maxWidth) {
          chunk = testChunk;
        } else {
          lines.push(chunk);
          chunk = char;
        }
      });
      line = chunk;
    });

    lines.push(line);
  });

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });

  return lines.length;
}

function getWrappedLines(ctx, text, maxWidth) {
  const lines = [];
  const hardLines = text.split("\n");

  hardLines.forEach((hardLine) => {
    const words = hardLine.split(/\s+/).filter(Boolean);
    let line = "";

    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width <= maxWidth) {
        line = testLine;
        return;
      }

      if (line) lines.push(line);

      if (ctx.measureText(word).width <= maxWidth) {
        line = word;
      } else {
        let chunk = "";
        Array.from(word).forEach((char) => {
          const testChunk = `${chunk}${char}`;
          if (ctx.measureText(testChunk).width <= maxWidth) {
            chunk = testChunk;
          } else {
            lines.push(chunk);
            chunk = char;
          }
        });
        line = chunk;
      }
    });

    lines.push(line);
  });

  return lines.filter(Boolean);
}

function drawFittedText(ctx, text, x, y, maxWidth, maxSize, minSize, weight = 800) {
  let fontSize = maxSize;
  do {
    ctx.font = `${weight} ${fontSize}px "Nirmala UI", "Mangal", Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fontSize -= 1;
  } while (fontSize > minSize);

  ctx.fillText(text, x, y);
}

function drawFittedParagraph(ctx, text, x, y, width, height, options) {
  let fontSize = options.maxSize;
  let lines = [];
  let lineHeight = 0;

  do {
    ctx.font = `${options.weight || 800} ${fontSize}px "Nirmala UI", "Mangal", Arial, sans-serif`;
    lineHeight = Math.round(fontSize * (options.lineHeight || 1.36));
    lines = getWrappedLines(ctx, text, width);
    if (lines.length * lineHeight <= height) break;
    fontSize -= 1;
  } while (fontSize > options.minSize);

  ctx.font = `${options.weight || 800} ${fontSize}px "Nirmala UI", "Mangal", Arial, sans-serif`;
  ctx.fillStyle = options.color || "#261b14";

  const maxLines = Math.max(1, Math.floor(height / lineHeight));
  const visibleLines = lines.slice(0, maxLines);
  if (visibleLines.length < lines.length) {
    const lastIndex = visibleLines.length - 1;
    let lastLine = visibleLines[lastIndex];
    while (lastLine.length > 1 && ctx.measureText(`${lastLine}...`).width > width) {
      lastLine = lastLine.slice(0, -1);
    }
    visibleLines[lastIndex] = `${lastLine}...`;
  }

  visibleLines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function drawLogo(ctx, cx, cy, radius) {
  const gradient = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  gradient.addColorStop(0, "#ffb15c");
  gradient.addColorStop(1, "#d96f00");

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(5, radius * 0.1);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${radius * 0.98}px "Nirmala UI", "Mangal", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ॐ", cx, cy + radius * 0.04);
  ctx.restore();
}

function drawImageCover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawCardShell(ctx, x, y, width, height) {
  ctx.save();
  ctx.shadowColor = "rgba(36, 24, 12, 0.18)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 12;
  roundedRect(ctx, x, y, width, height, 28);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  roundedRect(ctx, x, y, width, height, 28);
  ctx.strokeStyle = "rgba(217, 111, 0, 0.36)";
  ctx.lineWidth = 3;
  ctx.stroke();

  roundedRect(ctx, x + 22, y + 22, width - 44, height - 44, 18);
  ctx.strokeStyle = "rgba(255, 153, 51, 0.32)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawHeader(ctx, x, y, width, height, compact = false) {
  const headerHeight = compact ? 138 : 168;
  ctx.save();
  roundedRect(ctx, x, y, width, height, 28);
  ctx.clip();
  const gradient = ctx.createLinearGradient(x, y, x + width, y + headerHeight);
  gradient.addColorStop(0, "#ffae55");
  gradient.addColorStop(1, "#d96f00");
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, headerHeight);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width * 0.52, y);
  ctx.lineTo(x + width * 0.22, y + headerHeight);
  ctx.lineTo(x, y + headerHeight);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  return headerHeight;
}

function drawFrontCard(ctx, x, y, width, height, data, image, sideLogoImage) {
  drawCardShell(ctx, x, y, width, height);
  const headerHeight = drawHeader(ctx, x, y, width, height, false);

  drawLogo(ctx, x + 112, y + 84, 58);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = '900 54px "Nirmala UI", "Mangal", Arial, sans-serif';
  ctx.fillText("सनातन हिंदू", x + 194, y + 84);
  ctx.font = '800 24px "Nirmala UI", "Mangal", Arial, sans-serif';
  ctx.fillText("पहचान पत्र", x + 198, y + 126);
  ctx.font = '900 22px "Nirmala UI", "Mangal", Arial, sans-serif';
  // Top-right ID removed per user request. ID is shown elsewhere on card.

  const photoX = x + 72;
  const photoY = y + headerHeight + 52;
  const photoW = 265;
  const photoH = 340;
  roundedRect(ctx, photoX, photoY, photoW, photoH, 18);
  ctx.fillStyle = "#fff1df";
  ctx.fill();
  ctx.save();
  roundedRect(ctx, photoX, photoY, photoW, photoH, 18);
  ctx.clip();
  drawImageCover(ctx, image, photoX, photoY, photoW, photoH);
  ctx.restore();
  roundedRect(ctx, photoX, photoY, photoW, photoH, 18);
  ctx.strokeStyle = "rgba(217, 111, 0, 0.45)";
  ctx.lineWidth = 5;
  ctx.stroke();

  const detailX = x + 382;
  const detailY = photoY + 18;
  const detailWidth = width - 456;
  const rows = [
    ["Name", data.name],
    ["Father's Name", data.fatherName],
    ["Mobile", data.mobile],
  ];

  rows.forEach(([label, value], index) => {
    const rowY = detailY + index * 105;
    ctx.fillStyle = "#d96f00";
    ctx.font = '900 22px "Nirmala UI", "Mangal", Arial, sans-serif';
    ctx.fillText(label.toUpperCase(), detailX, rowY);
    ctx.fillStyle = "#261b14";
    drawFittedText(ctx, value, detailX, rowY + 44, detailWidth, 34, 24, 900);
    ctx.strokeStyle = "rgba(217, 111, 0, 0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(detailX, rowY + 66);
    ctx.lineTo(detailX + detailWidth, rowY + 66);
    ctx.stroke();
  });

  ctx.save();
  roundedRect(ctx, x, y, width, height, 28);
  ctx.clip();
  ctx.fillStyle = "#d96f00";
  ctx.fillRect(x, y + height - 58, width, 58);
  ctx.restore();

  ctx.fillStyle = "#ffffff";
  ctx.font = '800 24px "Nirmala UI", "Mangal", Arial, sans-serif';
  ctx.fillText("Cultural Identity Card", x + 62, y + height - 21);

  // Draw right-side top logo image if provided
  if (sideLogoImage) {
    try {
      const logoSize = 86;
      const logoX = x + width - 22 - logoSize; // align inside inner frame
      const logoY = y + 20;
      ctx.drawImage(sideLogoImage, logoX, logoY, logoSize, logoSize);
    } catch (err) {
      // ignore draw errors
    }
  }
}

function drawBackCard(ctx, x, y, width, height, data) {
  drawCardShell(ctx, x, y, width, height);
  const headerHeight = drawHeader(ctx, x, y, width, height, true);

  drawLogo(ctx, x + 92, y + 68, 44);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = '900 44px "Nirmala UI", "Mangal", Arial, sans-serif';
  ctx.fillText("सनातन हिंदू", x + 156, y + 72);
  ctx.font = '800 22px "Nirmala UI", "Mangal", Arial, sans-serif';
  ctx.fillText("Address details", x + 158, y + 108);

  const boxX = x + 70;
  const boxY = y + headerHeight + 58;
  const boxW = width - 140;
  const boxH = 314;
  roundedRect(ctx, boxX, boxY, boxW, boxH, 18);
  ctx.fillStyle = "#fffaf4";
  ctx.fill();
  ctx.strokeStyle = "rgba(217, 111, 0, 0.36)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#d96f00";
  ctx.font = '900 22px "Nirmala UI", "Mangal", Arial, sans-serif';
  ctx.fillText("ADDRESS", boxX + 34, boxY + 48);

  drawFittedParagraph(ctx, data.address, boxX + 34, boxY + 96, boxW - 68, boxH - 126, {
    maxSize: 33,
    minSize: 21,
    weight: 850,
    lineHeight: 1.34,
    color: "#261b14",
  });

  ctx.strokeStyle = "rgba(217, 111, 0, 0.24)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 70, y + height - 90);
  ctx.lineTo(x + width - 70, y + height - 90);
  ctx.stroke();

  ctx.fillStyle = "#6d6259";
  ctx.font = '800 22px "Nirmala UI", "Mangal", Arial, sans-serif';
  ctx.fillText(`ID No: ${data.cardNumber}`, x + 70, y + height - 48);
  const mobileText = `Mobile: ${data.mobile}`;
  const mobileWidth = ctx.measureText(mobileText).width;
  ctx.fillText(mobileText, x + width - 70 - mobileWidth, y + height - 48);
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Photo could not be prepared for download."));
    image.src = dataUrl;
  });
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${url}`));
    image.src = url;
  });
}

function drawWatermark(ctx, image, x, y, width, height, options = {}) {
  if (!image) return;
  const opacity = options.opacity ?? 0.12;
  const rotation = (options.rotationDeg ?? -18) * (Math.PI / 180);
  const scale = options.scale ?? 0.72;

  ctx.save();
  ctx.globalAlpha = opacity;

  const cx = x + width / 2;
  const cy = y + height / 2;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // Fit watermark by width of card
  const targetW = width * scale;
  const aspect = image.height / image.width;
  const targetH = targetW * aspect;

  ctx.drawImage(image, -targetW / 2, -targetH / 2, targetW, targetH);
  ctx.restore();
}

async function generateCompositeCard() {
  const data = getCardData();
  const image = await loadImageFromDataUrl(state.photoDataUrl);
  let watermarkImage = null;
  try {
    // Prefer jay.jpg, then hm.avif, then ram.jpg, then hanuman.avif, then watermark.png
    watermarkImage = await loadImageFromUrl("jay.jpg");
  } catch (e1) {
    try {
      watermarkImage = await loadImageFromUrl("hm.avif");
    } catch (e2) {
      try {
        watermarkImage = await loadImageFromUrl("ram.jpg");
      } catch (e3) {
        try {
          watermarkImage = await loadImageFromUrl("hanuman.avif");
        } catch (e4) {
          try {
            watermarkImage = await loadImageFromUrl("watermark.png");
          } catch (e5) {
            watermarkImage = null;
          }
        }
      }
    }
  }

  // Load the right-side top logo if present
  let sideLogoImage = null;
  try {
    sideLogoImage = await loadImageFromUrl("hanu.jpg");
  } catch (err) {
    sideLogoImage = null;
  }

  const sideWidth = 1020;
  const sideHeight = 643;
  const margin = 48;
  const gap = 64;
  const canvas = document.createElement("canvas");
  canvas.width = sideWidth + margin * 2;
  canvas.height = sideHeight * 2 + gap + margin * 2;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f8f7f4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawFrontCard(ctx, margin, margin, sideWidth, sideHeight, data, image, sideLogoImage);
  if (watermarkImage) {
    const scaleEl = document.querySelector("#watermarkScale");
    const wmScale = parseFloat(scaleEl?.value || 0.75);
    drawWatermark(ctx, watermarkImage, margin, margin, sideWidth, sideHeight, { opacity: 0.12, rotationDeg: -18, scale: wmScale });
  }
  drawBackCard(ctx, margin, margin + sideHeight + gap, sideWidth, sideHeight, data);
  if (watermarkImage) {
    const scaleEl2 = document.querySelector("#watermarkScale");
    const wmScale2 = parseFloat(scaleEl2?.value || 0.75);
    drawWatermark(ctx, watermarkImage, margin, margin + sideHeight + gap, sideWidth, sideHeight, { opacity: 0.25, rotationDeg: -18, scale: Math.min(1.0, wmScale2 + 0.15) });
  }
  return canvas;
}

function downloadCanvas(canvas, name) {
  const link = document.createElement("a");
  link.download = name;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function createFileName() {
  const slug = valueOf("fullName")
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  return `sanatan-hindu-id-card-${slug || "card"}-${state.cardNumber}.png`;
}

async function handleSubmit(event) {
  event.preventDefault();
  formatNameField("fullName");
  formatNameField("fatherName");
  updatePreview();
  state.touched = new Set(getRequiredFieldNames());

  if (!validateAll(true)) {
    setStatus("Please fix the highlighted fields before downloading.", "error");
    return;
  }

  downloadBtn.disabled = true;
  downloadBtn.textContent = "Preparing card...";
  setStatus("Preparing download...");

  try {
    const canvas = await generateCompositeCard();
    downloadCanvas(canvas, createFileName());
    setStatus("Download ready. Review the saved PNG before printing.");
  } catch (error) {
    setStatus(error.message || "The card could not be generated.", "error");
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = "Download ID card";
  }
}

function resetForm() {
  form.reset();
  state.cardNumber = generateCardNumber();
  state.photoDataUrl = "";
  state.touched.clear();
  populateDistrictOptions("");
  Object.keys(errors).forEach((name) => setError(name, ""));
  preview.photo.removeAttribute("src");
  preview.photoFrame.classList.remove("has-photo");
  setStatus("");
  updatePreview();
}

[
  "fullName",
  "fatherName",
  "mobileNumber",
  "villageCity",
  "postOffice",
  "policeStation",
  "pincode",
  "district",
  "stateName",
].forEach((name) => {
  const eventName = fields[name].tagName === "SELECT" ? "change" : "input";

  fields[name].addEventListener(eventName, () => {
    if (name === "stateName") {
      populateDistrictOptions(fields.stateName.value);
      setError("district", "");
    }

    state.touched.add(name);
    if (state.touched.has(name)) validateField(name, true);
    updatePreview();
  });

  fields[name].addEventListener("blur", () => {
    state.touched.add(name);
    if (name === "fullName" || name === "fatherName") {
      formatNameField(name);
      updatePreview();
    }
    validateField(name, true);
  });
});

fields.photo.addEventListener("change", handlePhotoChange);
form.addEventListener("submit", handleSubmit);
resetBtn.addEventListener("click", resetForm);
window.addEventListener("resize", fitAddressPreview);

// Watermark scale control wiring
const watermarkControl = document.querySelector("#watermarkScale");
if (watermarkControl) {
  watermarkControl.addEventListener("input", () => {
    updatePreview();
  });
}

populateStateOptions();
populateDistrictOptions("");
updatePreview();
