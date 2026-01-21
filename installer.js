const logEl = document.getElementById("log");
const versionSelect = document.getElementById("versionSelect");
const installBtn = document.getElementById("installBtn");

function log(msg) {
  logEl.textContent += msg + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

async function loadManifest() {
  const res = await fetch("manifest.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load manifest.json");
  return res.json();
}

let manifest;
let selected;

(async () => {
  try {
    manifest = await loadManifest();
    const versions = manifest.universal.versions;

    versions.forEach((v, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = v.version;
      versionSelect.appendChild(opt);
    });

    selected = versions[0];
    log(`Loaded manifest for: ${manifest.universal.name}`);
    log(`Default version: ${selected.version} (${selected.file})`);
  } catch (e) {
    log("ERROR: " + e.message);
  }
})();

versionSelect.addEventListener("change", () => {
  const versions = manifest.universal.versions;
  selected = versions[parseInt(versionSelect.value, 10)];
  log(`Selected: ${selected.version} (${selected.file})`);
});

installBtn.addEventListener("click", async () => {
  try {
    if (!selected) throw new Error("No version selected");

    log("Downloading firmware...");
    const fw = await fetch(selected.file, { cache: "no-store" });
    if (!fw.ok) throw new Error("Failed to fetch firmware bin");

    const bytes = new Uint8Array(await fw.arrayBuffer());
    log(`Firmware size: ${bytes.length} bytes`);

    if (bytes.length < 1024) {
      log("⚠️ This looks like a placeholder / too small to be real firmware.");
      log("⚠️ Flashing will fail or do nothing useful until you replace it with a real .bin.");
      // You can return here to prevent flashing placeholders:
      // return;
    }

    log("🔌 Click the ESP32 serial port when prompted...");
    await flashOneImage({
      imageBytes: bytes,
      addressHex: selected.address,
      log
    });

  } catch (e) {
    log("ERROR: " + (e?.message || e));
  }
});

