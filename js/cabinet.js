(() => {
  // fronted/js/cabinet-source.js
  if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, fillString) {
      const value = String(this);
      const length = Math.max(Number(targetLength) || 0, 0);
      const fill = String(fillString === void 0 ? " " : fillString);
      if (value.length >= length || !fill) return value;
      return (fill.repeat(Math.ceil((length - value.length) / fill.length)) + value).slice(-length);
    };
  }
  function formDataObject(form2) {
    const result = {};
    const fields = form2 && form2.elements ? form2.elements : [];
    for (let index = 0; index < fields.length; index += 1) {
      const field = fields[index];
      if (!field.name || field.disabled || (field.type === "checkbox" || field.type === "radio") && !field.checked) continue;
      if (field.type === "file") {
        if (field.files && field.files.length) result[field.name] = field.files[0];
        continue;
      }
      if (field.multiple && field.options) {
        result[field.name] = Array.from(field.options).filter((option) => option.selected).map((option) => option.value);
        continue;
      }
      result[field.name] = field.value;
    }
    return result;
  }
  var form = document.querySelector("[data-cabinet-form]");
  var message = document.querySelector("[data-cabinet-message]");
  var historyList = document.querySelector("[data-cabinet-history]");
  var historySection = document.querySelector("[data-cabinet-history-section]");
  var bottomNav = document.querySelector("[data-cabinet-bottom-nav]");
  var profilePanel = document.querySelector('[data-cabinet-view="profile"]');
  var profileAvatar = document.querySelector("[data-cabinet-profile-avatar]");
  var profileEditButton = document.querySelector("[data-cabinet-edit]");
  var profileHeading = form == null ? void 0 : form.previousElementSibling;
  var profileMainBlock = document.createElement("div");
  profileMainBlock.className = "cabinet-profile-main-block";
  var myBookingsSection = document.querySelector(".cabinet-my-bookings");
  var cabinetTitle = document.querySelector("[data-cabinet-title]");
  var notificationsModal = document.querySelector("[data-cabinet-notifications-modal]");
  var pushToggleControl = document.querySelector(".cabinet-notifications-toggle");
  var pushToggle = document.querySelector("[data-cabinet-push-toggle]");
  var pushStatus = document.querySelector("[data-cabinet-push-status]");
  var contactPreference = document.querySelector("[data-cabinet-contact-preference]");
  var notificationsList = document.querySelector("[data-cabinet-notifications-list]");
  var achievementsList = document.querySelector("[data-cabinet-achievements]");
  var achievementModal = document.querySelector("[data-cabinet-achievement-modal]");
  var achievementContent = document.querySelector("[data-cabinet-achievement-content]");
  var clientBookingForm = document.querySelector("[data-client-booking-form]");
  var clientBookingServices = document.querySelector("[data-client-booking-services]");
  var clientBookingSlots = document.querySelector("[data-client-booking-slots]");
  var clientBookingMessage = document.querySelector("[data-client-booking-message]");
  var clientBookingList = document.querySelector("[data-client-booking-list]");
  var publicBookingMatch = window.location.pathname.match(/^\/online-booking\/(\d+)\/?$/);
  var publicBookingOrganizationId = publicBookingMatch ? Number(publicBookingMatch[1]) : 0;
  var publicBookingRegistration = document.querySelector("[data-public-booking-registration]");
  var publicBookingRegistrationForm = document.querySelector("[data-public-booking-registration-form]");
  var token = new URLSearchParams(window.location.search).get("token");
  var submitButton = form.querySelector("button");
  var defaultRegistrationFields = ["last_name", "first_name", "middle_name", "phone", "gender", "email"];
  var cabinetFieldNames = ["last_name", "first_name", "middle_name", "phone", "gender", "telegram_id", "max_id", "vk_id", "email"];
  var clientFieldSectionPrefix = "client_field_";
  var clientBonusesSection = "client_bonuses";
  var clientBonusesConfiguredSection = "client_bonuses_configured";
  var clientAccessConfiguredSection = "client_access_configured";
  var clientAccessSections = ["client_online_booking", "client_achievements", "client_notifications", "client_logout"];
  var clientBottomMenuSections = ["client_online_booking", "client_achievements", "client_chat", "client_notifications", "client_logout"];
  var defaultCardSections = ["client_name", "client_level", "client_visits", "client_personal_link", "client_chat", ...clientAccessSections];
  var currentCardSections = defaultCardSections;
  var currentAccessSections = defaultCardSections;
  var currentClient = null;
  var cabinetData = null;
  var preferredContactChannel = "";
  var allCabinetSections = ["profile", "visits", "loyalty", "achievements", "referrals"];
  var loadedCabinetSections = /* @__PURE__ */ new Set();
  var cabinetSectionsPromise = null;
  var selectedVisit = null;
  var visitsPage = 1;
  var visitsExpanded = false;
  var bookingVisitsExpanded = false;
  var branchReviewsRequestId = 0;
  var openServiceCategoryId = null;
  var visitReviewRating = 0;
  var reviewedVisitIds = new Set(JSON.parse(sessionStorage.getItem("cabinet.reviewedVisitIds") || "[]"));
  var VISITS_PER_PAGE = 5;
  function applyAvailableContactChannels(channels) {
    if (!contactPreference) return;
    const available = /* @__PURE__ */ new Set([
      "application",
      ...(Array.isArray(channels) ? channels : []).map((channel) => String(channel).toLowerCase())
    ]);
    const preferenceBlock = contactPreference.closest(".cabinet-contact-preference");
    if (preferenceBlock) preferenceBlock.hidden = available.size <= 1;
    contactPreference.querySelectorAll("[data-cabinet-contact-channel]").forEach((option) => {
      const enabled = available.has(option.dataset.cabinetContactChannel);
      option.hidden = !enabled;
      option.disabled = !enabled;
    });
    const selected = contactPreference.selectedOptions[0];
    if (selected == null ? void 0 : selected.disabled) {
      contactPreference.value = "";
      preferredContactChannel = "";
    }
  }
  var clientBookingOptions = null;
  var publicBookingAnonymous = false;
  var publicBookingClientId = null;
  var publicBookingVisitClientName = "";
  var clientBookingMasterPreviews = null;
  var clientBookingMastersRequestId = 0;
  var clientBookingMastersLoadingKey = "";
  var clientBookingCompatibility = null;
  var clientBookingCompatibilityRequestId = 0;
  var clientBookingSelectedStart = "";
  var clientBookingCalendarMonth = new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1);
  var SESSION_TOKEN_KEY = "loyalty.sessionToken";
  var CABINET_NOTIFICATIONS_SEEN_KEY = "cabinetNotificationsSeenAt";
  var PWA_PUSH_PERMISSION_REQUESTED_KEY = "loyalty.pwaPushPermissionRequested.v2";
  var PWA_SESSION_HASH_PREFIX = "#pwa_session=";
  var _a;
  var isStandalonePwa = ((_a = window.matchMedia) == null ? void 0 : _a.call(window, "(display-mode: standalone)").matches) || window.navigator.standalone === true;
  if (window.location.hash.startsWith(PWA_SESSION_HASH_PREFIX)) {
    const pwaSessionToken = decodeURIComponent(window.location.hash.slice(PWA_SESSION_HASH_PREFIX.length));
    if (pwaSessionToken) localStorage.setItem(SESSION_TOKEN_KEY, pwaSessionToken);
    if (isStandalonePwa) history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js?v=9-media", { updateViaCache: "none" }).catch(() => null);
    });
  }
  function escapeHtml(value) {
    return String(value != null ? value : "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }
  var bookingLoadingCount = 0;
  function setBookingLoader(active, label = "\u0421\u043E\u0437\u0434\u0430\u0451\u043C \u0437\u0430\u043F\u0438\u0441\u044C\u2026") {
    bookingLoadingCount = Math.max(0, bookingLoadingCount + (active ? 1 : -1));
    let loader = document.querySelector("[data-booking-loader]");
    if (!bookingLoadingCount) {
      loader == null ? void 0 : loader.remove();
      return;
    }
    if (loader) return;
    loader = document.createElement("div");
    loader.className = "cabinet-booking-loader";
    loader.dataset.bookingLoader = "";
    loader.setAttribute("role", "status");
    loader.innerHTML = `<span class="cabinet-booking-spinner" aria-hidden="true"></span><b>${escapeHtml(label)}</b>`;
    document.body.append(loader);
  }
  function showBookingSuccessToast(message2 = "\u0412\u044B \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u044B") {
    return new Promise((resolve) => {
      const toast = document.createElement("div");
      toast.className = "cabinet-booking-toast";
      toast.setAttribute("role", "status");
      toast.innerHTML = `<span aria-hidden="true">\u2713</span><b>${escapeHtml(message2)}</b>`;
      document.body.append(toast);
      requestAnimationFrame(() => toast.classList.add("is-visible"));
      window.setTimeout(() => {
        toast.classList.remove("is-visible");
        window.setTimeout(() => {
          toast.remove();
          resolve();
        }, 220);
      }, 1600);
    });
  }
  var serviceGalleryUrls = [];
  var serviceGalleryIndex = 0;
  var serviceGalleryTitle = "";
  function updateServiceGallery() {
    const lightbox = document.querySelector("[data-service-gallery-lightbox]");
    if (!lightbox || !serviceGalleryUrls.length) return;
    const image = lightbox.querySelector("[data-service-gallery-image]");
    image.classList.add("is-loading");
    image.onload = () => {
      image.classList.remove("is-loading");
      const preload = () => {
        [-1, 1].forEach((offset) => {
          if (serviceGalleryUrls.length < 2) return;
          const next = new Image();
          next.src = serviceGalleryUrls[(serviceGalleryIndex + offset + serviceGalleryUrls.length) % serviceGalleryUrls.length];
        });
      };
      if ("requestIdleCallback" in window) window.requestIdleCallback(preload, { timeout: 1e3 });
      else window.setTimeout(preload, 100);
    };
    image.src = serviceGalleryUrls[serviceGalleryIndex];
    image.alt = serviceGalleryTitle;
    lightbox.querySelector("[data-service-gallery-count]").textContent = String(serviceGalleryIndex + 1) + " / " + String(serviceGalleryUrls.length);
    lightbox.querySelectorAll("[data-service-gallery-step]").forEach((button) => {
      button.hidden = serviceGalleryUrls.length < 2;
    });
  }
  function openServiceGallery(imageUrls, title, startIndex = 0) {
    var _a3;
    serviceGalleryUrls = imageUrls;
    serviceGalleryIndex = Math.min(Math.max(Number(startIndex) || 0, 0), Math.max(imageUrls.length - 1, 0));
    serviceGalleryTitle = title || "";
    document.body.insertAdjacentHTML("beforeend", `<div class="cabinet-service-lightbox" data-service-gallery-lightbox role="dialog" aria-modal="true">
          <button type="button" class="cabinet-service-lightbox-close" data-service-gallery-close aria-label="\u0417\u0430\u043A\u0440\u044B\u0442\u044C">&times;</button>
          <button type="button" class="cabinet-service-lightbox-arrow prev" data-service-gallery-step="-1" aria-label="\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0435 \u0444\u043E\u0442\u043E">&lsaquo;</button>
          <img data-service-gallery-image decoding="async" alt="">
          <button type="button" class="cabinet-service-lightbox-arrow next" data-service-gallery-step="1" aria-label="\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0435 \u0444\u043E\u0442\u043E">&rsaquo;</button>
          <span class="cabinet-service-lightbox-count" data-service-gallery-count></span>
        </div>`);
    document.body.classList.add("service-gallery-open");
    updateServiceGallery();
    (_a3 = document.querySelector("[data-service-gallery-close]")) == null ? void 0 : _a3.focus();
  }
  function closeServiceGallery() {
    var _a3;
    (_a3 = document.querySelector("[data-service-gallery-lightbox]")) == null ? void 0 : _a3.remove();
    document.body.classList.remove("service-gallery-open");
    serviceGalleryUrls = [];
  }
  document.addEventListener("click", (event) => {
    const galleryButton = event.target.closest("[data-service-gallery-open]");
    if (galleryButton) {
      event.preventDefault();
      const imageUrls = JSON.parse(galleryButton.dataset.serviceGalleryImages || "[]");
      if (imageUrls.length) openServiceGallery(imageUrls, galleryButton.dataset.serviceGalleryTitle, galleryButton.dataset.serviceGalleryIndex);
      return;
    }
    const step = event.target.closest("[data-service-gallery-step]");
    if (step && serviceGalleryUrls.length) {
      serviceGalleryIndex = (serviceGalleryIndex + Number(step.dataset.serviceGalleryStep) + serviceGalleryUrls.length) % serviceGalleryUrls.length;
      updateServiceGallery();
      return;
    }
    if (event.target.closest("[data-service-gallery-close]") || event.target.matches("[data-service-gallery-lightbox]")) {
      closeServiceGallery();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (!document.querySelector("[data-service-gallery-lightbox]")) return;
    if (event.key === "Escape") closeServiceGallery();
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const offset = event.key === "ArrowLeft" ? -1 : 1;
      serviceGalleryIndex = (serviceGalleryIndex + offset + serviceGalleryUrls.length) % serviceGalleryUrls.length;
      updateServiceGallery();
    }
  });
  function pushContext() {
    const client = (cabinetData == null ? void 0 : cabinetData.client) || currentClient || {};
    return { organizationId: (cabinetData == null ? void 0 : cabinetData.organization_id) || client.organization_id, clientId: client.id || (cabinetData == null ? void 0 : cabinetData.client_id) };
  }
  function base64ToUint8Array(value) {
    const padding = "=".repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  }
  async function requestJson(path, options = {}) {
    const response = await fetch(path, {
      credentials: "include",
      cache: options.cache || "default",
      headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers,
      ...options
    });
    if (!response.ok) throw new Error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F");
    return response.json();
  }
  var CABINET_ORGANIZATION_BRANDING_CACHE_PREFIX = "cabinet.organizationBranding:";
  var cabinetOrganizationBranding = null;
  async function loadCabinetOrganizationName(organizationId) {
    const id = Number(organizationId || 0);
    const wordmark = document.querySelector("[data-cabinet-organization-name]");
    if (!id || !wordmark) return;
    const cacheKey = `${CABINET_ORGANIZATION_BRANDING_CACHE_PREFIX}${id}`;
    let cachedBranding = null;
    try {
      cachedBranding = JSON.parse(localStorage.getItem(cacheKey) || "null");
    } catch (e) {
    }
    if (cachedBranding == null ? void 0 : cachedBranding.name) {
      cabinetOrganizationBranding = cachedBranding;
      wordmark.textContent = cachedBranding.name;
      return;
    }
    const result = await requestJson(`/public-api/organizations/${encodeURIComponent(id)}/booking-reference`, { cache: "default" }).catch(() => null);
    const organization = (result == null ? void 0 : result.organization) || {};
    const name = String(organization.name || "").trim();
    if (!name) return;
    cabinetOrganizationBranding = {
      name,
      photo_file_id: organization.photo_file_id || "",
      updated_at: organization.updated_at || ""
    };
    wordmark.textContent = name;
    localStorage.setItem(cacheKey, JSON.stringify(cabinetOrganizationBranding));
  }
  async function restoreStoredSession() {
    const token2 = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token2) return null;
    try {
      const result = await requestJson("/auth/session/restore", {
        method: "POST",
        body: JSON.stringify({ token: token2 })
      });
      if (result == null ? void 0 : result.session_token) localStorage.setItem(SESSION_TOKEN_KEY, result.session_token);
      return (result == null ? void 0 : result.user) || null;
    } catch (e) {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      return null;
    }
  }
  async function currentUser() {
    const response = await fetch("/auth/me");
    if (response.ok) return response.json();
    return restoreStoredSession();
  }
  function exposeSessionForPwaInstall() {
    if (isStandalonePwa) return;
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken) return;
    history.replaceState(null, "", `${window.location.pathname}${PWA_SESSION_HASH_PREFIX}${encodeURIComponent(sessionToken)}`);
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) manifestLink.href = `/auth/pwa-manifest.webmanifest?session=${Date.now()}`;
  }
  async function refreshPushState() {
    var _a3, _b;
    const { organizationId, clientId } = pushContext();
    if (!organizationId || !clientId) {
      pushToggle.disabled = true;
      pushStatus.textContent = "\u041A\u043B\u0438\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D.";
      return null;
    }
    const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.register("/service-worker.js?v=9-media", { updateViaCache: "none" }).catch(() => null) : null;
    const subscription = await ((_b = (_a3 = registration == null ? void 0 : registration.pushManager) == null ? void 0 : _a3.getSubscription) == null ? void 0 : _b.call(_a3));
    const endpoint = (subscription == null ? void 0 : subscription.endpoint) ? `&endpoint=${encodeURIComponent(subscription.endpoint)}` : "";
    const state = await requestJson(`/crm-api/client-communications/push/status?organization_id=${organizationId}&client_id=${clientId}${endpoint}`, { cache: "no-store" });
    preferredContactChannel = String(state.preferred_contact_channel || "");
    const preferredOption = [...contactPreference.options].find(
      (option) => option.dataset.cabinetContactChannel === preferredContactChannel && !option.disabled
    );
    contactPreference.value = (preferredOption == null ? void 0 : preferredOption.value) || "";
    const supportsPush = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    pushToggle.checked = !!state.enabled && (!supportsPush || Notification.permission === "granted" && !!subscription);
    pushToggle.disabled = !state.configured;
    pushStatus.textContent = state.configured ? "" : "Push-\u043A\u043B\u044E\u0447\u0438 VAPID \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u044B \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435.";
    return state;
  }
  function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("ru-RU");
  }
  function notificationStamp(item) {
    return String((item == null ? void 0 : item.sent_at) || (item == null ? void 0 : item.created_at) || (item == null ? void 0 : item.id) || "");
  }
  function linkifyText(value) {
    const text = String(value != null ? value : "");
    const pattern = /https?:\/\/[^\s<>"']+/g;
    let html = "";
    let lastIndex = 0;
    let match;
    while (match = pattern.exec(text)) {
      const url = match[0];
      html += escapeHtml(text.slice(lastIndex, match.index));
      html += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
      lastIndex = match.index + url.length;
    }
    return html + escapeHtml(text.slice(lastIndex));
  }
  function notificationTitle(item) {
    return String((item == null ? void 0 : item.message_title) || (item == null ? void 0 : item.message_text) || "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435").trim().slice(0, 120) || "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435";
  }
  function notificationImageGroup(item) {
    const images = [...new Set((Array.isArray(item == null ? void 0 : item.image_urls) ? item.image_urls : []).filter(Boolean))].slice(0, 10);
    if (!images.length) return "";
    const serialized = escapeHtml(JSON.stringify(images));
    const title = escapeHtml(notificationTitle(item));
    return `<div class="cabinet-notification-media">${images.map((url, index) => `<button type="button" data-service-gallery-open data-service-gallery-images="${serialized}" data-service-gallery-title="${title}" data-service-gallery-index="${index}" aria-label="\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 ${index + 1}"><img src="${escapeHtml(url)}" alt="" loading="lazy" decoding="async"></button>`).join("")}</div>`;
  }
  function notificationsSeenKey(clientId) {
    return `${CABINET_NOTIFICATIONS_SEEN_KEY}:${clientId || "unknown"}`;
  }
  function setNotificationBadge(hasUnread) {
    var _a3;
    (_a3 = document.querySelector("[data-cabinet-notifications-open]")) == null ? void 0 : _a3.classList.toggle("has-unread", !!hasUnread);
  }
  async function refreshNotificationsList({ markSeen = false } = {}) {
    const { clientId } = pushContext();
    if (!clientId) return;
    const messages = await requestJson(`/crm-api/client-communications/clients/${clientId}/messages?channel=push&message_type=notification&limit=20`, { cache: "no-store" });
    if (!messages.length) {
      notificationsList.textContent = "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0439 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.";
      setNotificationBadge(false);
      return;
    }
    const latestStamp = notificationStamp(messages[0]);
    const seenKey = notificationsSeenKey(clientId);
    const seenStamp = localStorage.getItem(seenKey) || "";
    setNotificationBadge(Boolean(latestStamp && latestStamp !== seenStamp));
    notificationsList.innerHTML = messages.map((item) => `
          <details class="cabinet-notification-item">
            <summary>${escapeHtml(notificationTitle(item))}</summary>
            <div class="cabinet-notification-text">${linkifyText(item.message_text || "")}</div>
            ${notificationImageGroup(item)}
            <small>${escapeHtml(formatDateTime(item.sent_at || item.created_at))}</small>
          </details>
        `).join("");
    if (markSeen) {
      localStorage.setItem(seenKey, latestStamp);
      setNotificationBadge(false);
    }
  }
  async function enablePushNotifications() {
    const { organizationId, clientId } = pushContext();
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      await requestJson("/crm-api/client-communications/push/preference", {
        method: "POST",
        body: JSON.stringify({ organization_id: organizationId, client_id: clientId, enabled: true })
      });
      pushStatus.textContent = "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u044B.";
      pushToggle.checked = true;
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      await requestJson("/crm-api/client-communications/push/preference", {
        method: "POST",
        body: JSON.stringify({ organization_id: organizationId, client_id: clientId, enabled: false })
      }).catch(() => null);
      pushStatus.textContent = `\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435 \u043D\u0430 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043D\u0435 \u0432\u044B\u0434\u0430\u043D\u043E: ${permission}.`;
      pushToggle.checked = false;
      return;
    }
    try {
      const state = await requestJson(`/crm-api/client-communications/push/status?organization_id=${organizationId}&client_id=${clientId}`, { cache: "no-store" });
      if (!(state == null ? void 0 : state.public_key)) throw new Error("Push-\u043A\u043B\u044E\u0447\u0438 VAPID \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u044B \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435.");
      const registration = await navigator.serviceWorker.register("/service-worker.js");
      const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(state.public_key)
      });
      await requestJson("/crm-api/client-communications/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          organization_id: organizationId,
          client_id: clientId,
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
          platform: navigator.platform || "",
          user_agent: navigator.userAgent || ""
        })
      });
      await requestJson("/crm-api/client-communications/push/preference", {
        method: "POST",
        body: JSON.stringify({ organization_id: organizationId, client_id: clientId, enabled: true })
      });
      pushStatus.textContent = "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u044B.";
      pushToggle.checked = true;
    } catch (error) {
      await requestJson("/crm-api/client-communications/push/preference", {
        method: "POST",
        body: JSON.stringify({ organization_id: organizationId, client_id: clientId, enabled: false })
      }).catch(() => null);
      pushStatus.textContent = error.message || "\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E, push-\u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0430 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0430.";
      pushToggle.checked = false;
    }
  }
  async function requestPushOnFirstPwaLaunch(state) {
    if (!isStandalonePwa || localStorage.getItem(PWA_PUSH_PERMISSION_REQUESTED_KEY)) return;
    if (!(state == null ? void 0 : state.configured)) return;
    if (pushToggle.checked && Notification.permission === "granted") {
      localStorage.setItem(PWA_PUSH_PERMISSION_REQUESTED_KEY, "1");
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      localStorage.setItem(PWA_PUSH_PERMISSION_REQUESTED_KEY, "1");
      return;
    }
    localStorage.setItem(PWA_PUSH_PERMISSION_REQUESTED_KEY, "1");
    try {
      await enablePushNotifications();
    } catch (error) {
      pushStatus.textContent = error.message || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F.";
    }
    if (Notification.permission !== "granted") {
      notificationsModal.hidden = false;
      pushStatus.textContent = Notification.permission === "denied" ? "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D\u044B \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F." : "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0442\u0443\u043C\u0431\u043B\u0435\u0440\u043E\u043C, \u0447\u0442\u043E\u0431\u044B iPhone \u043F\u043E\u043A\u0430\u0437\u0430\u043B \u0441\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441.";
    }
  }
  async function disablePushNotifications() {
    const { organizationId, clientId } = pushContext();
    await requestJson("/crm-api/client-communications/push/preference", {
      method: "POST",
      body: JSON.stringify({ organization_id: organizationId, client_id: clientId, enabled: false })
    });
    const registration = await navigator.serviceWorker.ready.catch(() => null);
    const subscription = await (registration == null ? void 0 : registration.pushManager.getSubscription());
    if (subscription) {
      await requestJson("/crm-api/client-communications/push/subscribe", {
        method: "DELETE",
        body: JSON.stringify({ endpoint: subscription.endpoint })
      }).catch(() => null);
      await subscription.unsubscribe().catch(() => null);
    }
    pushToggle.checked = false;
    pushStatus.textContent = "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u044B.";
  }
  function sectionTitle(section) {
    if (section === "client_name") return "\u0424\u0418\u041E";
    if (section === "client_level") return "\u0423\u0440\u043E\u0432\u0435\u043D\u044C";
    if (section === "client_visits") return "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0432\u0438\u0437\u0438\u0442\u043E\u0432";
    if (section === "client_personal_link") return "\u0420\u0435\u0444\u0435\u0440\u0430\u043B\u044C\u043D\u0430\u044F \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430";
    if (section === clientBonusesSection) return "\u0411\u043E\u043D\u0443\u0441\u044B";
    if (section === "client_chat") return "\u0427\u0430\u0442";
    if (section.startsWith("bonus_")) return "\u0411\u043E\u043D\u0443\u0441\u044B";
    return section;
  }
  function clientName(client) {
    return (client == null ? void 0 : client.full_name) || [client == null ? void 0 : client.last_name, client == null ? void 0 : client.first_name, client == null ? void 0 : client.middle_name].filter(Boolean).join(" ") || "\u041A\u043B\u0438\u0435\u043D\u0442";
  }
  function money(value) {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? amount.toLocaleString("ru-RU", { maximumFractionDigits: 2 }) : String(value || 0);
  }
  function cabinetBranchTimezone(branchId) {
    var _a3, _b;
    return ((_b = (_a3 = clientBookingOptions == null ? void 0 : clientBookingOptions.branches) == null ? void 0 : _a3.find((branch) => String(branch.id) === String(branchId))) == null ? void 0 : _b.timezone) || "Europe/Moscow";
  }
  function dateTime(value, branchId = null) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("ru-RU", branchId ? { timeZone: cabinetBranchTimezone(branchId) } : void 0);
  }
  function visitDateTime(value, branchId) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("ru-RU", {
      timeZone: cabinetBranchTimezone(branchId),
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  function visitStatus(status) {
    const labels = {
      completed: "\u0417\u0430\u0432\u0435\u0440\u0448\u0451\u043D",
      scheduled: "\u0417\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D",
      cancelled: "\u041E\u0442\u043C\u0435\u043D\u0451\u043D",
      no_show: "\u041D\u0435 \u043F\u0440\u0438\u0448\u0451\u043B"
    };
    return labels[status] || status || "-";
  }
  function reviewStar(active) {
    const color = active ? "#F5B301" : "#D0D5DD";
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="${active ? color : "none"}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M13.73 3.51001L15.49 7.03001C15.73 7.52002 16.37 7.99001 16.91 8.08001L20.1 8.61001C22.14 8.95001 22.62 10.43 21.15 11.89L18.67 14.37C18.25 14.79 18.02 15.6 18.15 16.18L18.86 19.25C19.42 21.68 18.13 22.62 15.98 21.35L12.99 19.58C12.45 19.26 11.56 19.26 11.01 19.58L8.01997 21.35C5.87997 22.62 4.57997 21.67 5.13997 19.25L5.84997 16.18C5.97997 15.6 5.74997 14.79 5.32997 14.37L2.84997 11.89C1.38997 10.43 1.85997 8.95001 3.89997 8.61001L7.08997 8.08001C7.61997 7.99001 8.25997 7.52002 8.49997 7.03001L10.26 3.51001C11.22 1.60001 12.78 1.60001 13.73 3.51001Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function reviewStars(value) {
    const rating = Math.max(0, Math.min(5, Number(value) || 0));
    return Array.from({ length: 5 }, (_, index) => reviewStar(index < rating)).join("");
  }
  function reviewsCountLabel(value) {
    const count = Math.max(0, Number(value) || 0);
    const mod100 = count % 100;
    const mod10 = count % 10;
    const word = mod100 >= 11 && mod100 <= 14 ? "\u043E\u0442\u0437\u044B\u0432\u043E\u0432" : mod10 === 1 ? "\u043E\u0442\u0437\u044B\u0432" : mod10 >= 2 && mod10 <= 4 ? "\u043E\u0442\u0437\u044B\u0432\u0430" : "\u043E\u0442\u0437\u044B\u0432\u043E\u0432";
    return `${count} ${word}`;
  }
  function bonusName(section) {
    var _a3;
    const code = ((_a3 = bonusBalanceForSection(section)) == null ? void 0 : _a3.bonus_type) || section.replace(/^bonus_/, "") || "cashback";
    const type = ((cabinetData == null ? void 0 : cabinetData.bonus_types) || []).find((item) => item.code === code);
    return (type == null ? void 0 : type.name) || (code === "cashback" ? "\u041A\u0435\u0448\u0431\u044D\u043A" : code);
  }
  function bonusBalanceForSection(section) {
    const code = section.replace(/^bonus_/, "") || "cashback";
    const balances = (cabinetData == null ? void 0 : cabinetData.bonus_balances) || [];
    const exact = balances.find((item) => (item.bonus_type || "cashback") === code);
    if (code !== "cashback") return exact;
    return balances.filter((item) => item.bonus_type && item.bonus_type !== "cashback").sort((left, right) => Number(right.balance || 0) - Number(left.balance || 0))[0] || exact;
  }
  function visitItemName(item, kind) {
    const nested = item.service || item.product || item.good || item.item || {};
    const name = item.title || item.name || item.service_name || item.product_name || item.good_title || nested.title || nested.name;
    if (name) return name;
    const id = item.service_id || item.product_id || item.good_id || item.id;
    return id ? `${kind} #${id}` : "-";
  }
  function parseVisitComment(value) {
    const lines = String(value || "").split("\n");
    const meta = { serviceNames: "", productNames: "", comment: "" };
    const commentLines = [];
    for (const line of lines) {
      if (line.startsWith("__services:")) meta.serviceNames = line.slice("__services:".length).trim();
      else if (line.startsWith("__products:")) meta.productNames = line.slice("__products:".length).trim();
      else if (line.startsWith("__")) continue;
      else commentLines.push(line);
    }
    meta.comment = commentLines.join("\n").trim();
    return meta;
  }
  function visitItems(items, emptyText, kind) {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return `<p class="cabinet-history-empty">${escapeHtml(emptyText)}</p>`;
    return `<ul class="cabinet-visit-items">${list.map((item) => `<li>${escapeHtml(visitItemName(item, kind))}</li>`).join("")}</ul>`;
  }
  function visitPersonName(visit) {
    const staff = visit.yclients_staff || {};
    return visit.employee_name || staff.name || staff.title || [staff.last_name, staff.first_name, staff.middle_name].filter(Boolean).join(" ") || (visit.employee_id ? `#${visit.employee_id}` : "-");
  }
  function visitBranchName(visit) {
    const branch = visit.branch || visit.yclients_branch || visit.yclients_company || {};
    return visit.branch_name || branch.name || branch.title || (visit.branch_id ? `#${visit.branch_id}` : "-");
  }
  function visitEmployeeId(visit) {
    var _a3;
    return Number(visit.employee_id || visit.master_id || ((_a3 = visit.yclients_staff) == null ? void 0 : _a3.id) || 0);
  }
  function visitCommentPhotos(visit) {
    const photos = Array.isArray(visit == null ? void 0 : visit.photos_comment) ? visit.photos_comment : [];
    if (!photos.length || !(visit == null ? void 0 : visit.id)) return "";
    return `<div class="cabinet-visit-comment-photos">${photos.map((photo) => `<a href="/crm-api/client-history/visits/${escapeHtml(visit.id)}/photos/comment/${escapeHtml(photo.id)}" target="_blank" rel="noopener"><img src="/crm-api/client-history/visits/${escapeHtml(visit.id)}/photos/comment/${escapeHtml(photo.id)}" alt="\u0424\u043E\u0442\u043E \u043A \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u044E" loading="lazy" decoding="async"></a>`).join("")}</div>`;
  }
  function visitIsCompleted(visit) {
    const value = String(visit.visit_status || visit.attendance_title || "").toLowerCase();
    return value === "completed" || value === "\u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D";
  }
  function visitHistoryItems(item) {
    const visit = item.visit || item;
    const parsed = parseVisitComment(visit.comment);
    const services = (item.services || visit.yclients_services || []).length ? item.services || visit.yclients_services || [] : parsed.serviceNames.split(",").map((name) => ({ name: name.trim() })).filter((service) => service.name);
    const products = (item.products || visit.yclients_goods_transactions || []).length ? item.products || visit.yclients_goods_transactions || [] : parsed.productNames.split(",").map((name) => ({ name: name.trim() })).filter((product) => product.name);
    const employeeId = visitEmployeeId(visit);
    const visitId = String(visit.id || item.id || "");
    return `
          <article class="cabinet-visit-card">
            <div class="cabinet-visit-card-head"><b>${escapeHtml(visitDateTime(visit.visit_at || visit.created_at, visit.branch_id) || "\u0414\u0430\u0442\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430")}</b><span>${escapeHtml(visitStatus(visit.visit_status || visit.attendance_title || visit.source))}</span></div>
            <div class="cabinet-visit-details">
              <div><span>\u0424\u0438\u043B\u0438\u0430\u043B</span><b>${escapeHtml(visitBranchName(visit))}</b></div>
              <div><span>\u041C\u0430\u0441\u0442\u0435\u0440</span><b>${escapeHtml(visitPersonName(visit))}</b></div>
              <div><span>\u0423\u0441\u043B\u0443\u0433\u0438</span>${visitItems(services, "\u0423\u0441\u043B\u0443\u0433 \u043D\u0435\u0442", "\u0423\u0441\u043B\u0443\u0433\u0430")}</div>
              <div><span>\u0422\u043E\u0432\u0430\u0440\u044B</span>${visitItems(products, "\u0422\u043E\u0432\u0430\u0440\u043E\u0432 \u043D\u0435\u0442", "\u0422\u043E\u0432\u0430\u0440")}</div>
              <div><span>\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C</span><b>${escapeHtml(money(visit.total_cost || visit.paid_amount))}</b></div>
              ${parsed.comment ? `<div><span>\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439</span><b class="cabinet-visit-comment">${escapeHtml(parsed.comment)}</b></div>` : ""}
              ${visitCommentPhotos(visit)}
            </div>
            ${visitIsCompleted(visit) && employeeId ? reviewedVisitIds.has(visitId) ? '<span class="cabinet-visit-review-done">\u041E\u0442\u0437\u044B\u0432 \u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D</span>' : `<button type="button" class="cabinet-visit-review-button" data-visit-review data-visit-id="${escapeHtml(visitId)}" data-branch-id="${escapeHtml(visit.branch_id || "")}" data-employee-id="${escapeHtml(employeeId)}" data-employee-name="${escapeHtml(visitPersonName(visit))}">\u041E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043E\u0442\u0437\u044B\u0432</button>` : ""}
          </article>
        `;
  }
  function visitsPageHtml(visits) {
    const source = Array.isArray(visits) ? visits : [];
    if (!source.length) {
      return `
            <p class="cabinet-history-empty">
              \u0412\u0438\u0437\u0438\u0442\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.
            </p>
          `;
    }
    const pages = Math.max(1, Math.ceil(source.length / VISITS_PER_PAGE));
    visitsPage = Math.max(1, Math.min(visitsPage, pages));
    const start = (visitsPage - 1) * VISITS_PER_PAGE;
    const pageVisits = source.slice(start, start + VISITS_PER_PAGE);
    return `
          <div class="cabinet-visit-page-content" data-cabinet-visits-page-content>
            <div class="cabinet-visit-list">
              ${pageVisits.map(visitHistoryItems).join("")}
            </div>
            ${visitPagination(source)}
          </div>
        `;
  }
  function renderVisitsPage() {
    const container = document.querySelector("[data-cabinet-visits-page-content]");
    if (!container) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = visitsPageHtml((cabinetData == null ? void 0 : cabinetData.visits) || []).trim();
    const next = wrapper.firstElementChild;
    if (next) container.innerHTML = next.innerHTML;
  }
  function visitPagination(visits) {
    const pages = Math.ceil(visits.length / VISITS_PER_PAGE);
    if (pages <= 1) return "";
    return `<div class="cabinet-visit-pagination"><button type="button" class="ghost" data-cabinet-visits-page="prev" ${visitsPage === 1 ? "disabled" : ""}>\u041D\u0430\u0437\u0430\u0434</button><span>${visitsPage} / ${pages}</span><button type="button" class="ghost" data-cabinet-visits-page="next" ${visitsPage === pages ? "disabled" : ""}>\u0412\u043F\u0435\u0440\u0451\u0434</button></div>`;
  }
  function visitModal() {
    const selected = selectedVisit;
    if (!selected) return "";
    const visit = selected.visit || selected;
    const parsed = parseVisitComment(visit.comment);
    const services = (selected.services || visit.yclients_services || []).length ? selected.services || visit.yclients_services || [] : parsed.serviceNames ? parsed.serviceNames.split(",").map((name) => ({ name: name.trim() })).filter((item) => item.name) : [];
    const products = (selected.products || visit.yclients_goods_transactions || []).length ? selected.products || visit.yclients_goods_transactions || [] : parsed.productNames ? parsed.productNames.split(",").map((name) => ({ name: name.trim() })).filter((item) => item.name) : [];
    return `
          <div class="modal-backdrop" data-cabinet-visit-modal>
            <div class="modal-card">
              <div class="modal-head">
                <h3>\u0412\u0438\u0437\u0438\u0442</h3>
                <button type="button" class="ghost" data-cabinet-close-visit>\u0417\u0430\u043A\u0440\u044B\u0442\u044C</button>
              </div>
              <div class="modal-grid">
                <div class="readonly-field"><span>\u0414\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F</span><b>${escapeHtml(dateTime(visit.visit_at || visit.created_at, visit.branch_id) || "-")}</b></div>
                <div class="readonly-field"><span>\u0421\u0442\u0430\u0442\u0443\u0441 \u0432\u0438\u0437\u0438\u0442\u0430</span><b>${escapeHtml(visitStatus(visit.visit_status || visit.attendance_title))}</b></div>
                <div class="readonly-field"><span>\u0424\u0438\u043B\u0438\u0430\u043B</span><b>${escapeHtml(visit.branch_id || "-")}</b></div>
                <div class="readonly-field"><span>\u041C\u0430\u0441\u0442\u0435\u0440</span><b>${escapeHtml(visit.employee_id || "-")}</b></div>
                <div class="readonly-field"><span>\u0423\u0441\u043B\u0443\u0433\u0438</span>${visitItems(services, "\u0423\u0441\u043B\u0443\u0433 \u043D\u0435\u0442", "\u0423\u0441\u043B\u0443\u0433\u0430")}</div>
                <div class="readonly-field"><span>\u0422\u043E\u0432\u0430\u0440\u044B</span>${visitItems(products, "\u0422\u043E\u0432\u0430\u0440\u043E\u0432 \u043D\u0435\u0442", "\u0422\u043E\u0432\u0430\u0440")}</div>
                <div class="readonly-field"><span>\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C</span><b>${escapeHtml(money(visit.total_cost))}</b></div>
                <div class="readonly-field"><span>\u0421\u043A\u0438\u0434\u043A\u0430</span><b>${escapeHtml(money(visit.discount_amount))}</b></div>
                <div class="readonly-field"><span>\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E</span><b>${escapeHtml(money(visit.paid_amount))}</b></div>
                ${parsed.comment ? `<div class="readonly-field modal-full"><span>\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439</span><b class="cabinet-visit-comment">${escapeHtml(parsed.comment)}</b></div>` : ""}
                ${visitCommentPhotos(visit)}
              </div>
            </div>
          </div>
        `;
  }
  function enabledBonusSections(sections) {
    if (!cabinetBonusesEnabled(sections)) {
      return [];
    }
    return sections.filter(
      (section) => String(section).startsWith("bonus_") && section !== "bonus_cashback"
    );
  }
  function cabinetBonusesEnabled(sections) {
    const configuredSections = Array.isArray(sections) ? sections : defaultCardSections;
    if (!configuredSections.includes(
      clientBonusesConfiguredSection
    )) {
      return configuredSections.some(
        (section) => String(section).startsWith("bonus_") && section !== "bonus_cashback"
      );
    }
    return configuredSections.includes(
      clientBonusesSection
    );
  }
  function sectionBody(section) {
    var _a3, _b;
    const client = (cabinetData == null ? void 0 : cabinetData.client) || currentClient;
    if (section === "client_name") return `<b>${escapeHtml(clientName(client))}</b>`;
    if (section === "client_level") {
      const level = (cabinetData == null ? void 0 : cabinetData.client_level) || (client == null ? void 0 : client.client_level) || ((_a3 = cabinetData == null ? void 0 : cabinetData.metric) == null ? void 0 : _a3.client_level) || ((_b = cabinetData == null ? void 0 : cabinetData.metric) == null ? void 0 : _b.loyalty_level) || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D";
      return `<b>${escapeHtml(level)}</b>`;
    }
    if (section === "client_visits") {
      return visitsPageHtml((cabinetData == null ? void 0 : cabinetData.visits) || []);
    }
    if (section === "client_personal_link") {
      const referralLink = (cabinetData == null ? void 0 : cabinetData.referral_link) || "";
      const invitesCount = Number((cabinetData == null ? void 0 : cabinetData.referral_invites_count) || 0);
      return `
            ${referralLink ? `<div class="inline-form compact"><label><span>\u0420\u0435\u0444\u0435\u0440\u0430\u043B\u044C\u043D\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430</span><input value="${escapeHtml(referralLink)}" readonly></label><button type="button" class="ghost" data-cabinet-copy-referral aria-label="\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0440\u0435\u0444\u0435\u0440\u0430\u043B\u044C\u043D\u0443\u044E \u0441\u0441\u044B\u043B\u043A\u0443" title="\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C"><img src="/fronted/icons/copy.svg" alt="\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C"></button></div>` : `<p class="cabinet-history-empty">\u0420\u0435\u0444\u0435\u0440\u0430\u043B\u044C\u043D\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430 \u043F\u043E\u043A\u0430 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0430.</p>`}
            <p>\u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0451\u043D\u043D\u044B\u0445: <b>${escapeHtml(Number.isFinite(invitesCount) ? invitesCount : 0)}</b></p>
          `;
    }
    if (section === clientBonusesSection) {
      const bonusSections = enabledBonusSections(currentCardSections);
      if (!bonusSections.length) {
        return `<p class="cabinet-history-empty">\u0411\u043E\u043D\u0443\u0441\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.</p>`;
      }
      return `
            <div class="cabinet-bonus-list">
              ${bonusSections.map((bonusSection) => {
        const balance = bonusBalanceForSection(bonusSection);
        return `
                  <div class="cabinet-bonus-row">
                    <span>${escapeHtml(bonusName(bonusSection))}</span>
                    <b>${escapeHtml(money((balance == null ? void 0 : balance.balance) || 0))}</b>
                  </div>
                `;
      }).join("")}
            </div>
          `;
    }
    if (section === "client_chat") return `<p class="cabinet-history-empty">\u0427\u0430\u0442 \u043F\u043E\u043A\u0430 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D.</p>`;
    return "";
  }
  function cabinetAccessEnabled(sections, section) {
    const configuredSections = Array.isArray(sections) ? sections : defaultCardSections;
    if (!configuredSections.includes(clientAccessConfiguredSection)) return true;
    return configuredSections.includes(section);
  }
  function cabinetAccessSections(sections) {
    var _a3;
    const configuredSections = Array.isArray(sections) ? sections : defaultCardSections;
    if (configuredSections.includes(clientAccessConfiguredSection)) return configuredSections;
    const organizationId = (cabinetData == null ? void 0 : cabinetData.organization_id) || ((_a3 = cabinetData == null ? void 0 : cabinetData.client) == null ? void 0 : _a3.organization_id) || (currentClient == null ? void 0 : currentClient.organization_id);
    try {
      const saved = JSON.parse(localStorage.getItem(`loyalty.clientCardSections.${organizationId || "default"}`) || "null");
      if (Array.isArray(saved) && saved.includes(clientAccessConfiguredSection)) return saved;
    } catch (e) {
    }
    return configuredSections;
  }
  function applyCabinetBottomNavOrder(sections) {
    const bottomNav2 = document.querySelector(
      ".cabinet-bottom-nav"
    );
    if (!bottomNav2) return;
    const configuredSections = cabinetAccessSections(sections);
    const order = new Map(
      configuredSections.map(
        (section, index) => [section, index]
      )
    );
    const items = [
      ...bottomNav2.querySelectorAll(
        "[data-cabinet-bottom-section]"
      )
    ];
    items.sort((a, b) => {
      var _a3, _b;
      const aSection = a.dataset.cabinetBottomSection;
      const bSection = b.dataset.cabinetBottomSection;
      const aDefault = clientBottomMenuSections.indexOf(
        aSection
      );
      const bDefault = clientBottomMenuSections.indexOf(
        bSection
      );
      return ((_a3 = order.get(aSection)) != null ? _a3 : 1e3 + aDefault) - ((_b = order.get(bSection)) != null ? _b : 1e3 + bDefault);
    }).forEach((item) => {
      bottomNav2.append(item);
    });
    const bonusNav = document.querySelector(
      ".cabinet-bonus-nav"
    );
    if (bonusNav) {
      bonusNav.hidden = !cabinetBonusesEnabled(
        configuredSections
      );
    }
  }
  function applyCabinetAccess(sections) {
    const configuredSections = cabinetAccessSections(sections);
    applyCabinetBottomNavOrder(
      configuredSections
    );
    const controls = {
      client_online_booking: '[data-cabinet-tab="client_booking"]',
      client_achievements: '[data-cabinet-tab="achievements"]',
      client_notifications: "[data-cabinet-notifications-open]",
      client_logout: "[data-cabinet-logout]"
    };
    Object.entries(controls).forEach(([section, selector]) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.hidden = !cabinetAccessEnabled(configuredSections, section);
      });
    });
    document.querySelectorAll('[data-cabinet-tab="chat"]').forEach((element) => {
      element.hidden = !configuredSections.includes("client_chat");
    });
    const bottomNav2 = document.querySelector(".cabinet-bottom-nav");
    if (bottomNav2) bottomNav2.style.setProperty("--cabinet-bottom-nav-items", String(bottomNav2.querySelectorAll(".cabinet-bottom-nav-item:not([hidden])").length));
  }
  function renderHistorySections(sections) {
    const configuredSections = Array.isArray(sections) ? sections : defaultCardSections;
    const accessSections = cabinetAccessSections(configuredSections);
    if (accessSections.includes(clientAccessConfiguredSection) || clientAccessSections.some((section) => accessSections.includes(section))) currentAccessSections = accessSections;
    applyCabinetAccess(currentAccessSections);
    const visitsEnabled = configuredSections.includes("client_visits");
    if (myBookingsSection) myBookingsSection.hidden = !visitsEnabled;
    const enabled = configuredSections.filter((section) => section !== "client_chat").filter((section) => section !== "client_fields_configured").filter((section) => section !== clientAccessConfiguredSection).filter((section) => section !== clientBonusesConfiguredSection).filter((section) => !clientAccessSections.includes(section)).filter((section) => !String(section).startsWith(clientFieldSectionPrefix)).filter(
      (section) => section === clientBonusesSection ? cabinetBonusesEnabled(configuredSections) : !String(section).startsWith("bonus_")
    );
    currentCardSections = configuredSections;
    if (historySection) historySection.hidden = enabled.length === 0;
    if (!enabled.length) {
      historyList.innerHTML = "";
      return;
    }
    historyList.innerHTML = enabled.map((section) => section === "client_name" ? `
          <div data-cabinet-profile-main-block></div>
        ` : section === "client_visits" ? `
          <article class="cabinet-history-card cabinet-history-card--visits ${visitsExpanded ? "is-expanded" : ""}">
            <button type="button" class="cabinet-history-trigger" data-cabinet-visits-toggle aria-expanded="${visitsExpanded}">
              <span>${escapeHtml(sectionTitle(section))}</span><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M19.9201 8.94995L13.4001 15.47C12.6301 16.24 11.3701 16.24 10.6001 15.47L4.08008 8.94995" stroke="#292D32" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="cabinet-history-accordion"><div class="cabinet-history-accordion-content"><div class="cabinet-history-body">${sectionBody(section)}</div></div></div>
          </article>
        ` : `
          <article class="cabinet-history-card">
            <span>${escapeHtml(sectionTitle(section))}</span>
            <div class="cabinet-history-body">${sectionBody(section)}</div>
          </article>
        `).join("");
    const profileMainBlockSlot = historyList.querySelector(
      "[data-cabinet-profile-main-block]"
    );
    if (profileMainBlockSlot) {
      if (profileHeading && !profileMainBlock.contains(profileHeading)) {
        profileMainBlock.append(profileHeading, form);
      }
      profileMainBlockSlot.replaceWith(profileMainBlock);
    }
    historyList.insertAdjacentHTML("beforeend", visitModal());
  }
  function achievementPhotoUrl(item) {
    if (!(item == null ? void 0 : item.id) || !item.photo_file_id) return "";
    const version = encodeURIComponent(item.updated_at || item.photo_file_id);
    return `/organizations/achievements/${item.id}/photo?v=${version}`;
  }
  function selectedBookingServiceIds() {
    return [...clientBookingForm.querySelectorAll('[name="service_ids"]:checked')].map((input) => Number(input.value));
  }
  function bookingScheduleLabel(schedule) {
    if (!schedule || typeof schedule !== "object") return "\u0413\u0440\u0430\u0444\u0438\u043A \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D";
    if (schedule.from || schedule.to) return `${schedule.from || "09:00"}\u2013${schedule.to || "18:00"}`;
    const days = { monday: "\u041F\u043D", tuesday: "\u0412\u0442", wednesday: "\u0421\u0440", thursday: "\u0427\u0442", friday: "\u041F\u0442", saturday: "\u0421\u0431", sunday: "\u0412\u0441" };
    const entries = Object.entries(schedule).filter(([day, value]) => days[day] && value && typeof value === "object").map(([day, value]) => `${days[day]} ${value.closed ? "\u0432\u044B\u0445\u043E\u0434\u043D\u043E\u0439" : `${value.from || "09:00"}\u2013${value.to || "18:00"}`}`);
    return entries.length ? entries.join(" \xB7 ") : "\u0413\u0440\u0430\u0444\u0438\u043A \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D";
  }
  function renderClientBookingLogo(branch = null) {
    var _a3;
    const logo = clientBookingForm.querySelector("[data-client-booking-logo]");
    if (!logo) return;
    const organizationId = Number(
      (clientBookingOptions == null ? void 0 : clientBookingOptions.organization_id) || publicBookingOrganizationId || (cabinetData == null ? void 0 : cabinetData.organization_id) || ((_a3 = cabinetData == null ? void 0 : cabinetData.client) == null ? void 0 : _a3.organization_id) || (currentClient == null ? void 0 : currentClient.organization_id) || 0
    );
    const photoUrl = (branch == null ? void 0 : branch.id) ? `/organizations/branches/${encodeURIComponent(branch.id)}/photo-file?v=${encodeURIComponent(branch.photo_file_id || "7-photo")}` : organizationId ? `/organizations/${encodeURIComponent(organizationId)}/photo-file?v=${encodeURIComponent((cabinetOrganizationBranding == null ? void 0 : cabinetOrganizationBranding.updated_at) || (cabinetOrganizationBranding == null ? void 0 : cabinetOrganizationBranding.photo_file_id) || "7-photo")}` : "";
    logo.innerHTML = `<span>L</span>${photoUrl ? `<img class="cabinet-booking-service-photo" src="${escapeHtml(photoUrl)}" alt="" loading="lazy" decoding="async" onload="this.previousElementSibling.hidden=true" onerror="this.remove()" />` : ""}`;
  }
  async function renderClientBookingBranchMeta() {
    var _a3, _b;
    const meta = clientBookingForm.querySelector("[data-client-booking-branch-meta]");
    const branchId = Number(clientBookingForm.elements.branch_id.value || 0);
    const branch = (_a3 = clientBookingOptions == null ? void 0 : clientBookingOptions.branches) == null ? void 0 : _a3.find((item) => Number(item.id) === branchId);
    const requestId = ++branchReviewsRequestId;
    renderClientBookingLogo(branch);
    if (!branch) {
      meta.hidden = true;
      meta.innerHTML = "";
      return;
    }
    meta.hidden = false;
    meta.innerHTML = `<span><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 13.4299C13.7231 13.4299 15.12 12.0331 15.12 10.3099C15.12 8.58681 13.7231 7.18994 12 7.18994C10.2769 7.18994 8.88 8.58681 8.88 10.3099C8.88 12.0331 10.2769 13.4299 12 13.4299Z" stroke="#292D32" stroke-width="1.5"/><path d="M3.62001 8.49C5.59001 -0.169998 18.42 -0.159997 20.38 8.5C21.53 13.58 18.37 17.88 15.6 20.54C13.59 22.48 10.41 22.48 8.39001 20.54C5.63001 17.88 2.47001 13.57 3.62001 8.49Z" stroke="#292D32" stroke-width="1.5"/></svg>${escapeHtml(branch.address || "\u0410\u0434\u0440\u0435\u0441 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D")}</span><span><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.71 15.18L12.61 13.33C12.07 13.01 11.63 12.24 11.63 11.61V7.51001" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>${escapeHtml(bookingScheduleLabel(branch.work_schedule))}</span><button type="button" class="cabinet-branch-reviews-trigger" data-cabinet-branch-reviews-open><span class="cabinet-branch-reviews-summary"><svg width="18" height="18" viewBox="0 0 24 24" fill="#F5B301" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M13.73 3.51001L15.49 7.03001C15.73 7.52002 16.37 7.99001 16.91 8.08001L20.1 8.61001C22.14 8.95001 22.62 10.43 21.15 11.89L18.67 14.37C18.25 14.79 18.02 15.6 18.15 16.18L18.86 19.25C19.42 21.68 18.13 22.62 15.98 21.35L12.99 19.58C12.45 19.26 11.56 19.26 11.01 19.58L8.01997 21.35C5.87997 22.62 4.57997 21.67 5.13997 19.25L5.84997 16.18C5.97997 15.6 5.74997 14.79 5.32997 14.37L2.84997 11.89C1.38997 10.43 1.85997 8.95001 3.89997 8.61001L7.08997 8.08001C7.61997 7.99001 8.25997 7.52002 8.49997 7.03001L10.26 3.51001C11.22 1.60001 12.78 1.60001 13.73 3.51001Z" stroke="#F5B301" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span data-cabinet-branch-reviews-count>\u2026 \u043E\u0442\u0437\u044B\u0432\u043E\u0432</span></span></button>`;
    const organizationId = (clientBookingOptions == null ? void 0 : clientBookingOptions.organization_id) || publicBookingOrganizationId || (cabinetData == null ? void 0 : cabinetData.organization_id) || ((_b = cabinetData == null ? void 0 : cabinetData.client) == null ? void 0 : _b.organization_id) || (currentClient == null ? void 0 : currentClient.organization_id);
    if (!organizationId) return;
    try {
      const rating = await requestJson(`/crm-api/client-reviews/ratings/branch/${encodeURIComponent(branchId)}?organization_id=${encodeURIComponent(organizationId)}`, { cache: "no-store" });
      if (requestId !== branchReviewsRequestId) return;
      meta.querySelector("[data-cabinet-branch-reviews-count]").textContent = reviewsCountLabel((rating == null ? void 0 : rating.reviews_count) || 0);
    } catch (e) {
      if (requestId !== branchReviewsRequestId) return;
      meta.querySelector("[data-cabinet-branch-reviews-count]").textContent = reviewsCountLabel(0);
    }
  }
  function bookingDurationLabel(seconds) {
    const minutes = Math.round(Number(seconds || 0) / 60);
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return [hours ? `${hours} \u0447` : "", rest ? `${rest} \u043C\u0438\u043D` : ""].filter(Boolean).join(" ");
  }
  function bookingServicePriceLabel(item) {
    var _a3, _b;
    const minimum = (_a3 = item.price_min) != null ? _a3 : item.price;
    const maximum = (_b = item.price_max) != null ? _b : item.price;
    if (minimum === null || minimum === void 0) return "";
    if (maximum !== null && maximum !== void 0 && Number(maximum) !== Number(minimum)) {
      return `${money(minimum)} \u2013 ${money(maximum)} \u20BD`;
    }
    return `${money(minimum)} \u20BD`;
  }
  function bookingDateIso(value) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  function isSelectedMasterBookingDateBlocked(iso) {
    const masterId = clientBookingForm.elements.master_id.value;
    const master = ((clientBookingOptions == null ? void 0 : clientBookingOptions.masters) || []).find((item) => String(item.id) === String(masterId));
    return ((master == null ? void 0 : master.booking_blocks) || []).some(
      (block) => !block.time_from && !block.time_to && String(block.date_from || "") <= iso && iso <= String(block.date_to || block.date_from || "")
    );
  }
  function showSelectedMasterDateUnavailable() {
    clientBookingForm.querySelector("[data-client-booking-submit]").disabled = true;
    clientBookingSlots.disabled = false;
    clientBookingSlots.innerHTML = '<legend>\u0421\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F</legend><div class="cabinet-booking-no-slots"><b>\u041D\u0430 \u0434\u0430\u043D\u043D\u043E\u0435 \u0447\u0438\u0441\u043B\u043E \u0437\u0430\u043F\u0438\u0441\u0438 \u043A \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u043C\u0443 \u043C\u0430\u0441\u0442\u0435\u0440\u0443 \u043D\u0435\u0442</b><small>\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0440\u0443\u0433\u0443\u044E \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0443\u044E \u0434\u0430\u0442\u0443.</small></div>';
  }
  function renderClientBookingCalendar() {
    const input = clientBookingForm.elements.booking_date;
    const minDate = input.min ? /* @__PURE__ */ new Date(`${input.min}T00:00:00`) : /* @__PURE__ */ new Date();
    const maxDate = input.max ? /* @__PURE__ */ new Date(`${input.max}T00:00:00`) : new Date(Date.now() + 30 * 864e5);
    const selectedDate = input.value ? /* @__PURE__ */ new Date(`${input.value}T00:00:00`) : null;
    const monthStart = new Date(clientBookingCalendarMonth.getFullYear(), clientBookingCalendarMonth.getMonth(), 1);
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - (monthStart.getDay() + 6) % 7);
    clientBookingForm.querySelector("[data-booking-calendar-title]").textContent = monthStart.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
    clientBookingForm.querySelector("[data-booking-calendar-days]").innerHTML = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const iso = bookingDateIso(date);
      const outside = date.getMonth() !== monthStart.getMonth();
      const disabled = date < minDate || date > maxDate;
      const masterBlocked = isSelectedMasterBookingDateBlocked(iso);
      const selected = !masterBlocked && selectedDate && iso === bookingDateIso(selectedDate);
      const today = iso === bookingDateIso(/* @__PURE__ */ new Date());
      return `<button type="button" data-booking-date="${iso}" ${disabled ? "disabled" : ""} ${masterBlocked ? 'data-booking-date-blocked="true" aria-disabled="true" title="\u041D\u0430 \u0434\u0430\u043D\u043D\u043E\u0435 \u0447\u0438\u0441\u043B\u043E \u0437\u0430\u043F\u0438\u0441\u0438 \u043A \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u043C\u0443 \u043C\u0430\u0441\u0442\u0435\u0440\u0443 \u043D\u0435\u0442"' : ""} class="${outside ? "outside" : ""}${selected ? " selected" : ""}${today ? " today" : ""}${masterBlocked ? " master-blocked" : ""}">${date.getDate()}</button>`;
    }).join("");
    const previousMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
    const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    clientBookingForm.querySelector("[data-booking-calendar-prev]").disabled = previousMonth < new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    clientBookingForm.querySelector("[data-booking-calendar-next]").disabled = nextMonth > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  }
  function setClientBookingStep(step, forceOpen) {
    var _a3;
    const selectedPanel = clientBookingForm.querySelector(`[data-booking-step-panel="${step}"]`);
    const selectedTrigger = clientBookingForm.querySelector(`[data-booking-step-toggle="${step}"]`);
    if (!selectedPanel || (selectedTrigger == null ? void 0 : selectedTrigger.disabled)) return;
    const shouldOpen = forceOpen != null ? forceOpen : selectedPanel.hidden;
    clientBookingForm.querySelectorAll("[data-booking-step-panel]").forEach((panel) => {
      panel.hidden = panel !== selectedPanel || !shouldOpen;
    });
    clientBookingForm.querySelectorAll("[data-booking-step-toggle]").forEach((trigger) => {
      trigger.setAttribute("aria-expanded", String(trigger === selectedTrigger && shouldOpen));
    });
    if (shouldOpen && step === "services") {
      (_a3 = clientBookingForm.querySelector("[data-client-booking-service-search]")) == null ? void 0 : _a3.focus();
    }
  }
  function updateClientBookingSummaries() {
    var _a3, _b;
    const serviceIds = new Set(selectedBookingServiceIds());
    const selectedServices = ((clientBookingOptions == null ? void 0 : clientBookingOptions.services) || []).filter((item) => serviceIds.has(Number(item.id)));
    const serviceSummary = clientBookingForm.querySelector("[data-booking-service-summary]");
    serviceSummary.textContent = selectedServices.length ? selectedServices.length === 1 ? selectedServices[0].title : `\u0412\u044B\u0431\u0440\u0430\u043D\u043E \u0443\u0441\u043B\u0443\u0433: ${selectedServices.length}` : "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0443\u0441\u043B\u0443\u0433\u0438";
    const masterInput = clientBookingForm.elements.master_id;
    const selectedMaster = ((clientBookingOptions == null ? void 0 : clientBookingOptions.masters) || []).find((item) => String(item.id) === masterInput.value);
    clientBookingForm.querySelector("[data-booking-master-summary]").textContent = (selectedMaster == null ? void 0 : selectedMaster.name) || "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0430";
    const dateValue = clientBookingForm.elements.booking_date.value;
    const selectedSlot = clientBookingForm.querySelector('[name="starts_at"]:checked');
    const selectedTime = ((_b = (_a3 = selectedSlot == null ? void 0 : selectedSlot.nextElementSibling) == null ? void 0 : _a3.textContent) == null ? void 0 : _b.trim()) || "";
    const dateLabel = dateValue ? (/* @__PURE__ */ new Date(`${dateValue}T00:00:00`)).toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) : "";
    clientBookingForm.querySelector("[data-booking-date-summary]").textContent = dateLabel ? `${dateLabel}${selectedTime ? `, ${selectedTime}` : ""}` : "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0434\u0430\u0442\u0443 \u0438 \u0432\u0440\u0435\u043C\u044F";
  }
  function renderClientBookingList() {
    const now = Date.now();
    const visits = [...(cabinetData == null ? void 0 : cabinetData.visits) || []].sort((left, right) => {
      const leftVisit = left.visit || left;
      const rightVisit = right.visit || right;
      const leftTime = new Date(leftVisit.visit_at).getTime();
      const rightTime = new Date(rightVisit.visit_at).getTime();
      const leftUpcoming = leftTime >= now;
      const rightUpcoming = rightTime >= now;
      if (leftUpcoming !== rightUpcoming) return leftUpcoming ? -1 : 1;
      return leftUpcoming ? leftTime - rightTime : rightTime - leftTime;
    });
    clientBookingList.innerHTML = visits.length ? `<div class="cabinet-visit-list">${visits.map(visitHistoryItems).join("")}</div>` : '<p class="cabinet-history-empty">\u0417\u0430\u043F\u0438\u0441\u0435\u0439 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.</p>';
  }
  function renderClientBookingServices() {
    var _a3;
    const branchId = Number(clientBookingForm.elements.branch_id.value || 0);
    const selectedIds = new Set(selectedBookingServiceIds());
    const compatibleServiceIds = clientBookingSelectedStart && clientBookingCompatibility ? new Set(clientBookingCompatibility.service_ids.map(Number)) : null;
    const query = String(((_a3 = clientBookingForm.querySelector("[data-client-booking-service-search]")) == null ? void 0 : _a3.value) || "").trim().toLocaleLowerCase("ru");
    const services = ((clientBookingOptions == null ? void 0 : clientBookingOptions.services) || []).filter(
      (item) => (!branchId || item.branch_ids.includes(branchId)) && (!compatibleServiceIds || compatibleServiceIds.has(Number(item.id))) && (!query || String(item.title || "").toLocaleLowerCase("ru").includes(query))
    );
    const groups = /* @__PURE__ */ new Map();
    services.forEach((item) => {
      const id = String(item.category_id || item.category_title || "services");
      if (!groups.has(id)) groups.set(id, { title: item.category_title || "\u0423\u0441\u043B\u0443\u0433\u0438", items: [] });
      groups.get(id).items.push(item);
    });
    clientBookingServices.disabled = false;
    clientBookingServices.innerHTML = `<legend>\u0423\u0441\u043B\u0443\u0433\u0438</legend>${services.length ? [...groups.entries()].map(([categoryId, group]) => `
          <section class="cabinet-booking-service-group ${openServiceCategoryId === categoryId ? "is-expanded" : ""}" data-booking-service-category="${escapeHtml(categoryId)}">
            <button type="button" class="cabinet-booking-category-trigger" data-booking-service-category-toggle="${escapeHtml(categoryId)}" aria-expanded="${openServiceCategoryId === categoryId}"><span>${escapeHtml(group.title)}</span><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M19.9201 8.94995L13.4001 15.47C12.6301 16.24 11.3701 16.24 10.6001 15.47L4.08008 8.94995" stroke="#292D32" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <div class="cabinet-booking-category-panel"><div class="cabinet-booking-category-content">${group.items.map((item) => {
      const duration = bookingDurationLabel(item.duration);
      const price = bookingServicePriceLabel(item);
      const imageUrls = [...new Set((Array.isArray(item.image_urls) ? item.image_urls : [item.image_url]).filter(Boolean))];
      const photo = imageUrls.length ? `<div class="cabinet-booking-service-gallery" data-booking-service-gallery>
                <button type="button" class="cabinet-booking-service-gallery-main" data-service-gallery-open data-service-gallery-images="${escapeHtml(JSON.stringify(imageUrls))}" data-service-gallery-title="${escapeHtml(item.title || "")}"><img src="${escapeHtml(imageUrls[0])}" alt="${escapeHtml(item.title || "")}" loading="lazy" decoding="async" fetchpriority="low" /></button>
                ${imageUrls.length > 1 ? `<div class="cabinet-booking-service-thumbnails">${imageUrls.map((url, index) => `<button type="button" class="${index === 0 ? "active" : ""}" data-booking-service-thumbnail aria-label="\u0424\u043E\u0442\u043E ${index + 1}"><img src="${escapeHtml(url)}" alt="" loading="lazy" decoding="async" /></button>`).join("")}</div>` : ""}
              </div>` : "";
      return `<article class="cabinet-booking-service">
                ${photo}
                <label class="cabinet-booking-service-choice">
                  <span class="cabinet-booking-service-content"><span class="cabinet-booking-service-title"><b>${escapeHtml(item.title)}</b><span class="cabinet-booking-service-checkbox"><input type="checkbox" name="service_ids" value="${escapeHtml(item.id)}" ${selectedIds.has(Number(item.id)) ? "checked" : ""} /><span class="cabinet-booking-service-checkbox-frame" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 12.5 10 19.5 21 5" /></svg></span></span></span>${duration ? `<small>${escapeHtml(duration)}</small>` : ""}${item.description ? `<span class="cabinet-booking-service-description">${escapeHtml(item.description)}</span>` : ""}${price ? `<strong>${escapeHtml(price)}</strong>` : ""}</span>
                </label>
              </article>`;
    }).join("")}</div></div>
          </section>
        `).join("") : '<p class="cabinet-history-empty">\u041F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0438\u0445 \u0443\u0441\u043B\u0443\u0433 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E.</p>'}`;
    updateClientBookingSummaries();
  }
  function renderClientBookingMasters() {
    const branchId = Number(clientBookingForm.elements.branch_id.value || 0);
    const serviceIds = selectedBookingServiceIds();
    const compatibleMasterIds = clientBookingSelectedStart && clientBookingCompatibility ? new Set(clientBookingCompatibility.master_ids.map(Number)) : null;
    const availableMasters = ((clientBookingOptions == null ? void 0 : clientBookingOptions.masters) || []).filter(
      (item) => (!branchId || item.branch_ids.includes(branchId)) && (!serviceIds.length || serviceIds.every((id) => item.service_ids.includes(id))) && (!compatibleMasterIds || compatibleMasterIds.has(Number(item.id)))
    );
    const masterInput = clientBookingForm.elements.master_id;
    if (!availableMasters.some((item) => String(item.id) === masterInput.value)) masterInput.value = "";
    masterInput.disabled = false;
    clientBookingForm.querySelector('[data-booking-step-toggle="master"]').disabled = false;
    clientBookingForm.querySelector('[data-booking-step-toggle="datetime"]').disabled = false;
    clientBookingForm.elements.booking_date.disabled = false;
    const availableIds = new Set(availableMasters.map((item) => Number(item.id)));
    const mastersLoading = clientBookingMasterPreviews === null;
    const masters = mastersLoading ? [] : clientBookingMasterPreviews.filter((item) => availableIds.has(Number(item.id)));
    const container = clientBookingForm.querySelector("[data-client-booking-masters]");
    container.innerHTML = mastersLoading ? '<p class="cabinet-history-empty">\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u043E\u0432\u2026</p>' : masters.length ? masters.map((item) => {
      var _a3;
      const initials = String(item.name || "?").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
      const slots = item.nearest_slots;
      const nearestDate = ((_a3 = slots == null ? void 0 : slots[0]) == null ? void 0 : _a3.date) ? (/* @__PURE__ */ new Date(`${slots[0].date}T00:00:00`)).toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long" }) : "";
      return `<article class="cabinet-booking-master${String(item.id) === masterInput.value ? " selected" : ""}" data-booking-master-card="${escapeHtml(item.id)}">
              <div class="cabinet-booking-master-main">
                <label for="booking-master-${escapeHtml(item.id)}">
                <span class="cabinet-booking-master-avatar">${item.photo_url ? `<img src="${escapeHtml(item.photo_url)}" alt="" loading="lazy" />` : escapeHtml(initials)}</span>
                <span class="cabinet-booking-master-details"><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.position || "\u0421\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442")}</small><span class="cabinet-booking-master-rating"><span class="cabinet-review-stars" aria-label="\u0420\u0435\u0439\u0442\u0438\u043D\u0433 ${escapeHtml(item.rating || 0)} \u0438\u0437 5">${reviewStars(item.rating || 0)}</span><small>${reviewsCountLabel(item.reviews_count || 0)}</small></span></span>
                </label>
                <div class="cabinet-booking-master-actions">
                  <button type="button" class="cabinet-booking-master-info" data-booking-master-reviews="${escapeHtml(item.id)}" data-booking-master-name="${escapeHtml(item.name)}" data-booking-master-position="${escapeHtml(item.position || "\u0421\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442")}" data-booking-master-rating="${escapeHtml(item.rating || 0)}" data-booking-master-reviews-count="${escapeHtml(item.reviews_count || 0)}" data-booking-master-photo="${escapeHtml(item.photo_url || "")}" aria-label="&#1042;&#1089;&#1077; &#1086;&#1090;&#1079;&#1099;&#1074;&#1099; &#1086; ${escapeHtml(item.name)}" title="&#1042;&#1089;&#1077; &#1086;&#1090;&#1079;&#1099;&#1074;&#1099;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8V13" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.9945 16H12.0035" stroke="#292D32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                  <input id="booking-master-${escapeHtml(item.id)}" type="radio" name="master_choice" value="${escapeHtml(item.id)}" ${String(item.id) === masterInput.value ? "checked" : ""} />
                </div>
              </div>
              <div class="cabinet-booking-master-nearest">
                ${slots === null ? "<small>\u0418\u0449\u0435\u043C \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0435\u0435 \u0432\u0440\u0435\u043C\u044F\u2026</small>" : slots.length ? `<small>\u0411\u043B\u0438\u0436\u0430\u0439\u0448\u0435\u0435 \u0432\u0440\u0435\u043C\u044F \u0434\u043B\u044F \u0437\u0430\u043F\u0438\u0441\u0438, ${escapeHtml(nearestDate)}${slots[0].branch_name ? ` \xB7 ${escapeHtml(slots[0].branch_name)}` : ""}:</small><span><button type="button" data-booking-nearest-slot data-master-id="${escapeHtml(item.id)}" data-branch-id="${escapeHtml(slots[0].branch_id || "")}" data-start="${escapeHtml(slots[0].start)}">${escapeHtml(slots[0].time)}</button></span>` : "<small>\u041D\u0430 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0438\u0435 \u0434\u043D\u0438 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0433\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043D\u0435\u0442.</small>"}
              </div>
            </article>`;
    }).join("") : '<p class="cabinet-history-empty">\u041F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0438\u0445 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u043E\u0432 \u0441\u043E \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u044B\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0435\u043C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E.</p>';
    updateClientBookingSummaries();
  }
  async function loadClientBookingMasters() {
    const branchId = Number(clientBookingForm.elements.branch_id.value || 0);
    const loadingKey = `${branchId}:${selectedBookingServiceIds().join(",")}`;
    if (clientBookingMastersLoadingKey === loadingKey) return;
    clientBookingMastersLoadingKey = loadingKey;
    const requestId = ++clientBookingMastersRequestId;
    clientBookingMasterPreviews = null;
    renderClientBookingMasters();
    const params = new URLSearchParams({
      service_ids: selectedBookingServiceIds().join(","),
      days: "14"
    });
    if (branchId) params.set("branch_id", String(branchId));
    try {
      if (publicBookingOrganizationId) params.set("organization_id", String(publicBookingOrganizationId));
      const mastersPath = publicBookingOrganizationId ? "public-booking/masters" : "client-booking/masters";
      const result = await requestJson(`/booking-api/${mastersPath}?${params}`, { cache: "no-store" });
      const masters = result.masters || [];
      if (requestId !== clientBookingMastersRequestId) return;
      clientBookingMastersLoadingKey = "";
      clientBookingMasterPreviews = masters;
      if (clientBookingOptions) {
        clientBookingOptions.masters = masters.map((master) => ({
          ...master,
          branch_ids: Array.isArray(master.branch_ids) ? master.branch_ids : []
        }));
      }
      renderClientBookingMasters();
    } catch (error) {
      if (requestId !== clientBookingMastersRequestId) return;
      clientBookingMastersLoadingKey = "";
      clientBookingMasterPreviews = [];
      clientBookingForm.querySelector("[data-client-booking-masters]").innerHTML = `<p class="cabinet-message error">${escapeHtml(error.message || "?? ??????? ????????? ????????????.")}</p>`;
    }
  }
  async function loadClientBookingSlots() {
    const branchId = Number(clientBookingForm.elements.branch_id.value || 0);
    const serviceIds = selectedBookingServiceIds();
    const masterId = Number(clientBookingForm.elements.master_id.value || 0);
    const bookingDate = clientBookingForm.elements.booking_date.value;
    clientBookingForm.querySelector("[data-client-booking-submit]").disabled = true;
    if (masterId && bookingDate && isSelectedMasterBookingDateBlocked(bookingDate)) {
      clientBookingForm.elements.booking_date.value = "";
      renderClientBookingCalendar();
      updateClientBookingSummaries();
      showSelectedMasterDateUnavailable();
      return;
    }
    if (!bookingDate) {
      clientBookingSlots.disabled = true;
      clientBookingSlots.innerHTML = '<legend>\u0421\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F</legend><p class="cabinet-history-empty">\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0430\u0442\u0443.</p>';
      return;
    }
    const requestId = ++clientBookingCompatibilityRequestId;
    clientBookingSlots.disabled = false;
    clientBookingSlots.innerHTML = '<legend>\u0421\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F</legend><p class="cabinet-history-empty">\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F\u2026</p>';
    const params = new URLSearchParams({
      service_ids: serviceIds.join(","),
      booking_date: bookingDate
    });
    if (branchId) params.set("branch_id", String(branchId));
    if (masterId) params.set("master_id", String(masterId));
    if (clientBookingSelectedStart) params.set("starts_at", clientBookingSelectedStart);
    try {
      if (publicBookingOrganizationId) params.set("organization_id", String(publicBookingOrganizationId));
      const compatibilityPath = publicBookingOrganizationId ? "public-booking/compatibility" : "client-booking/compatibility";
      const result = await requestJson(`/booking-api/${compatibilityPath}?${params}`);
      if (requestId !== clientBookingCompatibilityRequestId) return;
      clientBookingCompatibility = result;
      renderClientBookingServices();
      renderClientBookingMasters();
      const slotGroups = [
        ["\u0423\u0442\u0440\u043E", result.slots.filter((slot) => Number(slot.time.slice(0, 2)) < 12)],
        ["\u0414\u0435\u043D\u044C", result.slots.filter((slot) => {
          const hour = Number(slot.time.slice(0, 2));
          return hour >= 12 && hour < 18;
        })],
        ["\u0412\u0435\u0447\u0435\u0440", result.slots.filter((slot) => Number(slot.time.slice(0, 2)) >= 18)]
      ].filter(([, slots]) => slots.length);
      clientBookingSlots.innerHTML = `<legend>\u0421\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F</legend>${slotGroups.length ? slotGroups.map(([title, slots]) => `
            <section class="cabinet-booking-slot-group">
              <h3>${title}</h3>
              <div class="cabinet-booking-slot-grid">${slots.map((slot) => `
                <label class="cabinet-booking-slot"><input type="radio" name="starts_at" value="${escapeHtml(slot.start)}" data-branch-id="${escapeHtml(slot.branch_id || "")}" ${slot.start === clientBookingSelectedStart ? "checked" : ""} /><span><b>${escapeHtml(slot.time)}</b>${!branchId && slot.branch_name ? `<small>${escapeHtml(slot.branch_name)}</small>` : ""}</span></label>
              `).join("")}</div>
            </section>
          `).join("") : `<div class="cabinet-booking-no-slots">
            <span aria-hidden="true">\u25A1</span>
            <b>\u0412 \u044D\u0442\u043E\u0442 \u0434\u0435\u043D\u044C \u043D\u0435\u0442 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0433\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438</b>
            <small>\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0440\u0443\u0433\u0443\u044E \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0443\u044E \u0434\u0430\u0442\u0443.</small>
          </div>`}`;
    } catch (error) {
      if (requestId !== clientBookingCompatibilityRequestId) return;
      clientBookingSlots.innerHTML = `<legend>\u0421\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F</legend><p class="cabinet-message error">${escapeHtml(error.message)}</p>`;
    }
  }
  async function loadClientBookingOptions() {
    renderClientBookingList();
    if (clientBookingOptions) return;
    clientBookingOptions = null;
    clientBookingMessage.className = "cabinet-message";
    clientBookingMessage.textContent = "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u0437\u0430\u043F\u0438\u0441\u0438\u2026";
    try {
      const optionsPath = publicBookingOrganizationId ? `/booking-api/public-booking/options?organization_id=${encodeURIComponent(publicBookingOrganizationId)}` : "/booking-api/client-booking/options";
      clientBookingOptions = await requestJson(optionsPath, { cache: "no-store" });
      const branchSelect = clientBookingForm.elements.branch_id;
      branchSelect.innerHTML = `<option value="">\u0412\u0441\u0435 \u0444\u0438\u043B\u0438\u0430\u043B\u044B</option>${clientBookingOptions.branches.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("")}`;
      renderClientBookingBranchMeta();
      clientBookingForm.querySelectorAll("[data-booking-step-toggle]").forEach((trigger) => {
        trigger.disabled = false;
      });
      const today = /* @__PURE__ */ new Date();
      const maxDate = /* @__PURE__ */ new Date();
      maxDate.setDate(maxDate.getDate() + 30);
      clientBookingForm.elements.booking_date.min = today.toISOString().slice(0, 10);
      clientBookingForm.elements.booking_date.max = maxDate.toISOString().slice(0, 10);
      clientBookingForm.elements.booking_date.value = today.toISOString().slice(0, 10);
      clientBookingCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      renderClientBookingServices();
      renderClientBookingMasters();
      renderClientBookingCalendar();
      clientBookingMessage.textContent = "";
    } catch (error) {
      clientBookingMessage.textContent = error.message || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043E\u043D\u043B\u0430\u0439\u043D-\u0437\u0430\u043F\u0438\u0441\u044C.";
      clientBookingMessage.className = "cabinet-message error";
    }
  }
  function renderAchievements() {
    const all = (cabinetData == null ? void 0 : cabinetData.organization_achievements) || [];
    const received = (cabinetData == null ? void 0 : cabinetData.achievements) || [];
    const receivedIds = new Set(received.map((item) => String(item.achievement_id)));
    const cards = (items) => items.length ? items.map((item) => `
          <article class="cabinet-achievement-card ${receivedIds.has(String(item.id)) ? "is-earned" : ""}">
            <button type="button" class="cabinet-achievement-button" data-cabinet-achievement="${item.id}">
              <b>${escapeHtml(item.name)}</b>
            </button>
          </article>
        `).join("") : '<p class="cabinet-history-empty">\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u0439.</p>';
    const completed = all.filter((item) => receivedIds.has(String(item.id)));
    achievementsList.innerHTML = `
          <section class="cabinet-achievement-column">
            <h2>\u0412\u0441\u0435</h2>
            <div class="cabinet-achievement-column-list">${cards(all)}</div>
          </section>
          <section class="cabinet-achievement-column">
            <h2>\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043D\u044B\u0435</h2>
            <div class="cabinet-achievement-column-list">${cards(completed)}</div>
          </section>
        `;
  }
  function openAchievementModal(item) {
    const photoUrl = achievementPhotoUrl(item);
    achievementContent.innerHTML = `
          ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(item.name)}" class="cabinet-achievement-modal-photo">` : ""}
          <h4 class="cabinet-achievement-modal-title">${escapeHtml(item.name)}</h4>
        `;
    achievementModal.hidden = false;
  }
  function reviewDateLabel(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  }
  function renderVisitReviewStars() {
    const container = document.querySelector("[data-visit-review-stars]");
    if (!container) return;
    container.innerHTML = Array.from({ length: 5 }, (_, index) => `<button type="button" data-visit-review-rating="${index + 1}" aria-label="\u041E\u0446\u0435\u043D\u043A\u0430 ${index + 1}">${reviewStar(index < visitReviewRating)}</button>`).join("");
    document.querySelector("[data-visit-review-submit]").disabled = !visitReviewRating;
  }
  function openVisitReview(visitId, branchId, employeeId, employeeName) {
    const reviewForm = document.querySelector("[data-visit-review-form]");
    visitReviewRating = 0;
    reviewForm.reset();
    reviewForm.elements.branch_id.value = branchId;
    reviewForm.elements.employee_id.value = employeeId;
    reviewForm.elements.visit_id.value = visitId;
    reviewForm.querySelector("[data-visit-review-master]").textContent = `\u0412\u0430\u0448 \u043E\u0442\u0437\u044B\u0432 \u0431\u0443\u0434\u0435\u0442 \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D \u0434\u043B\u044F \u043C\u0430\u0441\u0442\u0435\u0440\u0430 ${employeeName || ""}.`;
    reviewForm.querySelector("[data-visit-review-message]").textContent = "";
    renderVisitReviewStars();
    setCabinetTab("create_review");
  }
  async function openEmployeeReviews(employeeId, employeeName, details = {}) {
    const profile = document.querySelector("[data-employee-reviews-profile]");
    const list = document.querySelector("[data-employee-reviews-list]");
    const initials = String(employeeName || "?").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    profile.innerHTML = `${details.photoUrl ? `<img src="${escapeHtml(details.photoUrl)}" alt="" class="cabinet-employee-review-photo" />` : `<span class="cabinet-employee-review-photo cabinet-employee-review-initials">${escapeHtml(initials)}</span>`}<h1>${escapeHtml(employeeName || "\u0421\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A")}</h1><p>${escapeHtml(details.position || "\u0421\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442")}</p><div class="cabinet-employee-review-summary"><span class="cabinet-review-stars" data-employee-review-profile-stars>${reviewStars(details.rating || 0)}</span><small data-employee-review-profile-count>${reviewsCountLabel(details.reviewsCount || 0)}</small></div>`;
    list.innerHTML = '<p class="cabinet-history-empty">\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C \u043E\u0442\u0437\u044B\u0432\u044B\u2026</p>';
    setCabinetTab("employee_reviews");
    try {
      const reviews = await requestJson(`/crm-api/client-reviews?organization_id=${encodeURIComponent(clientBookingOptions == null ? void 0 : clientBookingOptions.organization_id)}&employee_id=${encodeURIComponent(employeeId)}&limit=200`, { cache: "no-store" });
      const reviewsCount = reviews.length;
      const rating = reviewsCount ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewsCount : 0;
      profile.querySelector("[data-employee-review-profile-stars]").innerHTML = reviewStars(rating);
      profile.querySelector("[data-employee-review-profile-count]").textContent = reviewsCountLabel(reviewsCount);
      const updateMaster = (master) => {
        if (Number(master.id) === Number(employeeId)) {
          master.rating = Number(rating.toFixed(2));
          master.reviews_count = reviewsCount;
        }
      };
      (clientBookingMasterPreviews || []).forEach(updateMaster);
      ((clientBookingOptions == null ? void 0 : clientBookingOptions.masters) || []).forEach(updateMaster);
      renderClientBookingMasters();
      list.innerHTML = reviewsCount ? reviews.map((review) => {
        const name = review.client_name || "\u041A\u043B\u0438\u0435\u043D\u0442";
        return `<article class="cabinet-employee-review"><header><div><b>${escapeHtml(name)}</b><span><span class="cabinet-review-stars">${reviewStars(review.rating)}</span><small>${escapeHtml(reviewDateLabel(review.created_at || review.date))}</small></span></div></header>${review.text ? `<p>${escapeHtml(review.text)}</p>` : ""}</article>`;
      }).join("") : '<p class="cabinet-history-empty">\u041E\u0442\u0437\u044B\u0432\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.</p>';
    } catch (e) {
      list.innerHTML = '<p class="cabinet-history-empty">\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043E\u0442\u0437\u044B\u0432\u044B.</p>';
    }
  }
  async function openBranchReviews(branch) {
    var _a3;
    const profile = document.querySelector("[data-branch-reviews-profile]");
    const list = document.querySelector("[data-branch-reviews-list]");
    const sourceLogo = clientBookingForm.querySelector("[data-client-booking-logo]");
    const sourceMeta = clientBookingForm.querySelector("[data-client-booking-branch-meta]");
    const detailsMarkup = Array.from((sourceMeta == null ? void 0 : sourceMeta.children) || []).slice(0, 2).map((item) => item.outerHTML).join("");
    profile.innerHTML = `<span class="cabinet-booking-logo cabinet-branch-reviews-logo">${(sourceLogo == null ? void 0 : sourceLogo.innerHTML) || "<span>L</span>"}</span><div class="cabinet-branch-reviews-info"><small>\u041E\u043D\u043B\u0430\u0439\u043D-\u0437\u0430\u043F\u0438\u0441\u044C</small><h1>${escapeHtml(branch.name || "\u0424\u0438\u043B\u0438\u0430\u043B")}</h1><div class="cabinet-branch-reviews-details">${detailsMarkup}</div></div>`;
    list.innerHTML = '<p class="cabinet-history-empty">\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C \u043E\u0442\u0437\u044B\u0432\u044B\u2026</p>';
    setCabinetTab("branch_reviews");
    const organizationId = (clientBookingOptions == null ? void 0 : clientBookingOptions.organization_id) || publicBookingOrganizationId || (cabinetData == null ? void 0 : cabinetData.organization_id) || ((_a3 = cabinetData == null ? void 0 : cabinetData.client) == null ? void 0 : _a3.organization_id) || (currentClient == null ? void 0 : currentClient.organization_id);
    try {
      const reviews = await requestJson(`/crm-api/client-reviews?organization_id=${encodeURIComponent(organizationId)}&branch_id=${encodeURIComponent(branch.id)}&limit=200`, { cache: "no-store" });
      list.innerHTML = reviews.length ? reviews.map((review) => `<article class="cabinet-employee-review"><header><div><b>${escapeHtml(review.client_name || "\u041A\u043B\u0438\u0435\u043D\u0442")}</b><span><span class="cabinet-review-stars">${reviewStars(review.rating)}</span><small>${escapeHtml(reviewDateLabel(review.created_at || review.date))}</small></span></div></header>${review.text ? `<p>${escapeHtml(review.text)}</p>` : ""}</article>`).join("") : '<p class="cabinet-history-empty">\u041E\u0442\u0437\u044B\u0432\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.</p>';
    } catch (e) {
      list.innerHTML = '<p class="cabinet-history-empty">\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043E\u0442\u0437\u044B\u0432\u044B.</p>';
    }
  }
  function cabinetTabFromHash() {
    if (location.hash === "#my-booking") return "client_booking";
    if (location.hash === "#achievements") return "achievements";
    if (location.hash === "#chat") return "chat";
    return "profile";
  }
  function cabinetSectionsForTab(tab) {
    if (tab === "client_booking") return ["visits"];
    if (tab === "achievements") return ["achievements"];
    return allCabinetSections;
  }
  async function loadCabinetSections(sections, force = false) {
    const requested = sections.filter((section) => force || !loadedCabinetSections.has(section));
    if (!requested.length) return cabinetData;
    if (cabinetSectionsPromise) await cabinetSectionsPromise;
    const stillMissing = requested.filter((section) => force || !loadedCabinetSections.has(section));
    if (!stillMissing.length) return cabinetData;
    cabinetSectionsPromise = (async () => {
      const result = await requestJson(`/auth/cabinet?include=${encodeURIComponent(stillMissing.join(","))}`, { cache: "no-store" });
      const sectionFields = {
        profile: ["profile", "metric"],
        visits: ["visits"],
        loyalty: ["bonus_types", "bonus_balances", "client_level"],
        achievements: ["achievements", "organization_achievements"],
        referrals: ["referral_link", "referral_invites_count"]
      };
      const baseFields = ["client", "organization_id", "registration_fields", "card_sections", "available_contact_channels"];
      cabinetData || (cabinetData = {});
      baseFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(result, field)) cabinetData[field] = result[field];
      });
      stillMissing.forEach((section) => {
        (sectionFields[section] || []).forEach((field) => {
          if (Object.prototype.hasOwnProperty.call(result, field)) cabinetData[field] = result[field];
        });
        loadedCabinetSections.add(section);
      });
      currentClient = cabinetData.client || currentClient;
      applyAvailableContactChannels(cabinetData.available_contact_channels);
      return cabinetData;
    })();
    try {
      return await cabinetSectionsPromise;
    } finally {
      cabinetSectionsPromise = null;
    }
  }
  function cabinetTabAllowed(tab) {
    var _a3;
    if (tab === "client_booking" && publicBookingOrganizationId) return true;
    const sections = cabinetAccessSections((_a3 = cabinetData == null ? void 0 : cabinetData.card_sections) != null ? _a3 : defaultCardSections);
    if (tab === "client_booking") return cabinetAccessEnabled(sections, "client_online_booking");
    if (tab === "achievements") return cabinetAccessEnabled(sections, "client_achievements");
    if (tab === "chat") return sections.includes("client_chat");
    return true;
  }
  function setCabinetTab(tab) {
    if (form.dataset.cabinetRegistration === "true") {
      tab = "profile";
    }
    if (!cabinetTabAllowed(tab)) tab = "profile";
    document.querySelectorAll("[data-cabinet-tab]").forEach((link) => link.classList.toggle("active", link.dataset.cabinetTab === tab));
    document.querySelectorAll("[data-cabinet-view]").forEach((view) => {
      view.hidden = view.dataset.cabinetView !== tab;
    });
    if (tab === "achievements") {
      if (loadedCabinetSections.has("achievements")) renderAchievements();
      else loadCabinetSections(["achievements"]).then(renderAchievements).catch(() => renderAchievements());
    }
    if (tab === "client_booking") {
      if (loadedCabinetSections.has("visits")) loadClientBookingOptions();
      else loadCabinetSections(["visits"]).then(loadClientBookingOptions).catch(loadClientBookingOptions);
    }
    if (tab === "profile" && !allCabinetSections.every((section) => loadedCabinetSections.has(section))) {
      loadCabinetSections(allCabinetSections).then(() => {
        var _a3;
        applyRegistrationFields(cabinetData == null ? void 0 : cabinetData.registration_fields, cabinetData == null ? void 0 : cabinetData.card_sections);
        fillCurrentUserCabinet(currentClient || {});
        renderHistorySections((_a3 = cabinetData == null ? void 0 : cabinetData.card_sections) != null ? _a3 : defaultCardSections);
      }).catch(() => {
      });
    }
  }
  function openCabinetMenu() {
    const menu = document.querySelector("[data-cabinet-menu]");
    if (!menu) return;
    menu.removeAttribute("hidden");
    requestAnimationFrame(() => menu.classList.add("is-open"));
  }
  function closeCabinetMenu() {
    const menu = document.querySelector("[data-cabinet-menu]");
    if (!menu || menu.hasAttribute("hidden")) return;
    menu.classList.remove("is-open");
    window.setTimeout(() => menu.setAttribute("hidden", ""), 230);
  }
  function setRegistrationMode(enabled) {
    document.body.classList.toggle("cabinet-registration-mode", enabled);
    if (cabinetTitle) cabinetTitle.textContent = enabled ? "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u043A\u043B\u0438\u0435\u043D\u0442\u0430" : "\u041C\u043E\u0438 \u0434\u0430\u043D\u043D\u044B\u0435";
    if (historySection) historySection.hidden = enabled;
    if (bottomNav) bottomNav.hidden = enabled;
    if (profileAvatar) profileAvatar.hidden = enabled;
    if (profileEditButton) profileEditButton.hidden = enabled;
    document.querySelectorAll("[data-cabinet-view]").forEach((view) => {
      if (enabled) view.hidden = view.dataset.cabinetView !== "profile";
    });
    if (profilePanel) profilePanel.hidden = false;
    submitButton.textContent = enabled ? "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F" : "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435";
    form.dataset.cabinetRegistration = enabled ? "true" : "false";
    setCabinetEditMode(enabled);
  }
  function setCabinetEditMode(enabled) {
    const registration = form.dataset.cabinetRegistration === "true";
    const editing = registration || enabled;
    const lockedFields = /* @__PURE__ */ new Set(["telegram_id", "max_id", "vk_id"]);
    form.querySelectorAll("[data-cabinet-field]").forEach((field) => {
      field.querySelectorAll("input, select, textarea").forEach((control) => {
        control.disabled = field.hidden || lockedFields.has(field.dataset.cabinetField) || !editing;
      });
    });
    document.querySelector("[data-cabinet-actions]").hidden = !editing;
    document.querySelector("[data-cabinet-edit]").hidden = registration || editing;
  }
  function applyRegistrationFields(fields, cardSections = []) {
    const registrationMode = form.dataset.cabinetRegistration === "true";
    const configuredFields = !registrationMode && Array.isArray(cardSections) && cardSections.includes("client_fields_configured") ? cardSections.filter((section) => String(section).startsWith(clientFieldSectionPrefix)).map((section) => String(section).slice(clientFieldSectionPrefix.length)).filter((field) => cabinetFieldNames.includes(field)) : null;
    const enabled = configuredFields != null ? configuredFields : Array.isArray(fields) ? fields : defaultRegistrationFields;
    const fieldsByName = new Map([...form.querySelectorAll("[data-cabinet-field]")].map((field) => [field.dataset.cabinetField, field]));
    const order = [...enabled, ...cabinetFieldNames.filter((name) => !enabled.includes(name))];
    order.forEach((name) => {
      const field = fieldsByName.get(name);
      if (field) form.insertBefore(field, form.querySelector("[data-cabinet-message]"));
    });
    fieldsByName.forEach((field) => {
      const isVisible = enabled.includes(field.dataset.cabinetField);
      field.hidden = !isVisible;
      field.style.display = isVisible ? "" : "none";
      field.querySelectorAll("input, select, textarea").forEach((control) => {
        control.disabled = !isVisible;
        if (!isVisible) control.required = false;
      });
    });
    setCabinetEditMode(form.dataset.cabinetRegistration === "true");
  }
  function textValue(data, name) {
    return String(data[name] || "").trim();
  }
  function optionalNumber(value) {
    const trimmed = String(value || "").trim();
    return trimmed ? Number(trimmed) : null;
  }
  function setMessage(text, kind = "") {
    message.textContent = text;
    message.dataset.kind = kind;
  }
  function cabinetSubmitPayload() {
    const data = formDataObject(form);
    return {
      last_name: textValue(data, "last_name") || null,
      first_name: textValue(data, "first_name") || null,
      middle_name: textValue(data, "middle_name") || null,
      primary_phone: textValue(data, "phone") || null,
      gender: textValue(data, "gender") || null,
      telegram_id: optionalNumber(data.telegram_id),
      max_id: optionalNumber(data.max_id),
      vk_id: optionalNumber(data.vk_id),
      email: textValue(data, "email") || null
    };
  }
  function fillCurrentUserCabinet(user) {
    const values = {
      last_name: user.last_name || "",
      first_name: user.first_name || "",
      middle_name: user.middle_name || "",
      phone: user.phone || user.primary_phone || "",
      gender: user.gender || "",
      telegram_id: user.telegram_id || "",
      max_id: user.max_id || "",
      vk_id: user.vk_id || "",
      email: user.email || ""
    };
    Object.entries(values).forEach(([name, value]) => {
      const control = form.elements[name];
      if (control) control.value = value;
    });
    renderCabinetProfilePhoto(user);
  }
  function renderCabinetProfilePhoto(user) {
    const photo = document.querySelector("[data-cabinet-profile-photo]");
    const initials = document.querySelector("[data-cabinet-profile-initials]");
    if (!photo || !initials) return;
    initials.textContent = [user == null ? void 0 : user.first_name, user == null ? void 0 : user.last_name].filter(Boolean).map((part) => String(part).trim().charAt(0)).join("").slice(0, 2).toUpperCase() || "\u041A";
    if ((user == null ? void 0 : user.id) && (user == null ? void 0 : user.photo_file_id)) {
      photo.src = `/crm-api/clients-core/clients/${encodeURIComponent(user.id)}/photo?v=${encodeURIComponent(user.updated_at || user.photo_file_id)}`;
      photo.hidden = false;
      initials.hidden = true;
      return;
    }
    photo.removeAttribute("src");
    photo.hidden = true;
    initials.hidden = false;
  }
  var _a2;
  (_a2 = document.querySelector("[data-cabinet-profile-photo-input]")) == null ? void 0 : _a2.addEventListener("change", async (event) => {
    var _a3;
    const input = event.currentTarget;
    const file = (_a3 = input.files) == null ? void 0 : _a3[0];
    if (!file) return;
    input.disabled = true;
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/auth/cabinet/photo", {
        method: "POST",
        credentials: "include",
        body: data
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0444\u043E\u0442\u043E");
      }
      const updatedClient = await response.json();
      currentClient = { ...currentClient || {}, ...updatedClient };
      cabinetData || (cabinetData = {});
      cabinetData.client = { ...cabinetData.client || {}, ...updatedClient };
      renderCabinetProfilePhoto(currentClient);
      setMessage("\u0424\u043E\u0442\u043E \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E.", "success");
    } catch (error) {
      setMessage(error.message || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0444\u043E\u0442\u043E.", "error");
    } finally {
      input.value = "";
      input.disabled = false;
    }
  });
  async function consumeLink() {
    var _a3, _b, _c;
    applyRegistrationFields([]);
    renderHistorySections([]);
    setRegistrationMode(false);
    if (publicBookingOrganizationId) {
      document.body.classList.add("cabinet-public-booking-mode");
      await loadCabinetOrganizationName(publicBookingOrganizationId);
      const result = await currentUser().catch(() => null);
      if (result) {
        await loadCabinetSections(["visits"]);
      }
      const sessionOrganizationId = Number((cabinetData == null ? void 0 : cabinetData.organization_id) || (currentClient == null ? void 0 : currentClient.organization_id) || 0);
      publicBookingAnonymous = !result || sessionOrganizationId !== publicBookingOrganizationId;
      if (publicBookingAnonymous) {
        cabinetData = null;
        currentClient = null;
      }
      setCabinetTab("client_booking");
      return;
    }
    if (!token) {
      try {
        const result = await currentUser();
        if (!result) throw new Error();
        const initialTab = cabinetTabFromHash();
        await loadCabinetSections(cabinetSectionsForTab(initialTab));
        await loadCabinetOrganizationName((cabinetData == null ? void 0 : cabinetData.organization_id) || ((_a3 = cabinetData == null ? void 0 : cabinetData.client) == null ? void 0 : _a3.organization_id) || (currentClient == null ? void 0 : currentClient.organization_id));
        applyRegistrationFields(cabinetData == null ? void 0 : cabinetData.registration_fields, cabinetData == null ? void 0 : cabinetData.card_sections);
        fillCurrentUserCabinet(currentClient || result);
        renderHistorySections((_b = cabinetData == null ? void 0 : cabinetData.card_sections) != null ? _b : defaultCardSections);
        const pushState = await refreshPushState().catch(() => null);
        await requestPushOnFirstPwaLaunch(pushState);
        await refreshNotificationsList().catch(() => null);
        exposeSessionForPwaInstall();
        setMessage("", "");
        submitButton.disabled = false;
        setCabinetTab(initialTab);
      } catch (e) {
        setMessage("\u0421\u0435\u0441\u0441\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430. \u0412\u043E\u0439\u0434\u0438\u0442\u0435 \u0441\u043D\u043E\u0432\u0430.", "error");
        submitButton.disabled = true;
      }
      return;
    }
    submitButton.disabled = true;
    try {
      const response = await fetch(`/auth/client-auth-links/${encodeURIComponent(token)}/consume`, { method: "POST" });
      if (!response.ok) throw new Error();
      const link = await response.json();
      if (link.session_token) localStorage.setItem(SESSION_TOKEN_KEY, link.session_token);
      cabinetData = link;
      applyAvailableContactChannels(link.available_contact_channels);
      await loadCabinetOrganizationName(link.organization_id);
      allCabinetSections.forEach((section) => loadedCabinetSections.add(section));
      currentClient = link.client || link.profile || null;
      const registrationMode = !link.client_id;
      setRegistrationMode(registrationMode);
      applyRegistrationFields(link.registration_fields, link.card_sections);
      fillCurrentUserCabinet(currentClient || {});
      if (!registrationMode) {
        renderHistorySections(link.card_sections);
        const pushState = await refreshPushState().catch(() => null);
        await requestPushOnFirstPwaLaunch(pushState);
        await refreshNotificationsList().catch(() => null);
        exposeSessionForPwaInstall();
      }
      submitButton.disabled = false;
      setCabinetTab("profile");
    } catch (e) {
      const text = "\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u0430 \u0438\u043B\u0438 \u0443\u0436\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0430.";
      alert(text);
      setMessage(text, "error");
      (_c = document.querySelector(".cabinet-shell")) == null ? void 0 : _c.setAttribute("hidden", "");
      location.replace("/auth.html");
    }
  }
  document.querySelectorAll("[data-cabinet-tab]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setCabinetTab(link.dataset.cabinetTab);
      closeCabinetMenu();
      const tabHashes = { achievements: "#achievements", chat: "#chat", client_booking: "#my-booking", profile: "#my-data" };
      history.replaceState(null, "", tabHashes[link.dataset.cabinetTab] || "#my-data");
    });
  });
  document.addEventListener("click", async (event) => {
    var _a3, _b, _c;
    if (event.target.closest("[data-cabinet-menu-open]")) {
      openCabinetMenu();
      return;
    }
    if (event.target.closest("[data-employee-reviews-back]")) {
      setCabinetTab("client_booking");
      return;
    }
    if (event.target.closest("[data-branch-reviews-back]")) {
      setCabinetTab("client_booking");
      return;
    }
    if (event.target.closest("[data-visit-review-back]")) {
      setCabinetTab("profile");
      return;
    }
    const visitReviewButton = event.target.closest("[data-visit-review]");
    if (visitReviewButton) {
      openVisitReview(visitReviewButton.dataset.visitId, visitReviewButton.dataset.branchId, visitReviewButton.dataset.employeeId, visitReviewButton.dataset.employeeName);
      return;
    }
    const reviewRatingButton = event.target.closest("[data-visit-review-rating]");
    if (reviewRatingButton) {
      visitReviewRating = Number(reviewRatingButton.dataset.visitReviewRating);
      renderVisitReviewStars();
      return;
    }
    if (event.target.closest("[data-cabinet-edit]")) {
      setCabinetEditMode(true);
      return;
    }
    const visitsToggle = event.target.closest("[data-cabinet-visits-toggle]");
    if (visitsToggle) {
      visitsExpanded = !visitsExpanded;
      visitsToggle.setAttribute("aria-expanded", String(visitsExpanded));
      (_a3 = visitsToggle.closest(".cabinet-history-card--visits")) == null ? void 0 : _a3.classList.toggle("is-expanded", visitsExpanded);
      return;
    }
    const bookingVisitsToggle = event.target.closest("[data-client-booking-visits-toggle]");
    if (bookingVisitsToggle) {
      bookingVisitsExpanded = !bookingVisitsExpanded;
      bookingVisitsToggle.setAttribute("aria-expanded", String(bookingVisitsExpanded));
      (_b = bookingVisitsToggle.closest(".cabinet-my-bookings")) == null ? void 0 : _b.classList.toggle("is-expanded", bookingVisitsExpanded);
      return;
    }
    const branchReviewsOpen = event.target.closest("[data-cabinet-branch-reviews-open]");
    if (branchReviewsOpen) {
      const branchId = Number(clientBookingForm.elements.branch_id.value || 0);
      const branch = (_c = clientBookingOptions == null ? void 0 : clientBookingOptions.branches) == null ? void 0 : _c.find((item) => Number(item.id) === branchId);
      if (branch) await openBranchReviews(branch);
      return;
    }
    if (event.target.closest("[data-cabinet-menu-close]") || event.target.matches("[data-cabinet-menu]")) {
      closeCabinetMenu();
      return;
    }
    if (event.target.closest("[data-cabinet-notifications-open]")) {
      notificationsModal.hidden = false;
      await refreshPushState().catch(() => null);
      await refreshNotificationsList({ markSeen: true }).catch(() => null);
      return;
    }
    if (event.target.closest("[data-cabinet-notifications-close]") || event.target.matches("[data-cabinet-notifications-modal]")) {
      notificationsModal.hidden = true;
      return;
    }
    const achievementButton = event.target.closest("[data-cabinet-achievement]");
    if (achievementButton) {
      const achievement = ((cabinetData == null ? void 0 : cabinetData.organization_achievements) || []).find((item) => String(item.id) === achievementButton.dataset.cabinetAchievement);
      if (achievement) openAchievementModal(achievement);
      return;
    }
    if (event.target.closest("[data-cabinet-achievement-close]") || event.target.matches("[data-cabinet-achievement-modal]")) {
      achievementModal.hidden = true;
      return;
    }
    const referralCopy = event.target.closest("[data-cabinet-copy-referral]");
    if (referralCopy) {
      const referralLink = (cabinetData == null ? void 0 : cabinetData.referral_link) || "";
      if (referralLink) {
        try {
          await navigator.clipboard.writeText(referralLink);
          referralCopy.textContent = "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E";
        } catch (e) {
          window.prompt("\u0421\u043A\u043E\u043F\u0438\u0440\u0443\u0439\u0442\u0435 \u0441\u0441\u044B\u043B\u043A\u0443", referralLink);
        }
      }
      return;
    }
    const visitsPageButton = event.target.closest("[data-cabinet-visits-page]");
    if (visitsPageButton) {
      event.preventDefault();
      event.stopPropagation();
      const visits = (cabinetData == null ? void 0 : cabinetData.visits) || [];
      const totalPages = Math.max(1, Math.ceil(visits.length / VISITS_PER_PAGE));
      const direction = visitsPageButton.dataset.cabinetVisitsPage;
      if (direction === "next") visitsPage += 1;
      if (direction === "prev") visitsPage -= 1;
      visitsPage = Math.max(1, Math.min(visitsPage, totalPages));
      renderVisitsPage();
      return;
    }
    const visitButton = event.target.closest("[data-cabinet-visit]");
    if (visitButton) {
      selectedVisit = ((cabinetData == null ? void 0 : cabinetData.visits) || []).find((item) => String((item.visit || item).id) === String(visitButton.dataset.cabinetVisit)) || null;
      renderHistorySections(currentCardSections);
      return;
    }
    if (event.target.closest("[data-cabinet-close-visit]") || event.target.matches("[data-cabinet-visit-modal]")) {
      selectedVisit = null;
      renderHistorySections(currentCardSections);
      return;
    }
    if (event.target.closest("[data-cabinet-logout]")) {
      await fetch("/auth/logout", { method: "POST" }).catch(() => null);
      localStorage.removeItem(SESSION_TOKEN_KEY);
      location.href = "/auth.html?mode=login";
    }
  });
  contactPreference == null ? void 0 : contactPreference.addEventListener("change", async () => {
    const selectedOption = contactPreference.selectedOptions[0];
    const previousChannel = preferredContactChannel;
    preferredContactChannel = (selectedOption == null ? void 0 : selectedOption.dataset.cabinetContactChannel) || "";
    const { organizationId, clientId } = pushContext();
    if (!organizationId || !clientId) return;
    contactPreference.disabled = true;
    try {
      await requestJson("/crm-api/client-communications/push/preference", {
        method: "POST",
        body: JSON.stringify({
          organization_id: organizationId,
          client_id: clientId,
          preferred_contact_channel: preferredContactChannel || null
        })
      });
    } catch (error) {
      preferredContactChannel = previousChannel;
      const previousOption = [...contactPreference.options].find(
        (option) => option.dataset.cabinetContactChannel === previousChannel
      );
      contactPreference.value = (previousOption == null ? void 0 : previousOption.value) || "";
      pushStatus.textContent = error.message || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0441\u0440\u0435\u0434\u0441\u0442\u0432\u043E \u0441\u0432\u044F\u0437\u0438.";
    } finally {
      contactPreference.disabled = false;
    }
  });
  pushToggleControl.addEventListener("click", async (event) => {
    event.preventDefault();
    if (pushToggle.disabled) return;
    const enable = !pushToggle.checked;
    pushToggle.checked = enable;
    pushToggle.disabled = true;
    try {
      if (enable) await enablePushNotifications();
      else await disablePushNotifications();
    } catch (error) {
      pushToggle.checked = !enable;
      pushStatus.textContent = error.message || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F.";
    } finally {
      pushToggle.disabled = false;
    }
  });
  document.querySelector("[data-visit-review-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const reviewForm = event.currentTarget;
    const message2 = reviewForm.querySelector("[data-visit-review-message]");
    const submit = reviewForm.querySelector("[data-visit-review-submit]");
    const organizationId = (clientBookingOptions == null ? void 0 : clientBookingOptions.organization_id) || (cabinetData == null ? void 0 : cabinetData.organization_id) || (currentClient == null ? void 0 : currentClient.organization_id);
    const clientId = (clientBookingOptions == null ? void 0 : clientBookingOptions.client_id) || (cabinetData == null ? void 0 : cabinetData.client_id) || (currentClient == null ? void 0 : currentClient.id);
    const branchId = Number(reviewForm.elements.branch_id.value || 0);
    const employeeId = Number(reviewForm.elements.employee_id.value || 0);
    const visitId = String(reviewForm.elements.visit_id.value || "");
    const text = reviewForm.elements.text.value.trim();
    if (!organizationId || !clientId || !employeeId || !visitReviewRating || !text) return;
    submit.disabled = true;
    setBookingLoader(true, "\u041F\u0443\u0431\u043B\u0438\u043A\u0443\u0435\u043C \u043E\u0442\u0437\u044B\u0432\u2026");
    message2.textContent = "\u041F\u0443\u0431\u043B\u0438\u043A\u0443\u0435\u043C \u043E\u0442\u0437\u044B\u0432\u2026";
    try {
      await requestJson("/crm-api/client-reviews", {
        method: "POST",
        body: JSON.stringify({ organization_id: Number(organizationId), client_id: Number(clientId), employee_id: employeeId, rating: visitReviewRating, text })
      });
      if (branchId) {
        await requestJson("/crm-api/client-reviews", {
          method: "POST",
          body: JSON.stringify({ organization_id: Number(organizationId), client_id: Number(clientId), branch_id: branchId, visit_id: Number(visitId), rating: visitReviewRating, text })
        });
      }
      reviewedVisitIds.add(visitId);
      sessionStorage.setItem("cabinet.reviewedVisitIds", JSON.stringify([...reviewedVisitIds]));
      const updateMaster = (master) => {
        if (Number(master.id) !== employeeId) return;
        const count = Number(master.reviews_count || 0);
        const rating = Number(master.rating || 0);
        master.rating = Number(((rating * count + visitReviewRating) / (count + 1)).toFixed(2));
        master.reviews_count = count + 1;
      };
      (clientBookingMasterPreviews || []).forEach(updateMaster);
      ((clientBookingOptions == null ? void 0 : clientBookingOptions.masters) || []).forEach(updateMaster);
      renderClientBookingMasters();
      renderHistorySections(currentCardSections);
      message2.textContent = "\u041E\u0442\u0437\u044B\u0432 \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D.";
      setBookingLoader(false);
      await showBookingSuccessToast("\u041E\u0442\u0437\u044B\u0432 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D");
      setCabinetTab("profile");
    } catch (e) {
      message2.textContent = "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C \u043E\u0442\u0437\u044B\u0432. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.";
      submit.disabled = false;
    } finally {
      setBookingLoader(false);
    }
  });
  clientBookingForm.addEventListener("change", async (event) => {
    clientBookingMessage.textContent = "";
    if (event.target.name === "branch_id") {
      openServiceCategoryId = null;
      clientBookingCompatibility = null;
      clientBookingSelectedStart = "";
      renderClientBookingBranchMeta();
      clientBookingForm.querySelectorAll('[name="service_ids"]').forEach((input) => {
        input.checked = false;
      });
      clientBookingForm.querySelector("[data-client-booking-service-search]").value = "";
      clientBookingForm.elements.master_id.value = "";
      clientBookingForm.querySelectorAll("[data-booking-step-toggle]").forEach((trigger) => {
        trigger.disabled = false;
      });
      renderClientBookingServices();
      renderClientBookingMasters();
      loadClientBookingMasters();
      await loadClientBookingSlots();
      return;
    }
    if (event.target.name === "service_ids") {
      clientBookingForm.elements.master_id.value = "";
      clientBookingSelectedStart = "";
      clientBookingCompatibility = null;
      clientBookingMasterPreviews = null;
      clientBookingMastersLoadingKey = "";
      clientBookingMastersRequestId += 1;
      clientBookingCompatibilityRequestId += 1;
      clientBookingForm.querySelector("[data-client-booking-submit]").disabled = true;
      clientBookingSlots.innerHTML = '<legend>\u0421\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F</legend><p class="cabinet-history-empty">\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0434\u0430\u0442\u0443 \u0438 \u0432\u0440\u0435\u043C\u044F \u0434\u043B\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u044B\u0445 \u0441\u043B\u043E\u0442\u043E\u0432.</p>';
      renderClientBookingMasters();
      updateClientBookingSummaries();
      return;
    }
    if (event.target.name === "master_choice") {
      clientBookingForm.elements.master_id.value = event.target.value;
      renderClientBookingMasters();
      renderClientBookingCalendar();
      await loadClientBookingSlots();
      updateClientBookingSummaries();
      return;
    }
    if (event.target.name === "booking_date") {
      updateClientBookingSummaries();
      await loadClientBookingSlots();
      return;
    }
    if (event.target.name === "starts_at") {
      clientBookingSelectedStart = event.target.value;
      if (event.target.dataset.branchId) {
        clientBookingForm.elements.branch_id.value = event.target.dataset.branchId;
        renderClientBookingBranchMeta();
      }
      await loadClientBookingSlots();
      clientBookingForm.querySelector("[data-client-booking-submit]").disabled = !selectedBookingServiceIds().length || !clientBookingForm.elements.master_id.value;
      updateClientBookingSummaries();
    }
  });
  clientBookingForm.addEventListener("click", async (event) => {
    var _a3;
    const thumbnail = event.target.closest("[data-booking-service-thumbnail]");
    if (thumbnail) {
      event.preventDefault();
      event.stopPropagation();
      const gallery = thumbnail.closest("[data-booking-service-gallery]");
      const mainImage = gallery == null ? void 0 : gallery.querySelector(".cabinet-booking-service-gallery-main img");
      const source = (_a3 = thumbnail.querySelector("img")) == null ? void 0 : _a3.src;
      if (mainImage && source) mainImage.src = source;
      gallery == null ? void 0 : gallery.querySelectorAll("[data-booking-service-thumbnail]").forEach((item) => item.classList.toggle("active", item === thumbnail));
      return;
    }
    const galleryButton = event.target.closest("[data-service-gallery-open]");
    if (galleryButton) {
      event.preventDefault();
      event.stopPropagation();
      const imageUrls = JSON.parse(galleryButton.dataset.serviceGalleryImages || "[]");
      if (imageUrls.length) openServiceGallery(imageUrls, galleryButton.dataset.serviceGalleryTitle, galleryButton.dataset.serviceGalleryIndex);
      return;
    }
    const masterReviewsButton = event.target.closest("[data-booking-master-reviews]");
    if (masterReviewsButton) {
      await openEmployeeReviews(masterReviewsButton.dataset.bookingMasterReviews, masterReviewsButton.dataset.bookingMasterName, { position: masterReviewsButton.dataset.bookingMasterPosition, rating: masterReviewsButton.dataset.bookingMasterRating, reviewsCount: masterReviewsButton.dataset.bookingMasterReviewsCount, photoUrl: masterReviewsButton.dataset.bookingMasterPhoto });
      return;
    }
    const masterChoice = event.target.closest('[name="master_choice"]');
    if (masterChoice && clientBookingForm.elements.master_id.value === masterChoice.value) {
      event.preventDefault();
      clientBookingForm.elements.master_id.value = "";
      renderClientBookingMasters();
      renderClientBookingCalendar();
      await loadClientBookingSlots();
      updateClientBookingSummaries();
      return;
    }
    const categoryTrigger = event.target.closest("[data-booking-service-category-toggle]");
    if (categoryTrigger) {
      const categoryId = categoryTrigger.dataset.bookingServiceCategoryToggle;
      const shouldOpen = openServiceCategoryId !== categoryId;
      openServiceCategoryId = shouldOpen ? categoryId : null;
      clientBookingForm.querySelectorAll("[data-booking-service-category]").forEach((category) => {
        var _a4;
        const isCurrent = shouldOpen && category.dataset.bookingServiceCategory === categoryId;
        category.classList.toggle("is-expanded", isCurrent);
        (_a4 = category.querySelector("[data-booking-service-category-toggle]")) == null ? void 0 : _a4.setAttribute("aria-expanded", String(isCurrent));
      });
      return;
    }
    const trigger = event.target.closest("[data-booking-step-toggle]");
    if (trigger) {
      setClientBookingStep(trigger.dataset.bookingStepToggle);
      if (trigger.dataset.bookingStepToggle === "master" && clientBookingMasterPreviews === null) loadClientBookingMasters();
      if (trigger.dataset.bookingStepToggle === "datetime") loadClientBookingSlots();
      return;
    }
    const nearestSlot = event.target.closest("[data-booking-nearest-slot]");
    if (nearestSlot) {
      clientBookingSelectedStart = nearestSlot.dataset.start;
      if (nearestSlot.dataset.branchId) {
        clientBookingForm.elements.branch_id.value = nearestSlot.dataset.branchId;
        renderClientBookingBranchMeta();
      }
      clientBookingForm.elements.master_id.value = nearestSlot.dataset.masterId;
      clientBookingForm.elements.booking_date.value = nearestSlot.dataset.start.slice(0, 10);
      clientBookingCalendarMonth = /* @__PURE__ */ new Date(`${nearestSlot.dataset.start.slice(0, 7)}-01T00:00:00`);
      renderClientBookingMasters();
      renderClientBookingCalendar();
      updateClientBookingSummaries();
      setClientBookingStep("datetime", true);
      await loadClientBookingSlots();
      const matchingSlot = [...clientBookingForm.querySelectorAll('[name="starts_at"]')].find((input) => input.value === nearestSlot.dataset.start);
      if (matchingSlot) {
        matchingSlot.checked = true;
        clientBookingForm.querySelector("[data-client-booking-submit]").disabled = false;
        updateClientBookingSummaries();
      }
      return;
    }
    const dateButton = event.target.closest("[data-booking-date]");
    if ((dateButton == null ? void 0 : dateButton.dataset.bookingDateBlocked) === "true") {
      showSelectedMasterDateUnavailable();
      return;
    }
    if (dateButton && !dateButton.disabled) {
      clientBookingSelectedStart = "";
      clientBookingCompatibility = null;
      clientBookingForm.elements.booking_date.value = dateButton.dataset.bookingDate;
      renderClientBookingCalendar();
      updateClientBookingSummaries();
      loadClientBookingSlots();
      return;
    }
    if (event.target.closest("[data-booking-calendar-prev]")) {
      clientBookingCalendarMonth = new Date(clientBookingCalendarMonth.getFullYear(), clientBookingCalendarMonth.getMonth() - 1, 1);
      renderClientBookingCalendar();
      return;
    }
    if (event.target.closest("[data-booking-calendar-next]")) {
      clientBookingCalendarMonth = new Date(clientBookingCalendarMonth.getFullYear(), clientBookingCalendarMonth.getMonth() + 1, 1);
      renderClientBookingCalendar();
    }
  });
  clientBookingForm.querySelector("[data-client-booking-service-search]").addEventListener("input", () => {
    renderClientBookingServices();
  });
  clientBookingForm.addEventListener("submit", async (event) => {
    var _a3;
    event.preventDefault();
    const startsAt = (_a3 = clientBookingForm.querySelector('[name="starts_at"]:checked')) == null ? void 0 : _a3.value;
    const branchId = Number(clientBookingForm.elements.branch_id.value || 0);
    const submit = clientBookingForm.querySelector("[data-client-booking-submit]");
    if (!startsAt || !branchId) return;
    if (publicBookingAnonymous) {
      publicBookingRegistration.hidden = false;
      publicBookingRegistrationForm.elements.first_name.focus();
      return;
    }
    submit.disabled = true;
    setBookingLoader(true);
    clientBookingMessage.className = "cabinet-message";
    clientBookingMessage.textContent = "\u0421\u043E\u0437\u0434\u0430\u0451\u043C \u0437\u0430\u043F\u0438\u0441\u044C\u2026";
    try {
      await requestJson("/booking-api/client-booking", {
        method: "POST",
        body: JSON.stringify({
          branch_id: branchId,
          service_ids: selectedBookingServiceIds(),
          master_id: Number(clientBookingForm.elements.master_id.value),
          starts_at: startsAt,
          client_id: publicBookingClientId,
          visit_client_name: publicBookingVisitClientName || null
        })
      });
      const visitCreatedToast = showBookingSuccessToast("\u0412\u0438\u0437\u0438\u0442 \u0441\u043E\u0437\u0434\u0430\u043D");
      if (publicBookingOrganizationId) {
        setBookingLoader(false);
        await visitCreatedToast;
        location.href = "/cabinet.html#my-booking";
        return;
      }
      await loadCabinetSections(["visits"], true);
      renderClientBookingList();
      clientBookingMessage.textContent = "\u0412\u0438\u0437\u0438\u0442 \u0441\u043E\u0437\u0434\u0430\u043D.";
      await loadClientBookingSlots();
    } catch (error) {
      clientBookingMessage.className = "cabinet-message error";
      clientBookingMessage.textContent = error.message || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0437\u0430\u043F\u0438\u0441\u044C.";
      submit.disabled = false;
    } finally {
      setBookingLoader(false);
    }
  });
  publicBookingRegistrationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message2 = publicBookingRegistrationForm.querySelector("[data-public-booking-registration-message]");
    const submit = publicBookingRegistrationForm.querySelector('button[type="submit"]');
    message2.textContent = "\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C \u0434\u0430\u043D\u043D\u044B\u0435\u2026";
    submit.disabled = true;
    setBookingLoader(true);
    try {
      const data = formDataObject(publicBookingRegistrationForm);
      const response = await fetch("/public-api/online-booking/client", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: publicBookingOrganizationId, ...data })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043A\u043B\u0438\u0435\u043D\u0442\u0430.");
      if (result.session_token) localStorage.setItem(SESSION_TOKEN_KEY, result.session_token);
      publicBookingClientId = Number(result.client_id) || null;
      publicBookingVisitClientName = [data.last_name, data.first_name].filter(Boolean).join(" ").trim();
      publicBookingAnonymous = false;
      publicBookingRegistration.hidden = true;
      clientBookingForm.requestSubmit();
    } catch (error) {
      message2.textContent = error.message;
      submit.disabled = false;
    } finally {
      setBookingLoader(false);
    }
  });
  document.querySelector("[data-public-booking-registration-close]").addEventListener("click", () => {
    publicBookingRegistration.hidden = true;
  });
  consumeLink();
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    setMessage("\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u043C \u0434\u0430\u043D\u043D\u044B\u0435...");
    try {
      const profile = cabinetSubmitPayload();
      const endpoint = token ? `/public-api/client-auth-links/${encodeURIComponent(token)}/submit` : (currentClient == null ? void 0 : currentClient.id) ? `/crm-api/clients-core/clients/${encodeURIComponent(currentClient.id)}` : "";
      if (!endpoint) throw new Error("\u041A\u043B\u0438\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D.");
      const response = await fetch(endpoint, {
        method: token ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(token ? {
          last_name: profile.last_name,
          first_name: profile.first_name,
          middle_name: profile.middle_name,
          phone: profile.primary_phone,
          gender: profile.gender,
          telegram_id: profile.telegram_id,
          max_id: profile.max_id,
          vk_id: profile.vk_id,
          email: profile.email
        } : profile)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435");
      }
      const result = await response.json();
      if (result.redirect_url) {
        location.href = result.redirect_url;
        return;
      }
      currentClient = result.client || null;
      if (!currentClient && !token) currentClient = result || null;
      if (form.dataset.cabinetRegistration === "true" && ((currentClient == null ? void 0 : currentClient.id) || result.client_id)) {
        setRegistrationMode(false);
      }
      renderHistorySections(currentCardSections);
      setMessage("\u0414\u0430\u043D\u043D\u044B\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B.", "success");
      if (!token) setCabinetEditMode(false);
      submitButton.disabled = false;
    } catch (error) {
      setMessage(error.message, "error");
      submitButton.disabled = false;
    }
  });
})();
