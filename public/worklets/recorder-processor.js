class RecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    const ch0 = input && input[0] ? input[0] : null;
    if (ch0 && ch0.length) {
      // Clone the frame to avoid posting an underlying buffer view
      this.port.postMessage(new Float32Array(ch0));
    } else {
      // Heartbeat so the main thread knows we are running
      this.port.postMessage({ heartbeat: true });
    }
    return true;
  }
}

registerProcessor('recorder-processor', RecorderProcessor);
