// flasher.js
// Minimal WebSerial flasher: writes ONE binary to ONE flash offset.
// Uses esptool-js from CDN (loaded in index.html).

function hexToInt(h) {
  if (typeof h !== "string") return h;
  return parseInt(h.startsWith("0x") ? h : "0x" + h, 16);
}

async function flashOneImage({ imageBytes, addressHex, log }) {
  if (!("serial" in navigator)) {
    throw new Error("Web Serial not supported. Use Chrome or Edge.");
  }

  // User must pick port
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200 });

  // These are GLOBALS provided by serial.js
  const transport = new Transport(port);
  const loader = new ESPLoader({
    transport,
    baudrate: 115200,
    terminal: {
      clean: () => {},
      writeLine: (s) => log(s),
      write: (s) => log(s),
    },
  });

  try {
    log("🔎 Detecting chip...");
    const chip = await loader.main();
    log(`✅ Connected. Detected: ${chip}`);

    const address = hexToInt(addressHex);
    log(`🧩 Flashing ${imageBytes.length} bytes to ${addressHex}...`);

    await loader.writeFlash({
      fileArray: [{ data: imageBytes, address }],
      flashSize: "keep",
      flashMode: "keep",
      flashFreq: "keep",
      compress: true,
    });

    log("🎉 Flash complete. Reset the board.");
  } finally {
    try { await transport.disconnect(); } catch {}
    try { await port.close(); } catch {}
  }
}

