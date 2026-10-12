/** Saves a file through the browser. Nothing leaves the device. */
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  // iOS can take a while to start the download, so keep the URL alive for 30 s.
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function downloadText(text: string, name: string) {
  downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), name);
}
