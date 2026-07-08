export const root = document.querySelector("#root");

let bodyScrollY = 0;
let bodyScrollLocked = false;

function visibleModalCount() {
  return document.querySelectorAll(".modal-backdrop:not([hidden])").length;
}

function lockBodyScroll() {
  if (bodyScrollLocked) return;
  bodyScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  const body = document.body;
  body.dataset.scrollLock = "true";
  body.style.position = "fixed";
  body.style.top = `-${bodyScrollY}px`;
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

const modalObserver = new MutationObserver(syncBodyScrollLock);
modalObserver.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["hidden"],
});
window.addEventListener("pagehide", unlockBodyScroll);

export async function ensureCss() {
  if (document.querySelector("style[data-app-css]")) return;
  try {
    const response = await fetch("/css/styles.css", { cache: "no-store" });
    if (!response.ok) return;
    const style = document.createElement("style");
    style.dataset.appCss = "true";
    style.textContent = await response.text();
    document.head.append(style);
  } catch {
    // The page still works without styles; this is only a fallback for broken static routing.
  }
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function render(target, html) {
  target.innerHTML = html;
}

export function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export function numberOrNull(value) {
  return value === "" || value == null ? null : Number(value);
}

export function optional(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : undefined;
}

export function setMessage(container, text, type = "error") {
  const node = container.querySelector("[data-message]");
  if (!node) return;
  node.className = type === "error" ? "form-error" : "notice";
  node.textContent = text || "";
}

export function field(label, name, attrs = "") {
  return `<label><span>${escapeHtml(label)}</span><input name="${escapeHtml(name)}" ${attrs}></label>`;
}

export function selectField(label, name, items, selected = "", placeholder = "Не выбрано") {
  const options = [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...items.map((item) => {
      const value = String(item.id ?? item.value);
      return `<option value="${escapeHtml(value)}" ${String(selected) === value ? "selected" : ""}>${escapeHtml(item.name ?? item.label)}</option>`;
    }),
  ];
  return `<label><span>${escapeHtml(label)}</span><select name="${escapeHtml(name)}">${options.join("")}</select></label>`;
}

export function rows(items, empty, mapper) {
  if (!items?.length) return `<tr><td colspan="6">${escapeHtml(empty)}</td></tr>`;
  return items.map(mapper).join("");
}
