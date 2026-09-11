window.escHtml = function (v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

window.escapeHtml = window.escHtml;

window.textToHtml = function (v) {
  return window.escapeHtml(v || "").replaceAll("\n", "<br />");
};
