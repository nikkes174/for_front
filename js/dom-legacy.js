(() => {
  // fronted/js/dom.js
  var root = document.querySelector("#root");
  function normalizePhone(value) {
    let digits = String(value != null ? value : "").replace(/\D/g, "");
    if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) digits = "7".concat(digits.slice(1));
    else if (digits.length === 10) digits = "7".concat(digits);
    return digits;
  }
  function formatPhone(value) {
    var _a;
    let digits = String(value != null ? value : "").replace(/\D/g, "");
    if (digits.startsWith("7") || digits.startsWith("8")) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    if (!digits) return "";
    const chunks = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)].filter(Boolean);
    return "+7".concat(chunks[0] ? " (".concat(chunks[0]) : "").concat(((_a = chunks[0]) == null ? void 0 : _a.length) === 3 ? ")" : "").concat(chunks[1] ? " ".concat(chunks[1]) : "").concat(chunks[2] ? "-".concat(chunks[2]) : "").concat(chunks[3] ? "-".concat(chunks[3]) : "");
  }
  function isPhoneInput(element) {
    return element instanceof HTMLInputElement && (element.type === "tel" || element.dataset.phoneInput !== void 0 || /(^|_)(phone|tel)(_|$)/i.test(element.name));
  }
  function isPhoneLikeLoginInput(element) {
    return element instanceof HTMLInputElement && element.dataset.loginPhoneInput !== void 0 && /^[+\d()\s-]+$/.test(String(element.value || "").trim());
  }
  document.addEventListener("input", (event) => {
    if (!isPhoneInput(event.target) && !isPhoneLikeLoginInput(event.target)) return;
    event.target.value = formatPhone(event.target.value);
  });
  document.addEventListener("blur", (event) => {
    if (!isPhoneInput(event.target) && !isPhoneLikeLoginInput(event.target)) return;
    event.target.value = formatPhone(event.target.value);
  }, true);
  var bodyScrollY = 0;
  var bodyScrollLocked = false;
  function visibleModalCount() {
    return document.querySelectorAll(".modal-backdrop:not([hidden])").length;
  }
  function lockBodyScroll() {
    if (bodyScrollLocked) return;
    bodyScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const body = document.body;
    body.dataset.scrollLock = "true";
    body.style.position = "fixed";
    body.style.top = "-".concat(bodyScrollY, "px");
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    bodyScrollLocked = true;
  }
  function unlockBodyScroll() {
    if (!bodyScrollLocked) return;
    const body = document.body;
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    body.style.overflow = "";
    delete body.dataset.scrollLock;
    bodyScrollLocked = false;
    window.scrollTo(0, bodyScrollY);
  }
  function syncBodyScrollLock() {
    if (visibleModalCount()) lockBodyScroll();
    else unlockBodyScroll();
  }
  var modalObserver = new MutationObserver(syncBodyScrollLock);
  modalObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden"]
  });
  window.addEventListener("pagehide", unlockBodyScroll);
  async function ensureCss() {
    if (document.querySelector("style[data-app-css]")) return;
    try {
      const response = await fetch("/css/styles.css", { cache: "no-store" });
      if (!response.ok) return;
      const style = document.createElement("style");
      style.dataset.appCss = "true";
      style.textContent = await response.text();
      document.head.append(style);
    } catch (e) {
    }
  }
  function escapeHtml(value) {
    return String(value != null ? value : "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function render(target, html) {
    target.innerHTML = html;
  }
  function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }
  function numberOrNull(value) {
    return value === "" || value == null ? null : Number(value);
  }
  function optional(value) {
    const trimmed = String(value != null ? value : "").trim();
    return trimmed ? trimmed : void 0;
  }
  function setMessage(container, text, type = "error") {
    const node = container.querySelector("[data-message]");
    if (!node) return;
    node.className = type === "error" ? "form-error" : "notice";
    node.textContent = text || "";
  }
  function field(label, name, attrs = "") {
    return "<label><span>".concat(escapeHtml(label), '</span><input name="').concat(escapeHtml(name), '" ').concat(attrs, "></label>");
  }
  function selectField(label, name, items, selected = "", placeholder = "\u041D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u043E") {
    const options = [
      '<option value="">'.concat(escapeHtml(placeholder), "</option>"),
      ...items.map((item) => {
        var _a, _b;
        const value = String((_a = item.id) != null ? _a : item.value);
        return '<option value="'.concat(escapeHtml(value), '" ').concat(String(selected) === value ? "selected" : "", ">").concat(escapeHtml((_b = item.name) != null ? _b : item.label), "</option>");
      })
    ];
    return "<label><span>".concat(escapeHtml(label), '</span><select name="').concat(escapeHtml(name), '">').concat(options.join(""), "</select></label>");
  }
  function rows(items, empty, mapper) {
    if (!(items == null ? void 0 : items.length)) return '<tr><td colspan="6">'.concat(escapeHtml(empty), "</td></tr>");
    return items.map(mapper).join("");
  }
})();
