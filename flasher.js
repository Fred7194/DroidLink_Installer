// flasher.js
// Minimal WebSerial flasher: writes ONE binary to ONE flash offset.
// Uses esptool-js from CDN (loaded in index.html).

/* global ESPLoader, Transport */

function hexToInt(h) {
  if (typeof h !== "string") return h;
  return parseInt(h.startsWith("0x") ? h : "0x" + h, 16);
}

async function flashOneImage({ imageBytes, addressHex, log }) {
  if (!("serial" in navigator)) {
    throw new Error("Web Serial not supported. Use Chrome or Edge.");
  }

  // Ask user for a serial port
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200 });

  const transport = new Transport(port);

  // ESPLoader will auto-detect chip. Works for ESP32 + ESP32-S3.
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
    const chip = await loader.main("no_reset"); // connect + sync
    log(`✅ Connected. Detected: ${chip}`);

    // Optional: bump baud for faster flashing (some USB-serial adapters dislike high rates)
    // await transport.setBaudRate(460800);
    // log("⚡ Baud set to 460800");

    const address = hexToInt(addressHex);
    log(`🧩 Flashing ${imageBytes.length} bytes to ${addressHex} ...`);

    // Flash a single segment
    const flashOptions = {
      fileArray: [{ data: imageBytes, address }],
      flashSize: "keep", // keep existing flash size
      flashMode: "keep",
      flashFreq: "keep",
      compress: true,
    };

    await loader.writeFlash(flashOptions);
    log("🎉 Flash complete. You can now reset / reboot the board.");
  } finally {
    try { await transport.disconnect(); } catch {}
    try { await port.close(); } catch {}
  }
}
