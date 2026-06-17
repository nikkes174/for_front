const PERMISSIONS_TRANSLATE = {
    status: "Статус",
    can_be_edited: "Можно редактировать",
    can_change_info: "Изменение информации о чате",
    can_post_messages: "Публикация сообщений",
    can_edit_messages: "Редактирование сообщений",
    can_delete_messages: "Удаление сообщений",
    can_invite_users: "Приглашение пользователей",
    can_restrict_members: "Ограничение участников",
    can_pin_messages: "Закрепление сообщений",
    can_promote_members: "Назначение администраторов",
    can_manage_chat: "Управление чатом",
    can_manage_video_chats: "Управление видеочатами",
    can_post_stories: "Публикация историй",
    can_edit_stories: "Редактирование историй",
    can_delete_stories: "Удаление историй",
    can_manage_topics: "Управление темами",
    custom_title: "Кастомный титул",
    is_anonymous: "Анонимный админ"
};

const BROADCAST_BASE_STATE = {
    chats: [],
    selectedChatId: null,
    participantsByChat: new Map(),
};

function initBroadcastEditorUI() {
    if (window.__broadcastEditorInited) return;
    window.__broadcastEditorInited = true;

    const editor = document.getElementById("broadcast-editor");
    const counter = document.getElementById("char-counter");

    if (!editor || !counter) return;

    document.querySelectorAll(".editor-toolbar button").forEach(btn => {
        btn.addEventListener("mousedown", (e) => {
            e.preventDefault();

            if (document.activeElement !== editor) {
                editor.focus();
                updateEditorToolbarState();
                return;
            }

            const cmd = btn.dataset.cmd;

            switch (cmd) {
                case "bold":
                    document.execCommand("bold");
                    break;
                case "italic":
                    document.execCommand("italic");
                    break;
                case "underline":
                    document.execCommand("underline");
                    break;
                case "strikeThrough":
                    document.execCommand("strikeThrough");
                    break;
                case "code": {
                    const sel = window.getSelection();
                    if (!sel.rangeCount) break;
                    const range = sel.getRangeAt(0);
                    const text = range.toString() || "текст";
                    range.deleteContents();

                    const el = document.createElement("code");
                    el.textContent = text;
                    range.insertNode(el);

                    sel.removeAllRanges();
                    const r = document.createRange();
                    r.setStart(el.firstChild || el, (el.firstChild ? el.firstChild.length : 0));
                    r.collapse(true);
                    sel.addRange(r);

                    break;
                }

                case "quote": {
                    const sel = window.getSelection();
                    if (!sel.rangeCount) break;
                    const range = sel.getRangeAt(0);
                    const text = range.toString() || "цитата";
                    range.deleteContents();

                    const el = document.createElement("blockquote");
                    el.textContent = text;
                    range.insertNode(el);

                    sel.removeAllRanges();
                    const r = document.createRange();
                    r.setStart(el.firstChild || el, (el.firstChild ? el.firstChild.length : 0));
                    r.collapse(true);
                    sel.addRange(r);

                    break;
                }


                case "spoiler": {
                    const sel = window.getSelection();
                    if (!sel.rangeCount) break;
                    const range = sel.getRangeAt(0);
                    const text = range.toString() || "скрытый текст";
                    range.deleteContents();

                    const el = document.createElement("span");
                    el.setAttribute("data-spoiler", "1");
                    el.textContent = text;
                    range.insertNode(el);

                    sel.removeAllRanges();
                    const r = document.createRange();
                    r.setStart(el.firstChild || el, (el.firstChild ? el.firstChild.length : 0));
                    r.collapse(true);
                    sel.addRange(r);

                    break;
                }


                default:
                    return;
            }

            updateEditorToolbarState();
            editor.dispatchEvent(new Event("input"));
        });
    });

    // ---------- COUNTER ----------
    const updateCounter = () => {
        const metrics = getBroadcastTextMetrics(editor);
        counter.innerText = `${metrics.counterLength} символов`;
    };

    editor.addEventListener("input", updateCounter);
    document.getElementById("broadcast-media-type")?.addEventListener("change", updateCounter);

    // ---------- SYNC TOOLBAR ----------
    editor.addEventListener("keyup", updateEditorToolbarState);
    editor.addEventListener("mouseup", updateEditorToolbarState);
    editor.addEventListener("focus", updateEditorToolbarState);
    editor.addEventListener("blur", () => {
        document
            .querySelectorAll(".editor-toolbar button")
            .forEach(b => b.classList.remove("active"));
    });

    updateCounter();
}


function showPreloader() {
    const p = document.getElementById("preloader");
    p.style.display = "flex";
    p.style.opacity = "1";
}

function hidePreloader() {
    const p = document.getElementById("preloader");
    if (!p) return;
    p.style.opacity = "0";
    setTimeout(() => {
        p.style.display = "none";
    }, 300);
}

document.addEventListener("DOMContentLoaded", hidePreloader);
window.addEventListener("load", hidePreloader);
setTimeout(hidePreloader, 5000);

function htmlToMarkdownV2(html) {
    const root = document.createElement("div");
    root.innerHTML = html || "";

    const applyInline = (text, ctx) => {
        if (!text) return "";

        let out = escapeMarkdownV2(text.replace(/\u00A0/g, " "));

        if (ctx.code) out = `\`${out}\``;
        if (ctx.spoiler) out = `||${out}||`;
        if (ctx.strike) out = `~${out}~`;
        // Telegram MarkdownV2: сочетание italic + underline требует спец-синтаксис,
        // иначе парсер часто ломает границы сущностей.
        if (ctx.italic && ctx.underline) {
            out = `___${out}_\r__`;
        } else {
            if (ctx.underline) out = `__${out}__`;
            if (ctx.italic) out = `_${out}_`;
        }
        if (ctx.bold) out = `*${out}*`;

        return out;
    };

    const prefixQuote = (text) => {
        return text
            .split("\n")
            .map(line => line.trim() ? `> ${line}` : ">")
            .join("\n");
    };

    const parseStyleFlags = (styleText = "") => {
        const s = styleText.toLowerCase();
        const fontWeight = /font-weight\s*:\s*([^;]+)/.exec(s)?.[1] || "";
        const isBold =
            fontWeight.includes("bold") ||
            (!!fontWeight.match(/\d+/) && Number(fontWeight.match(/\d+/)[0]) >= 600);
        const isItalic = /font-style\s*:\s*italic/.test(s);
        const textDec = /text-decoration(?:-line)?\s*:\s*([^;]+)/.exec(s)?.[1] || "";
        const isUnderline = textDec.includes("underline");
        const isStrike = textDec.includes("line-through");
        return {isBold, isItalic, isUnderline, isStrike};
    };

    const walk = (node, ctx) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const chunk = applyInline(node.nodeValue || "", ctx);
            return ctx.quote ? prefixQuote(chunk) : chunk;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return "";
        }

        const tag = node.tagName.toLowerCase();
        if (tag === "br") return "\n";

        let next = {...ctx};

        if (tag === "b" || tag === "strong") next.bold = true;
        if (tag === "i" || tag === "em") next.italic = true;
        if (tag === "u") next.underline = true;
        if (tag === "s" || tag === "strike") next.strike = true;
        if (tag === "code") next.code = true;
        if (tag === "blockquote") next.quote = true;
        if (tag === "span" && node.hasAttribute("data-spoiler")) next.spoiler = true;

        if (tag === "span" && node.hasAttribute("style")) {
            const flags = parseStyleFlags(node.getAttribute("style") || "");
            if (flags.isBold) next.bold = true;
            if (flags.isItalic) next.italic = true;
            if (flags.isUnderline) next.underline = true;
            if (flags.isStrike) next.strike = true;
        }

        let text = "";
        node.childNodes.forEach(child => {
            text += walk(child, next);
        });

        if (tag === "div" || tag === "p") {
            text += "\n";
        }

        return text;
    };

    let result = "";
    root.childNodes.forEach(node => {
        result += walk(node, {
            bold: false,
            italic: false,
            underline: false,
            strike: false,
            code: false,
            spoiler: false,
            quote: false,
        });
    });

    return result
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function getBroadcastTextMetrics(editor) {
    const rawHtml = editor ? editor.innerHTML : "";
    const markdown = htmlToMarkdownV2(rawHtml);
    const escapedMarkdown = escapeMarkdownV2(markdown);
    const hasMedia = !!document.getElementById("broadcast-media-type")?.value;

    return {
        rawHtml,
        markdown,
        escapedMarkdown,
        counterLength: hasMedia ? Math.max(markdown.length, escapedMarkdown.length) : markdown.length,
        captionLength: Math.max(markdown.length, escapedMarkdown.length),
    };
}


async function loadChats(botId) {
    const block = document.getElementById("chat-block-" + botId);

    if (block.style.display === "block") {
        block.style.display = "none";
        return;
    }

    block.style.display = "block";
    block.innerHTML = "Загрузка…";
    showPreloader();

    try {
        const [groupsResp, channelsResp] = await Promise.all([
            fetch(`/chats/bot/${botId}/groups`),
            fetch(`/chats/bot/${botId}/channels`),
        ]);

        const groups = await groupsResp.json();
        const channels = await channelsResp.json();

        if ((!groups || groups.length === 0) && (!channels || channels.length === 0)) {
            block.innerHTML = "<p>Бот не добавлен ни в один чат.</p>";
            return;
        }

        function renderChatList(list) {
            let html = "";

            for (const chat of list) {
                const perms = chat.permissions || {};
                const nice = Object.entries(perms)
                    .filter(([k, v]) => v === true)
                    .map(([k]) => PERMISSIONS_TRANSLATE[k] || k);

                html += `
  <div class="chat-item">
      <div class="chat-line" style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <strong>${chat.chat_name}</strong>

          <button class="chat-leave-btn"
              onclick="leaveChat('${botId}', '${chat.id}')">
              🚪 Выйти
          </button>
      </div>

      ID: ${chat.chat_id}
      <div class="perm-list">${nice.join(", ") || "Нет прав"}</div>
  </div>`;
            }

            return html;
        }

        let html = "";

        if (channels && channels.length) {
            html += `<h4 style="margin-top:10px;">📢 Каналы</h4>`;
            html += renderChatList(channels);
        }

        if (groups && groups.length) {
            html += `<h4 style="margin-top:10px;">👥 Группы</h4>`;
            html += renderChatList(groups);
        }

        block.innerHTML = html;

    } finally {
        hidePreloader();
    }
}

async function leaveChat(botId, chatUuid) {
    showPreloader();
    showToast("Запрос на выход из группы отправлен…", "info");

    try {
        const res = await fetch(`/chats/${chatUuid}/leave`, {
            method: "POST",
        });

        let data = null;
        try {
            data = await res.json();
        } catch (e) {
        }

        if (!res.ok || !data?.ok) {
            const detail = typeof data?.detail === "string"
                ? data.detail
                : (data?.detail ? JSON.stringify(data.detail) : "unknown");
            showToast("Ошибка выхода: " + detail, "error");
            return;
        }

        showToast("Бот вышел из группы и чат удалён из базы", "success");

        await loadChats(botId);

    } catch (e) {
        console.error(e);
        showToast("Ошибка сети/сервера", "error");
    } finally {
        hidePreloader();
    }
}


function openBroadcast(botId) {
    document.getElementById("broadcast-bot-id").value = botId;
    document.getElementById("broadcast-modal").style.display = "flex";
    resetBroadcastTabState();
    loadBroadcastChats(botId);

    initBroadcastMediaUI();

    initBroadcastTabs();
    initBroadcastEditorUI();

}

async function syncBotChannel(botId) {
    const input = document.getElementById("sync-channel-input-" + botId);
    const channel = (input?.value || "").trim();

    if (!channel) {
        showToast("Укажите канал", "warning");
        return;
    }

    try {
        const res = await fetch(`/chats/bot/${botId}/sync-channel`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({channel}),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            showToast(data.detail || "Не удалось синхронизировать канал", "error");
            return;
        }

        showToast("Канал синхронизирован", "success");
        await loadChats(botId);
    } catch (e) {
        console.error(e);
        showToast("Ошибка сети", "error");
    }
}

function resetBroadcastTabState() {
    document.querySelectorAll(".broadcast-tab").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === "channels");
    });

    const channelsBox = document.getElementById("broadcast-chat-channels");
    const groupsBox = document.getElementById("broadcast-chat-groups");
    const baseBox = document.getElementById("broadcast-chat-base");
    const columnsHeader = document.getElementById("broadcast-columns-header");
    const columnsSubheader = document.getElementById("broadcast-columns-subheader");

    if (channelsBox) channelsBox.style.display = "block";
    if (groupsBox) groupsBox.style.display = "none";
    if (baseBox) baseBox.style.display = "none";
    if (columnsHeader) columnsHeader.style.display = "";
    if (columnsSubheader) columnsSubheader.style.display = "";
}

function initBroadcastTabs() {
    const tabs = {
        channels: document.getElementById("broadcast-chat-channels"),
        groups: document.getElementById("broadcast-chat-groups"),
        base: document.getElementById("broadcast-chat-base"),
    };
    const columnsHeader = document.getElementById("broadcast-columns-header");
    const columnsSubheader = document.getElementById("broadcast-columns-subheader");

    document.querySelectorAll(".broadcast-tab").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".broadcast-tab")
                .forEach(b => b.classList.remove("active"));

            btn.classList.add("active");

            const tab = btn.dataset.tab;

            Object.entries(tabs).forEach(([key, el]) => {
                if (!el) return;
                el.style.display = tab === key ? "block" : "none";
            });

            const isBaseTab = tab === "base";
            if (columnsHeader) columnsHeader.style.display = isBaseTab ? "none" : "";
            if (columnsSubheader) columnsSubheader.style.display = isBaseTab ? "none" : "";
        };
    });
}


async function loadBroadcastChats(botId) {
    const channelsBox = document.getElementById("broadcast-chat-channels");
    const groupsBox = document.getElementById("broadcast-chat-groups");
    const baseBox = document.getElementById("broadcast-chat-base");

    channelsBox.innerHTML = "Загрузка…";
    groupsBox.innerHTML = "Загрузка…";
    baseBox.innerHTML = "Загрузка…";

    try {
        const [groupsResp, channelsResp, welcomeChatsResp] = await Promise.all([
            fetch(`/chats/bot/${botId}/groups`),
            fetch(`/chats/bot/${botId}/channels`),
            fetch(`/participants/bot/${botId}/welcome-chats`),
        ]);

        const groups = await groupsResp.json();
        const channels = await channelsResp.json();
        const welcomeChats = await welcomeChatsResp.json();

        channelsBox.innerHTML = renderBroadcastChats(channels);
        groupsBox.innerHTML = renderBroadcastChats(groups);
        BROADCAST_BASE_STATE.chats = Array.isArray(welcomeChats) ? welcomeChats : [];
        BROADCAST_BASE_STATE.participantsByChat.clear();
        BROADCAST_BASE_STATE.selectedChatId = null;
        baseBox.innerHTML = renderBroadcastBase();

        if (BROADCAST_BASE_STATE.chats.length) {
            await selectBroadcastBaseChat(BROADCAST_BASE_STATE.chats[0].id);
        }

        attachRowEvents();
        attachColumnEvents();

    } catch (e) {
        channelsBox.innerHTML = "Ошибка загрузки";
        groupsBox.innerHTML = "Ошибка загрузки";
        baseBox.innerHTML = "Ошибка загрузки";
        console.error(e);
    }
}

function renderBroadcastBase() {
    const chats = Array.isArray(BROADCAST_BASE_STATE.chats)
        ? BROADCAST_BASE_STATE.chats
        : [];

    if (!chats.length) {
        return `
            <div class="broadcast-base-empty">
                Для этого бота нет каналов или групп с правилами приема.
            </div>
        `;
    }

    return `
        <div class="broadcast-base-layout">
            <div id="broadcast-base-chat-list">
                ${renderBroadcastBaseChatList()}
            </div>
            <div id="broadcast-base-detail">
                ${renderBroadcastBaseDetail()}
            </div>
        </div>
    `;
}

function renderBroadcastBaseChatList() {
    const chats = Array.isArray(BROADCAST_BASE_STATE.chats)
        ? BROADCAST_BASE_STATE.chats
        : [];

    return chats.map(chat => {
        const isActive = BROADCAST_BASE_STATE.selectedChatId === chat.id;
        const chatType = chat.chat_type === "channel" ? "Канал" : "Группа";

        return `
            <button type="button"
                    class="broadcast-base-chat-btn${isActive ? " active" : ""}"
                    onclick="selectBroadcastBaseChat('${chat.id}')">
                <div class="broadcast-base-chat-name">${escapeHtml(chat.chat_name || "Без названия")}</div>
                <div class="broadcast-base-chat-meta">${chatType}</div>
                <div class="broadcast-base-chat-count">В базе: ${Number(chat.participants_count || 0)}</div>
            </button>
        `;
    }).join("");
}

function renderBroadcastBaseDetail() {
    const selectedChatId = BROADCAST_BASE_STATE.selectedChatId;
    if (!selectedChatId) {
        return `
            <div class="broadcast-base-placeholder">
                Выберите канал или группу слева.
            </div>
        `;
    }

    const payload = BROADCAST_BASE_STATE.participantsByChat.get(selectedChatId);
    if (!payload) {
        return `
            <div class="broadcast-base-placeholder">
                Загрузка базы...
            </div>
        `;
    }

    const chat = payload.chat || {};
    const participants = Array.isArray(payload.participants) ? payload.participants : [];
    const selectedCount = participants.filter(item => item.__selected !== false).length;
    const exportHref = `/participants/chats/uuid/${selectedChatId}/participants/export`;

    return `
        <div class="broadcast-base-panel">
            <div class="broadcast-base-head">
                <div class="broadcast-base-head-main">
                    <div class="broadcast-base-title">${escapeHtml(chat.chat_name || "Без названия")}</div>
                    <div class="broadcast-base-stats">
                        <div class="broadcast-base-stat">
                            <span class="broadcast-base-stat-label">В базе</span>
                            <span class="broadcast-base-stat-value">${Number(payload.total || 0)}</span>
                        </div>
                        <div class="broadcast-base-stat">
                            <span class="broadcast-base-stat-label">Выбрано</span>
                            <span id="broadcast-base-selection-count" class="broadcast-base-stat-value">${selectedCount}</span>
                        </div>
                    </div>
                </div>
                <div class="broadcast-base-actions">
                    <button type="button" class="btn btn-secondary" onclick="toggleBroadcastBaseParticipants(true)">Выбрать всех</button>
                    <button type="button" class="btn btn-secondary" onclick="toggleBroadcastBaseParticipants(false)">Снять выбор</button>
                    <a class="btn btn-secondary" href="${exportHref}" target="_blank" rel="noopener noreferrer">Excel</a>
                </div>
            </div>

            <div class="broadcast-base-users">
                ${participants.length ? participants.map(renderBroadcastBaseParticipantRow).join("") : `<div class="broadcast-base-users-empty">Людей в базе пока нет.</div>`}
            </div>
        </div>
    `;
}

function renderBroadcastBaseParticipantRow(participant) {
    const fullName = [participant.first_name, participant.last_name].filter(Boolean).join(" ").trim() || "Без имени";
    const username = participant.username ? `@${escapeHtml(participant.username)}` : "Без username";
    const checked = participant.__selected !== false ? "checked" : "";
    const sourceName = participant.source_chat_name
        ? escapeHtml(participant.source_chat_name)
        : "Источник не указан";
    const sourceType = participant.source_chat_type === "channel" ? "Канал" : "Группа";

    return `
        <label class="broadcast-base-user-row">
            <input type="checkbox"
                   class="broadcast-base-user-checkbox"
                   data-user-id="${participant.user_id}"
                   ${checked}
                   onchange="onBroadcastBaseParticipantToggle(${participant.user_id}, this.checked)">
            <div class="broadcast-base-user-body">
                <div class="broadcast-base-user-top">
                    <div class="broadcast-base-user-name">${escapeHtml(fullName)}</div>
                    <div class="broadcast-base-user-id">ID ${participant.user_id}</div>
                </div>
                <div class="broadcast-base-user-meta">${username}</div>
                <div class="broadcast-base-user-source">Источник: ${sourceName} • ${sourceType}</div>
            </div>
        </label>
    `;
}

window.selectBroadcastBaseChat = async function (chatId) {
    BROADCAST_BASE_STATE.selectedChatId = String(chatId);

    const listEl = document.getElementById("broadcast-base-chat-list");
    if (listEl) listEl.innerHTML = renderBroadcastBaseChatList();

    const detailEl = document.getElementById("broadcast-base-detail");
    if (detailEl) detailEl.innerHTML = renderBroadcastBaseDetail();

    if (!BROADCAST_BASE_STATE.participantsByChat.has(String(chatId))) {
        try {
            const resp = await fetch(`/participants/chats/uuid/${chatId}/welcome-base`);
            const data = await resp.json();
            const participants = Array.isArray(data.participants)
                ? data.participants.map(item => ({...item, __selected: true}))
                : [];

            BROADCAST_BASE_STATE.participantsByChat.set(String(chatId), {
                chat: data.chat || null,
                total: data.total || participants.length,
                participants,
            });
        } catch (e) {
            console.error(e);
            showToast("Ошибка загрузки базы участников", "error");
            BROADCAST_BASE_STATE.participantsByChat.set(String(chatId), {
                chat: null,
                total: 0,
                participants: [],
            });
        }
    }

    if (detailEl) detailEl.innerHTML = renderBroadcastBaseDetail();
};

window.onBroadcastBaseParticipantToggle = function (userId, checked) {
    const chatId = BROADCAST_BASE_STATE.selectedChatId;
    if (!chatId) return;

    const payload = BROADCAST_BASE_STATE.participantsByChat.get(chatId);
    if (!payload) return;

    payload.participants = payload.participants.map(item =>
        Number(item.user_id) === Number(userId)
            ? {...item, __selected: !!checked}
            : item
    );

    const counter = document.getElementById("broadcast-base-selection-count");
    if (counter) {
        const selectedCount = payload.participants.filter(item => item.__selected !== false).length;
        counter.textContent = String(selectedCount);
    }
};

window.toggleBroadcastBaseParticipants = function (selected) {
    const chatId = BROADCAST_BASE_STATE.selectedChatId;
    if (!chatId) return;

    const payload = BROADCAST_BASE_STATE.participantsByChat.get(chatId);
    if (!payload) return;

    payload.participants = payload.participants.map(item => ({
        ...item,
        __selected: !!selected,
    }));

    const detailEl = document.getElementById("broadcast-base-detail");
    if (detailEl) detailEl.innerHTML = renderBroadcastBaseDetail();
};

function getSelectedBroadcastBaseUserIds() {
    const chatId = BROADCAST_BASE_STATE.selectedChatId;
    if (!chatId) return [];

    const payload = BROADCAST_BASE_STATE.participantsByChat.get(chatId);
    if (!payload) return [];

    return payload.participants
        .filter(item => item.__selected !== false)
        .map(item => Number(item.user_id))
        .filter(Boolean);
}

function renderBroadcastChats(chats) {
    if (!chats.length) {
        return "<p>Нет чатов</p>";
    }

    return chats.map(chat => `
        <div class="chat-row" data-chat="${chat.chat_id}">
            <div class="col col-main">
                <input type="checkbox" class="chat-select">
            </div>

            <div class="col col-name">
                ${chat.chat_name ?? "(без названия)"}
            </div>

            <div class="col col-silent">
                <input type="checkbox" class="opt-silent" disabled>
            </div>

            <div class="col col-protect">
                <input type="checkbox" class="opt-protect" disabled>
            </div>

            <div class="col col-pin">
                <input type="checkbox" class="opt-pin" disabled>
            </div>
        </div>
    `).join("");
}


function initBroadcastMediaUI() {
    const mediaTypeEl = document.getElementById("broadcast-media-type");
    const fileEl = document.getElementById("broadcast-media-file");
    const pickBtn = document.getElementById("broadcast-media-pick");
    const infoEl = document.getElementById("broadcast-media-info");
    const hintEl = document.getElementById("broadcast-caption-hint");
    let selectedFiles = [];
    if (!mediaTypeEl || !fileEl || !pickBtn || !infoEl || !hintEl) return;

    function resetFileState() {
        fileEl.value = "";
        selectedFiles = [];
        infoEl.textContent = "";
    }

    function setMultipleMode(enabled) {
        fileEl.multiple = enabled;
        if (enabled) {
            fileEl.setAttribute("multiple", "multiple");
        } else {
            fileEl.removeAttribute("multiple");
        }
    }

    function resetAll() {
        mediaTypeEl.value = "";
        resetFileState();
        pickBtn.disabled = true;
        hintEl.style.display = "none";
        setMultipleMode(false);
    }

    resetAll();

    const MEDIA_ACCEPT = {
        photo: "image/jpeg,image/png,image/webp",
        video: "video/mp4,video/webm,video/quicktime",
        audio: "audio/mpeg,audio/ogg,audio/wav",
        document: "",        // любые файлы
        media_group: "image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
    };

    mediaTypeEl.onchange = () => {
        const type = mediaTypeEl.value;

        resetFileState();

        fileEl.accept = MEDIA_ACCEPT[type] ?? "";

        if (!type) {
            pickBtn.disabled = true;
            hintEl.style.display = "none";
            setMultipleMode(false);
            return;
        }

        pickBtn.disabled = false;
        hintEl.style.display = "block";


        if (type === "photo" || type === "video" || type === "document" || type === "media_group") {
            setMultipleMode(true);
        } else {
            setMultipleMode(false);
        }
    };

    pickBtn.onclick = () => {
        const type = mediaTypeEl.value;
        const multi = (type === "photo" || type === "video" || type === "document" || type === "media_group");

        if (type === "media_group") {
            fileEl.multiple = true;
            fileEl.setAttribute("multiple", "multiple");
        } else {
            fileEl.multiple = false;
            fileEl.removeAttribute("multiple");
        }

        fileEl.multiple = multi;
        if (multi) fileEl.setAttribute("multiple", "multiple");
        else fileEl.removeAttribute("multiple");

        fileEl.click();
    };

    fileEl.onchange = () => {
        const files = Array.from(fileEl.files || []);
        selectedFiles = files;
        renderFiles();
    };

    function renderFiles() {
        if (!selectedFiles.length) {
            infoEl.textContent = "";
            return;
        }

        infoEl.innerHTML = selectedFiles.map((f, idx) => `
        <div style="display:flex;align-items:center;gap:6px;">
            <span>${f.name}</span>
            <button type="button"
                data-idx="${idx}"
                style="cursor:pointer;border:none;background:none;color:red;">
                ✕
            </button>
        </div>
    `).join("");

        infoEl.querySelectorAll("button[data-idx]").forEach(btn => {
            btn.onclick = () => {
                const idx = Number(btn.dataset.idx);
                selectedFiles.splice(idx, 1);
                syncInputFiles();
                renderFiles();
            };
        });
    }

    function syncInputFiles() {
        const dt = new DataTransfer();
        selectedFiles.forEach(f => dt.items.add(f));
        fileEl.files = dt.files;
    }

};


function isMediaSelected() {
    const mediaType = document.getElementById("broadcast-media-type")?.value;
    const files = document.getElementById("broadcast-media-file")?.files;
    return !!mediaType && files && files.length > 0;
}


function toggleRow(row, enabled) {
    const opts = row.querySelectorAll(".opt-silent, .opt-protect, .opt-pin");

    opts.forEach(opt => {
        opt.disabled = !enabled;
        if (!enabled) opt.checked = false;
    });
}

function attachRowEvents() {
    document.querySelectorAll(".chat-select").forEach(chk => {
        chk.addEventListener("change", () => {
            const row = chk.closest(".chat-row");
            const enabled = chk.checked;

            row.querySelectorAll(".opt-silent, .opt-protect, .opt-pin")
                .forEach(o => {
                    o.disabled = !enabled;
                    if (!enabled) o.checked = false;
                });
        });
    });
}


function attachColumnEvents() {

    document.getElementById("select-all-chats").onchange = e => {
        document.querySelectorAll(".chat-select").forEach(chk => {
            chk.checked = e.target.checked;
            chk.dispatchEvent(new Event("change"));
        });
    };

    document.getElementById("select-all-silent").onchange = e => {
        document.querySelectorAll(".opt-silent").forEach(chk => {
            if (!chk.disabled) chk.checked = e.target.checked;
        });
    };

    document.getElementById("select-all-protect").onchange = e => {
        document.querySelectorAll(".opt-protect").forEach(chk => {
            if (!chk.disabled) chk.checked = e.target.checked;
        });
    };

    document.getElementById("select-all-pin").onchange = e => {
        document.querySelectorAll(".opt-pin").forEach(chk => {
            if (!chk.disabled) chk.checked = e.target.checked;
        });
    };
}

async function sendBroadcast() {
    const botId = document.getElementById("broadcast-bot-id").value;
    const activeTab = document.querySelector(".broadcast-tab.active")?.dataset.tab;

    const editor = document.getElementById("broadcast-editor");
    const mediaTypeEl = document.getElementById("broadcast-media-type");
    const metrics = getBroadcastTextMetrics(editor);
    const text = metrics.markdown;

    const mediaInputEl = document.getElementById("broadcast-media-file");

    let mediaType = mediaTypeEl ? mediaTypeEl.value : "";
    const mediaFiles = Array.from(mediaInputEl?.files || []);
    const hasMedia = mediaFiles.length > 0;
    const isGroup = mediaFiles.length > 1;

    if (!hasMedia && !text) {
        showToast("Введите текст сообщения!", "warning");
        return;
    }

    if (hasMedia && metrics.captionLength > 1024) {
        showToast(`Caption слишком длинный: ${metrics.captionLength}/1024`, "warning");
        return;
    }

    if (mediaType === "media_group" && !isGroup) {
        showToast("Для медиагруппы нужно минимум 2 файла", "warning");
        return;
    }

    const MEDIA_RULES = {
        photo: {
            mime: ["image/jpeg", "image/png", "image/webp"],
            label: "Фото (JPG, PNG, WEBP)"
        },
        video: {
            mime: ["video/mp4", "video/webm", "video/quicktime"],
            label: "Видео (MP4, WEBM, MOV)"
        },
        audio: {
            mime: ["audio/mpeg", "audio/ogg", "audio/wav"],
            label: "Аудио (MP3, OGG, WAV)"
        },
        document: {
            mime: null,
            label: "Документ"
        }
    };

    if (hasMedia && mediaType !== "media_group") {
        const rule = MEDIA_RULES[mediaType];

        if (!rule) {
            showToast("Неизвестный тип медиа", "warning");
            return;
        }

        if (rule.mime) {
            const invalidFile = mediaFiles.find(
                f => !rule.mime.includes(f.type)
            );

            if (invalidFile) {
                showToast(
                    `Файл "${invalidFile.name}" не подходит.\nОжидается: ${rule.label}`,
                    "warning"
                );
                return;
            }
        }
    }

    if (activeTab === "base") {
        const userIds = getSelectedBroadcastBaseUserIds();
        if (!userIds.length) {
            showToast("Выберите хотя бы одного человека в базе", "warning");
            return;
        }

        const fd = new FormData();
        fd.append("user_ids_json", JSON.stringify(userIds));

        if (!hasMedia) {
            fd.append("message", text);
            return sendBroadcastUsersRequest(botId, fd);
        }

        const finalMediaType = isGroup ? "media_group" : mediaType;
        fd.append("media_type", finalMediaType);

        if (text) fd.append("caption", text);

        if (isGroup) {
            if (mediaFiles.length > 10) {
                showToast("Для медиагруппы максимум 10 файлов", "warning");
                return;
            }

            mediaFiles.forEach(file => {
                fd.append("group_files", file);
            });
        } else {
            if (mediaFiles.length !== 1) {
                showToast("Для выбранного типа медиа нужен ровно 1 файл", "warning");
                return;
            }

            fd.append("single_file", mediaFiles[0]);
        }

        return sendBroadcastUsersRequest(botId, fd);
    }

    const chats = [];
    document.querySelectorAll(".chat-row").forEach(row => {
        const chk = row.querySelector(".chat-select");
        if (!chk || !chk.checked) return;

        chats.push({
            chat_id: row.dataset.chat,
            silent_send: !!row.querySelector(".opt-silent")?.checked,
            protect: !!row.querySelector(".opt-protect")?.checked,
            pin: !!row.querySelector(".opt-pin")?.checked
        });
    });

    if (!chats.length) {
        showToast("Выберите хотя бы один чат", "warning");
        return;
    }

    const fd = new FormData();

    if (!hasMedia) {
        fd.append("message", text);
        fd.append("chats_list", JSON.stringify(chats));
        return sendBroadcastRequest(botId, fd);
    }

    // =========================
    // 📎 С МЕДИА
    // =========================

    // 🔥 media_group определяется ТОЛЬКО количеством файлов
    const finalMediaType = isGroup ? "media_group" : mediaType;

    fd.append("media_type", finalMediaType);
    fd.append("media_group", isGroup ? "true" : "false");

    if (text) fd.append("caption", text);

    if (isGroup) {
        // Telegram: 2–10 файлов
        if (mediaFiles.length > 10) {
            showToast("Для медиагруппы максимум 10 файлов", "warning");
            return;
        }

        mediaFiles.forEach(file => {
            fd.append("group_files", file); // ✅ ВСЕГДА список
        });

    } else {
        // строго 1 файл
        if (mediaFiles.length !== 1) {
            showToast("Для выбранного типа медиа нужен ровно 1 файл", "warning");
            return;
        }

        fd.append("single_file", mediaFiles[0]);
    }

    fd.append("chats_list", JSON.stringify(chats));

    return sendBroadcastRequest(botId, fd);
}

async function sendBroadcastUsersRequest(botId, formData) {
    showPreloader();

    try {
        const response = await fetch(`/bots/${botId}/broadcast-users`, {
            method: "POST",
            body: formData
        });

        let result = null;
        try {
            result = await response.json();
        } catch {
        }

        if (!response.ok) {
            showToast(result?.detail || "Ошибка рассылки по базе", "error");
            return;
        }

        showToast("Рассылка по базе поставлена в очередь", "success");
    } catch (e) {
        console.error(e);
        showToast("Ошибка сети или сервера", "error");
    } finally {
        hidePreloader();
    }
}

async function sendBroadcastRequest(botId, formData) {
    showPreloader();

    try {
        const response = await fetch(`/bots/${botId}/broadcast`, {
            method: "POST",
            body: formData
        });

        let result = null;
        try {
            result = await response.json();
        } catch {
        }

        if (!response.ok) {
            showToast("Ошибка: " + (result?.detail || "unknown"), "error");
            return;
        }

        if (result?.ok) {
            showToast("Задача поставлена в очередь!", "success");
            closeBroadcast();
        } else {
            showToast("Ошибка: " + (result?.detail || "unknown"), "error");
        }

    } catch (e) {
        console.error(e);
        showToast("Ошибка сети или сервера", "error");
    } finally {
        hidePreloader();
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const mediaTypeEl = document.getElementById("broadcast-media-type");
    const mediaInputEl = document.getElementById("broadcast-media-file");

    if (!mediaTypeEl || !mediaInputEl) return;

    mediaTypeEl.addEventListener("change", () => {
        mediaInputEl.value = "";
        mediaInputEl.multiple = (mediaTypeEl.value === "media_group");
    });
});


function closeBroadcast() {
    document.getElementById("broadcast-modal").style.display = "none";
    document.querySelector('.broadcast-columns-header-cols').style.display = 'none'
}

function copyBotToken() {
    navigator.clipboard.writeText(document.getElementById("bot-token-input").value);
}

function generateBotToken() {
    document.getElementById("bot-token-input").value =
        "tt_" + Math.random().toString(36).substring(2, 34);
}

function openTab(tabName) {
    document.querySelectorAll(".tab-section").forEach(el => el.style.display = "none");
    document.getElementById("tab-" + tabName).style.display = "block";

    document.querySelectorAll(".sidebar-link").forEach(el => el.classList.remove("active"));
    document.querySelector(`.sidebar-link[onclick*="openTab('${tabName}')"]`)?.classList.add("active");

    localStorage.setItem("tuna_active_tab", tabName);
}

document.addEventListener("DOMContentLoaded", () => {
    const lastTab = localStorage.getItem("tuna_active_tab");
    const tab = document.getElementById("tab-" + lastTab);

    if (tab) {
        openTab(lastTab);
    } else {
        openTab("bots");
    }
});

// USERBOT
const sendForm = document.getElementById("userbot-send-code-form");
const confirmForm = document.getElementById("userbot-confirm-form");
const msg = document.getElementById("userbot-msg");

if (sendForm) {
    sendForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        showPreloader();

        try {
            const res = await fetch("/userbots/send-code", {
                method: "POST",
                body: new FormData(sendForm),
            });

            const data = await res.json();

            if (!res.ok) {
                msg.innerText = data.detail || "Ошибка отправки кода";
                return;
            }

            const phoneValue = sendForm.querySelector("input[name='phone']").value.trim();
            document.getElementById("confirm-phone-hidden").value = phoneValue;

            msg.innerText = "Код отправлен. Введите код из Telegram";
            sendForm.style.display = "none";
            confirmForm.style.display = "block";

        } catch (err) {
            console.error(err);
            msg.innerText = "Ошибка сети";
        } finally {
            hidePreloader();
        }
    });

}

if (confirmForm) {
    confirmForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        showPreloader();

        try {
            const res = await fetch("/userbots/confirm", {
                method: "POST",
                body: new FormData(confirmForm),
            });

            const data = await res.json();

            if (data.status === "need_password") {
                msg.innerText = data.detail || "Введите пароль 2FA";
                document.getElementById("userbot-password-block").style.display = "block";
                return;
            }

            if (!res.ok) {
                // ⚠️ Бек не возвращает status=need_password, но Telethon требует 2FA
                msg.innerText = data.detail || "Введите пароль 2FA";
                document.getElementById("userbot-password-block").style.display = "block";
                return;
            }

            msg.innerText = "Юзер-бот успешно добавлен ✅";
            localStorage.setItem("tuna_active_tab", "userbots");
            location.reload();

        } catch (err) {
            console.error(err);
            msg.innerText = "Ошибка сети";
        } finally {
            hidePreloader();
        }
    });
}


async function toggleUserbotChannels(userbotId) {
    const block = document.getElementById("userbot-channels-" + userbotId);

    if (block.style.display === "block") {
        block.style.display = "none";
        return;
    }

    block.style.display = "block";
    await loadUserbotChannels(userbotId);
}

async function loadUserbotChannels(userbotId) {
    const block = document.querySelector(
        "#userbot-channels-" + userbotId + " .channels-list"
    );

    block.innerHTML = "Загрузка…";

    const res = await fetch(`/userbots/${userbotId}/channels`);
    const channels = await res.json();

    if (!channels.length) {
        block.innerHTML = "<p>Каналы не подключены</p>";
        return;
    }

    let html = "";
    for (const ch of channels) {
        html += `
            <div class="channel-row">
                <strong>${ch.chat_title}</strong>
                <span class="channel-id">${ch.chat_id}</span>

                <button class="btn-delete-small"
                        onclick="deleteUserbotChannel('${userbotId}', '${ch.id}')">
                    ✖
                </button>
            </div>
        `;
    }

    block.innerHTML = html;
}

async function addUserbotChannel(userbotId) {
    const input = document.getElementById("invite-input-" + userbotId);
    const invite = input.value.trim();

    if (!invite) {
        showToast("Введите инвайт-ссылку", "warning");
        return;
    }

    showPreloader();

    try {
        const res = await fetch(`/userbots/${userbotId}/channels`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({invite_link: invite})
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.detail || "Ошибка подключения канала", "error");
            return;
        }

        input.value = "";
        await loadUserbotChannels(userbotId);

    } finally {
        hidePreloader();
    }
}

async function deleteUserbotChannel(userbotId, channelId) {
    if (!confirm("Удалить канал из userbot?")) return;

    await fetch(
        `/userbots/${userbotId}/channels/${channelId}`,
        {method: "DELETE"}
    );

    await loadUserbotChannels(userbotId);
}
// =========================
// BIND BOT TO USERBOT
// =========================

async function loadBotsForBind(userbotId) {
    const box = document.getElementById("bind-bot-list");
    box.innerHTML = "Загрузка…";

    const userId = window.userId; // уже объявлен внизу шаблона

    const res = await fetch(`/bots/${userId}`);
    const bots = await res.json();

    if (!bots.length) {
        box.innerHTML = "<p>Боты не найдены</p>";
        return;
    }

    box.innerHTML = bots.map(b => `
        <div class="bind-bot-row">
            <strong>${b.bot_name}</strong>
            <button class="btn btn-secondary btn-small"
                    onclick="bindBot('${userbotId}', '${b.id}')">
                Выбрать
            </button>
        </div>
    `).join("");
}

async function bindBot(userbotId, botId) {
    const res = await fetch(`/bots/${botId}/bind-userbot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userbot_id: userbotId })
});

    if (!res.ok) {
        showToast("Ошибка привязки", "error");
        return;
    }

    showToast("Бот привязан ✅", "success");
    closeBindBotModal();
}


function attachColumnClickEvents() {
    document.querySelectorAll(".col-header").forEach(header => {
        const checkbox = header.querySelector("input[type='checkbox']");
        if (!checkbox) return;

        // Устанавливаем начальное состояние класса
        if (checkbox.checked) header.classList.add("active");

        // Клик по блоку
        header.addEventListener("click", e => {
            // Чтобы клик по самому input не срабатывал дважды
            if (e.target === checkbox) return;

            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event("change"));
        });

        // Смена состояния при изменении checkbox (через код или клик)
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                header.classList.add("active");
            } else {
                header.classList.remove("active");
            }
        });
    });
}

// Вызов после загрузки DOM и после рендеринга broadcast
document.addEventListener("DOMContentLoaded", attachColumnClickEvents);


let subscriptionsChart;
let subscribersChart;
let postMetricsChart;
let subscriptionsData = {joins: [], lefts: [], subscribersHistory: [], posts: []};
let activeCategories = {joins: true, lefts: true};
let selectedBotId = null;
let subscriptionsMinCountFilter = null;
const demoPostMetricsMap = new Map();

function escapeSubHtml(text) {
    return String(text ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;",
    }[ch]));
}

function formatDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function openSubscriptionsTab(el) {
    openTab('subscriptions');
    el.classList.add('active')
    setTimeout(loadChatList, 0);
}


async function loadChatList() {
    const select = document.getElementById("subscriptions-bot-select");
    if (!select) {
        console.error("subscriptions-bot-select not found");
        return;
    }

    const adminId = select.getAttribute("data-admin-id"); // 🔥 надежнее чем dataset
    console.log("adminId =", adminId);

    select.innerHTML = `<option value="">Загрузка чатов...</option>`;

    try {
        const resp = await fetch(`/userbots/channels/all?admin_id=${encodeURIComponent(adminId)}`);
        if (!resp.ok) {
            const t = await resp.text();
            console.error("channels/all error", resp.status, t);
            select.innerHTML = `<option value="">Ошибка: ${resp.status}</option>`;
            return;
        }

        const chats = await resp.json();
        console.log("chats =", chats);

        if (!Array.isArray(chats) || !chats.length) {
            showToast("Чаты не найдены — показан демо-чат", "info");

            const fakeChat = {
                userbot_id: "demo",
                chat_id: "demo_channel",
                chat_title: "📊 Демо-чат"
            };

            const payload = encodeURIComponent(JSON.stringify(fakeChat));

            select.innerHTML = `
        <option value="">Выберите чат</option>
        <option value="${payload}">${fakeChat.chat_title}</option>
    `;

            return;
        }

        select.innerHTML = `<option value="">Выберите чат</option>`;
        chats.forEach(ch => {
            const payload = encodeURIComponent(JSON.stringify({
                id: ch.id,
                userbot_id: ch.userbot_id,
                chat_id: String(ch.chat_id),
                chat_title: ch.chat_title
            }));
            select.innerHTML += `<option value="${payload}">${ch.chat_title} (${ch.chat_id})</option>`;
        });

    } catch (err) {
        console.error(err);
        select.innerHTML = `<option value="">Ошибка загрузки чатов</option>`;
    }
}

let selectedChat = null; // { userbot_id, chat_id, chat_title }

document.getElementById("subscriptions-bot-select").addEventListener("change", e => {
    const v = e.target.value;

    if (!v) {
        selectedChat = null;
        subscriptionsData = {joins: [], lefts: [], subscribersHistory: [], posts: []};
        renderSubscribersChart();
        renderChart();
        renderWheelList();
        renderSubscriptionsPosts();
        return;
    }

    try {
        selectedChat = JSON.parse(decodeURIComponent(v));
        loadSubscriptions();
    } catch (err) {
        console.error("Bad select value:", err);
        selectedChat = null;
    }
});

function generateFakeSubscriptions(days = 14) {
    const joins = [];
    const lefts = [];
    const subscribersHistory = [];

    const today = new Date();
    let subscribersCount = 1200;

    for (let i = days; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);

        const date = formatDateInputValue(d);

        // случайное количество
        const joinCount = Math.floor(Math.random() * 5);
        const leftCount = Math.floor(Math.random() * 3);

        for (let j = 0; j < joinCount; j++) {
            joins.push({
                username: `demo_user_${Math.floor(Math.random() * 1000)}`,
                nickname: "Demo User",
                actor_id: Math.floor(Math.random() * 10_000_000),
                date,
                time: "12:00:00",
                invite_title: `Invite ${Math.floor(Math.random() * 5) + 1}`,
                invite_link: `https://t.me/joinchat/${Math.random().toString(36).slice(2, 10)}`
            });
        }

        for (let l = 0; l < leftCount; l++) {
            lefts.push({
                username: `demo_user_${Math.floor(Math.random() * 1000)}`,
                nickname: "Demo User",
                actor_id: Math.floor(Math.random() * 10_000_000),
                date,
                time: "18:00:00",
                invite_link: null
            });
        }

        subscribersCount += joinCount - leftCount + Math.floor(Math.random() * 3 - 1);
        subscribersCount = Math.max(1000, subscribersCount);

        subscribersHistory.push({
            count: subscribersCount,
            range_from: date,
            range_to: date
        });
    }

    return {joins, lefts, subscribersHistory};
}

function generateFakePosts(days = 5) {
    demoPostMetricsMap.clear();

    const posts = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const postDate = new Date(today);
        postDate.setDate(today.getDate() - i);
        postDate.setHours(10 + i, 0, 0, 0);

        const messageId = 5000 + i;
        const baseViews = 920 + i * 27;
        const baseReactions = 18 + i * 4;
        const metrics = [];

        for (let step = 0; step < 8; step++) {
            const capturedAt = new Date(postDate);
            capturedAt.setMinutes(postDate.getMinutes() + step * 15);

            metrics.push({
                id: `${messageId}-${step}`,
                userbot_id: "demo",
                channel_id: Number(selectedChat?.chat_id || 0),
                message_id: messageId,
                post_date: postDate.toISOString(),
                views: baseViews + step * (12 + i),
                reactions_count: baseReactions + step * (2 + (i % 3)),
                reactions_breakdown: {"🔥": 4 + step, "👍": 8 + step},
                captured_at: capturedAt.toISOString(),
                created_at: capturedAt.toISOString()
            });
        }

        demoPostMetricsMap.set(messageId, metrics);
        const lastPoint = metrics[metrics.length - 1];

        posts.push({
            id: `demo-post-${messageId}`,
            userbot_id: "demo",
            channel_id: Number(selectedChat?.chat_id || 0),
            message_id: messageId,
            post_date: postDate.toISOString(),
            post_title: `Демо-пост ${i + 1}`,
            views: lastPoint.views,
            reactions_count: lastPoint.reactions_count,
            reactions_breakdown: lastPoint.reactions_breakdown,
            created_at: postDate.toISOString(),
            updated_at: lastPoint.captured_at
        });
    }

    return posts.sort((a, b) => (b.post_date || "").localeCompare(a.post_date || ""));
}

function getLatestIsoTimestamp(items, fields) {
    if (!Array.isArray(items) || !items.length) return null;

    let latest = null;
    items.forEach(item => {
        if (!item) return;

        fields.forEach(field => {
            const value = item[field];
            if (!value) return;

            const ts = new Date(value).getTime();
            if (Number.isNaN(ts)) return;
            if (latest === null || ts > latest) {
                latest = ts;
            }
        });
    });

    return latest;
}

function isMetricDataStale(items, fields, maxAgeHours = 12) {
    const latest = getLatestIsoTimestamp(items, fields);
    if (latest === null) return true;
    return (Date.now() - latest) > maxAgeHours * 60 * 60 * 1000;
}

async function loadSubscriptions() {
    if (!selectedChat) return;

    if (selectedChat.userbot_id === "demo") {
        showToast("Демо-режим: тестовые подписки", "info");

        const fake = generateFakeSubscriptions(21);
        subscriptionsData.joins = fake.joins;
        subscriptionsData.lefts = fake.lefts;
        subscriptionsData.subscribersHistory = fake.subscribersHistory;
        subscriptionsData.posts = generateFakePosts(6);

        renderSubscribersChart();
        renderChart();
        renderWheelList();
        renderSubscriptionsPosts();
        return;
    }

    const userbotId = selectedChat.userbot_id;
    const channel_id = selectedChat.chat_id; // Telegram chat_id

    const LIMIT = 200;
    const ORDER = "desc";

    subscriptionsData.joins = [];
    subscriptionsData.lefts = [];
    subscriptionsData.subscribersHistory = [];
    subscriptionsData.posts = [];

    try {
        const [joinsResp, leftsResp, subscribersResp, postsResp] = await Promise.all([
            fetch(`/userbots/${userbotId}/channels/${channel_id}/logs/joins?limit=${LIMIT}&order=${ORDER}`),
            fetch(`/userbots/${userbotId}/channels/${channel_id}/logs/lefts?limit=${LIMIT}&order=${ORDER}`),
            fetch(`/userbots/${userbotId}/channels/${channel_id}/logs/subscribers`),
            fetch(`/userbots/${userbotId}/channels/${channel_id}/posts?limit=${LIMIT}`),
        ]);

        if (!joinsResp.ok) {
            throw new Error(`Ошибка загрузки joins: ${joinsResp.status}`);
        }
        if (!leftsResp.ok) {
            throw new Error(`Ошибка загрузки lefts: ${leftsResp.status}`);
        }
        if (!subscribersResp.ok) {
            throw new Error(`Ошибка загрузки subscribers: ${subscribersResp.status}`);
        }
        if (!postsResp.ok) {
            throw new Error(`Ошибка загрузки posts: ${postsResp.status}`);
        }

        const joins = await joinsResp.json();
        const lefts = await leftsResp.json();
        let subscribers = await subscribersResp.json();
        let posts = await postsResp.json();

        const shouldRefreshSubscribers = selectedChat.id && isMetricDataStale(
            subscribers,
            ["range_to", "range_from"]
        );
        const shouldRefreshPosts = selectedChat.id && isMetricDataStale(
            posts,
            ["updated_at", "created_at"]
        );

        if (shouldRefreshSubscribers || shouldRefreshPosts) {
            try {
                const refreshRequests = [];
                if (shouldRefreshSubscribers) {
                    refreshRequests.push(
                        fetch(
                            `/userbots/${userbotId}/channels/${selectedChat.id}/logs/subscribers/load`,
                            {method: "POST"}
                        ).then(response => ({
                            key: "subscribers",
                            ok: response.ok
                        }))
                    );
                }
                if (shouldRefreshPosts) {
                    refreshRequests.push(
                        fetch(
                            `/userbots/${userbotId}/channels/${selectedChat.id}/posts/load?limit=${LIMIT}`,
                            {method: "POST"}
                        ).then(response => ({
                            key: "posts",
                            ok: response.ok
                        }))
                    );
                }

                const refreshResults = await Promise.allSettled(refreshRequests);
                const refreshedKinds = new Set(
                    refreshResults
                        .filter(result => result.status === "fulfilled" && result.value?.ok)
                        .map(result => result.value.key)
                );

                if (refreshedKinds.has("subscribers")) {
                    const refetchResp = await fetch(
                        `/userbots/${userbotId}/channels/${channel_id}/logs/subscribers`
                    );
                    if (refetchResp.ok) {
                        subscribers = await refetchResp.json();
                    }
                }
                if (refreshedKinds.has("posts")) {
                    const refetchResp = await fetch(
                        `/userbots/${userbotId}/channels/${channel_id}/posts?limit=${LIMIT}`
                    );
                    if (refetchResp.ok) {
                        posts = await refetchResp.json();
                    }
                }
            } catch (err) {
                console.error("Не удалось автоматически обновить аналитику подписок:", err);
            }
        }

        subscriptionsData.joins = joins.map(j => {
            const ts = j.date; // ISO от backend

            return {
                username: j.username ?? null,
                nickname: j.nickname ?? null,
                date: ts ? ts.slice(0, 10) : "—",
                time: ts ? ts.slice(11, 19) : "",
                invite_title: j.invite_title ?? null,
                invite_link: j.invite_link ?? null,  // <-- добавили
            };
        });


        subscriptionsData.lefts = lefts.map(l => {
            const ts = l.date;

            return {
                username: l.username ?? null,
                nickname: l.nickname ?? null,
                date: ts ? ts.slice(0, 10) : "—",
                time: ts ? ts.slice(11, 19) : "",
            };
        });

        subscriptionsData.subscribersHistory = subscribers.map(item => ({
            count: Number(item.count) || 0,
            range_from: item.range_from ? item.range_from.slice(0, 10) : null,
            range_to: item.range_to ? item.range_to.slice(0, 10) : null,
        }));
        subscriptionsData.posts = posts.map(item => ({
            id: item.id,
            userbot_id: item.userbot_id,
            channel_id: item.channel_id,
            message_id: Number(item.message_id) || 0,
            post_date: item.post_date || null,
            post_title: item.post_title || null,
            views: Number(item.views) || 0,
            reactions_count: Number(item.reactions_count) || 0,
            reactions_breakdown: item.reactions_breakdown || null,
            created_at: item.created_at || null,
            updated_at: item.updated_at || null,
        }));


        if (selectedChat.userbot_id === "demo") {
            const fake = generateFakeSubscriptions(21);
            subscriptionsData.joins = fake.joins;
            subscriptionsData.lefts = fake.lefts;
            subscriptionsData.subscribersHistory = fake.subscribersHistory;
            subscriptionsData.posts = generateFakePosts(6);
        }


    } catch (err) {
        console.error("Ошибка загрузки логов подписок:", err);
        showToast("Не удалось загрузить логи подписок", "warning");
        renderSubscriptionsPosts();
        return;
    }

    // 📅 дефолтный период — 30 дней
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30);

    document.getElementById("filter-from").value =
        formatDateInputValue(monthAgo);
    document.getElementById("filter-to").value =
        formatDateInputValue(today);

    renderSubscribersChart();
    renderChart();
    renderWheelList();
    renderSubscriptionsPosts();
}

function filterByDate(entry) {
    const from = document.getElementById("filter-from").value;
    const to = document.getElementById("filter-to").value;
    const entryDate = new Date(entry.date);
    if (from && entryDate < new Date(from)) return false;
    if (to && entryDate > new Date(to)) return false;
    return true;
}


function getSelectedSubscriptionsDateRange() {
    let from = document.getElementById("filter-from").value;
    let to = document.getElementById("filter-to").value;

    if (from && to) {
        return {from, to};
    }

    const candidates = [
        ...subscriptionsData.joins.map(j => j.date),
        ...subscriptionsData.lefts.map(l => l.date),
        ...subscriptionsData.subscribersHistory.flatMap(item => [
            item.range_from,
            item.range_to
        ]),
    ].filter(Boolean).sort();

    if (!candidates.length) {
        return {from: null, to: null};
    }

    return {
        from: from || candidates[0],
        to: to || candidates[candidates.length - 1],
    };
}

function buildDateRangeLabels(from, to) {
    if (!from || !to) return [];

    const labels = [];
    const current = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);

    while (current <= end) {
        labels.push(formatDateInputValue(current));
        current.setDate(current.getDate() + 1);
    }

    return labels;
}

function getSubscribersCountForDate(date, history) {
    for (let i = history.length - 1; i >= 0; i--) {
        const item = history[i];
        if (item.range_from <= date && item.range_to >= date) {
            return item.count;
        }
    }

    const firstItem = history[0];
    if (firstItem && date < firstItem.range_from) {
        return firstItem.count;
    }

    return null;
}

function renderSubscribersChart() {
    const canvas = document.getElementById("subscribers-chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const history = subscriptionsData.subscribersHistory || [];
    const {from, to} = getSelectedSubscriptionsDateRange();
    const labels = buildDateRangeLabels(from, to);
    const formattedLabels = labels.map(formatDateLabel);
    const values = labels.map(date => getSubscribersCountForDate(date, history));

    if (subscribersChart) subscribersChart.destroy();

    const verticalHoverLine = {
        id: 'verticalHoverLineSubscribers',
        afterDraw(chart) {
            const tooltip = chart.tooltip;
            if (!tooltip || !tooltip.getActiveElements().length) return;

            const x = tooltip.getActiveElements()[0].element.x;
            const topY = chart.chartArea.top;
            const bottomY = chart.chartArea.bottom;

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([6, 6]);
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#bbb';
            ctx.stroke();
            ctx.restore();
        }
    };

    const dottedGridPlugin = {
        id: 'dottedGridSubscribers',
        beforeDraw(chart) {
            const { top, bottom, left, right } = chart.chartArea;

            ctx.save();
            ctx.fillStyle = "rgba(173, 216, 230, 0.6)";

            const gap = 10;
            for (let x = left; x < right; x += gap) {
                for (let y = top; y < bottom; y += gap) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }

            ctx.restore();
        }
    };

    const xAxisBottomDotsPlugin = {
        id: 'xAxisBottomDotsSubscribers',
        afterDraw(chart) {
            const xScale = chart.scales.x;
            const yScale = chart.scales.y;

            ctx.save();
            ctx.fillStyle = "#292929";
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 4;

            chart.data.labels.forEach((label, index) => {
                if (index % 3 !== 0) return;

                const x = xScale.getPixelForTick(index);
                const y = yScale.getPixelForValue(yScale.min);

                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });

            ctx.restore();
        }
    };

    function createGradient(color, alphaTop) {
        const g = ctx.createLinearGradient(0, 0, 0, 200);
        g.addColorStop(0, color.replace("1)", `${alphaTop})`));
        g.addColorStop(1, color.replace("1)", "0)"));
        return g;
    }

    const BLUE = "rgba(52, 152, 219, 1)";

    subscribersChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: formattedLabels,
            datasets: [{
                label: "Подписчики",
                data: values,
                borderColor: BLUE,
                backgroundColor: createGradient(BLUE, 0.3),
                fill: true,
                tension: 0.35,
                spanGaps: true,
                pointRadius: 0,
                pointHoverRadius: 0,
                pointBackgroundColor: "#fff",
                pointBorderWidth: 2
            }]
        },
        plugins: [
            dottedGridPlugin,
            verticalHoverLine,
            xAxisBottomDotsPlugin
        ],
        options: {
            responsive: true,
            interaction: {
                intersect: false,
                mode: "index"
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: context => `Подписчики: ${context.raw ?? "—"}`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        drawTicks: false,
                        drawOnChartArea: false,
                        drawBorder: true
                    },
                    ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0,
                        callback: (v, i) => i % 3 === 0 ? formattedLabels[i] : ""
                    }
                },
                y: {
                    ticks: {
                        display: false
                    },
                    grid: {
                        drawTicks: false,
                        drawOnChartArea: true,
                        drawBorder: false,
                        color: scaleCtx => (
                            scaleCtx.tick.value === scaleCtx.scale.min
                                ? 'lightgrey'
                                : 'transparent'
                        )
                    },
                    border: {
                        display: false
                    },
                    grace: '5%'
                }
            }
        }
    });
}


// Рендер графика
function renderChart() {

    // ─────────────────────────────
    // Hover vertical line plugin
    // ─────────────────────────────
    const verticalHoverLine = {
        id: 'verticalHoverLine',
        afterDraw(chart) {
            const tooltip = chart.tooltip;
            if (!tooltip || !tooltip.getActiveElements().length) return;

            const ctx = chart.ctx;
            const x = tooltip.getActiveElements()[0].element.x;
            const topY = chart.chartArea.top;
            const bottomY = chart.chartArea.bottom;

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([6, 6]);
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#bbb';
            ctx.stroke();
            ctx.restore();
        }
    };

    // ─────────────────────────────
    // Data filtering
    // ─────────────────────────────
    const filteredJoins = subscriptionsData.joins.filter(filterByDate);
    const filteredLefts = subscriptionsData.lefts.filter(filterByDate);
    const labels = getLabels(filteredJoins, filteredLefts);

    // ─────────────────────────────
    // Date formatter: 12 марта
    // ─────────────────────────────
    function formatDateLabel(dateStr) {
        return new Date(dateStr).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long"
        });
    }

    const formattedLabels = labels.map(formatDateLabel);

    // ─────────────────────────────
    // Gradient helper
    // ─────────────────────────────
    const ctx = document.getElementById("subscriptions-chart").getContext("2d");

    function createGradient(color) {
        const g = ctx.createLinearGradient(0, 0, 0, 200);
        g.addColorStop(0, color.replace("1)", "0.35)"));
        g.addColorStop(1, color.replace("1)", "0)"));
        return g;
    }

    const GREEN = "rgba(46, 204, 113, 1)";
    const RED   = "rgba(231, 76, 60, 1)";

    // ─────────────────────────────
    // Datasets
    // ─────────────────────────────
    const datasets = [];

    if (activeCategories.joins) {
        datasets.push({
            label: "Подписки",
            data: labels.map(l => filteredJoins.filter(j => j.date === l).length),
            borderColor: GREEN,
            backgroundColor: createGradient(GREEN, 0.22),
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointBackgroundColor: "#fff",
            pointBorderWidth: 2
        });
    }

    if (activeCategories.lefts) {
        datasets.push({
            label: "Отписки",
            data: labels.map(l => filteredLefts.filter(j => j.date === l).length),
            borderColor: RED,
            backgroundColor: createGradient(RED, 0.75),
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointBackgroundColor: "#fff",
            pointBorderWidth: 2
        });
    }

    // ─────────────────────────────
    // Destroy old chart
    // ─────────────────────────────
    if (subscriptionsChart) subscriptionsChart.destroy();

const dottedGridPlugin = {
    id: 'dottedGrid',
    beforeDraw(chart) {
        const ctx = chart.ctx;
        const { top, bottom, left, right } = chart.chartArea;

        ctx.save();
        ctx.fillStyle = "rgba(173, 216, 230, 0.6)"; // lightblue

        const gap = 10;

        for (let x = left; x < right; x += gap) {
            for (let y = top; y < bottom; y += gap) {
                ctx.fillRect(x, y, 1, 1);
            }
        }

        ctx.restore();
    }
};

const xAxisDotsPlugin = {
    id: 'xAxisDots',
    afterDraw(chart) {
        const ctx = chart.ctx;
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;

        ctx.save();

        // Для каждой активной категории
        chart.data.datasets.forEach(dataset => {
            if (!dataset.hidden) {
                ctx.fillStyle = dataset.borderColor || "#999";
                ctx.strokeStyle = "#fff"; // граница белая
                ctx.lineWidth = 2;
                ctx.beginPath();

                dataset.data.forEach((value, index) => {
                    if (index % 1 !== 0) return; // можно рисовать каждую точку

                    const x = xScale.getPixelForTick(index);
                    const y = yScale.getPixelForValue(value);

                    ctx.beginPath();
                    ctx.arc(x, y, 6, 0, Math.PI * 2); // radius 6px
                    ctx.fill();
                    ctx.stroke();
                });
            }
        });

        ctx.restore();
    }
};

const xAxisBottomDotsPlugin = {
    id: 'xAxisBottomDots',
    afterDraw(chart) {
        const ctx = chart.ctx;
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;

        ctx.save();

        ctx.fillStyle = "#292929"; // черные точки
        ctx.strokeStyle = "#fff"; // белая граница
        ctx.lineWidth = 4;

        chart.data.labels.forEach((label, index) => {
            if (index % 3 !== 0) return; // только отображаемые даты

            const x = xScale.getPixelForTick(index);
            const y = yScale.getPixelForValue(0);

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        ctx.restore();
    }
};


    subscriptionsChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: formattedLabels,
            datasets: datasets
        },
        plugins: [
            dottedGridPlugin,
            verticalHoverLine,
            xAxisBottomDotsPlugin
        ],
        options: {
            responsive: true,
            interaction: {
                intersect: false,
                mode: "index"
            },
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: {
                        drawTicks: false,
                        drawOnChartArea: false, // убираем вертикальные линии
                        drawBorder: true // нижняя линия будет видна через y-grid
                    },
                    ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0,
                        callback: (v, i) => i % 3 === 0 ? formattedLabels[i] : ""
                    }
                },
                y: {
                    ticks: {
                        display: false
                    },
                    grid: {
                        drawTicks: false,
                        drawOnChartArea: true,
                        drawBorder: false, // ← важно
                        color: ctx => ctx.tick.value === 0 ? 'lightgrey' : 'transparent'
                    },
                    border: {
                        display: false // ← ВОТ ЭТО УБИРАЕТ ЛИНИЮ СПРАВА
                    }
                }
            }
        }
    });

        
    function createGradient(color, alphaTop) {
        const g = ctx.createLinearGradient(0, 0, 0, 200);
        g.addColorStop(0, color.replace("1)", `${alphaTop})`));
        g.addColorStop(1, color.replace("1)", "0)"));
        return g;
    }
}

function formatDateLabel(dateStr) {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long"
    });
}

function applyDateRange(days) {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);

    document.getElementById("filter-from").valueAsDate = from;
    document.getElementById("filter-to").valueAsDate = to;

    renderSubscribersChart();
    renderChart();
    renderWheelList();
    renderSubscriptionsPosts();
}

document.querySelectorAll(".btn-filter").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".btn-filter")
            .forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const days = Number(btn.dataset.range);
        applyDateRange(days);
    };
});


function getLabels(joins, lefts) {
    const dates = [...joins.map(j => j.date), ...lefts.map(l => l.date)];
    const unique = [...new Set(dates)].sort();
    return unique;
}


function renderWheelList() {
    const container = document.getElementById("subscriptions-wheel");
    container.innerHTML = "";

    const joins = subscriptionsData.joins.filter(filterByDate);
    const lefts = subscriptionsData.lefts.filter(filterByDate);

    container.className = "sub-wheel";

    container.appendChild(
        createWheelColumn(`Подписки (${joins.length})`, joins)
    );

    container.appendChild(
        createWheelColumn(`Отписки (${lefts.length})`, lefts)
    );

    renderSubscriptionsStats(joins);
}

function createWheelColumn(title, data) {
    const col = document.createElement("div");
    col.className = "sub-column";

    const h = document.createElement("div");
    h.className = "sub-title";
    h.textContent = title;

    const list = document.createElement("div");
    list.className = "sub-scroll";

    data.forEach(e => {
        const row = document.createElement("div");
        row.className = "sub-item";
        row.innerHTML = `
            <div class="sub-label">
                ${e.username || e.nickname || e.actor_id}
            </div>
            <div class="sub-value">
                ${formatDateShort(e.date)}
            </div>
            <div class="sub-link">
                ${e.invite_title ? escapeSubHtml(e.invite_title) : ''}
            </div>
        `;
        list.appendChild(row);
    });

    col.appendChild(h);
    col.appendChild(list);
    return col;
}

function setSubscriptionsMinCountFilter(value) {
    const parsed = Number(value);
    subscriptionsMinCountFilter = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    renderWheelList();
}

function clearSubscriptionsMinCountFilter() {
    subscriptionsMinCountFilter = null;
    const input = document.getElementById("subscriptions-min-count");
    if (input) input.value = "";
    renderWheelList();
}

function buildJoinInviteStats(filteredJoins) {
    const map = new Map();

    filteredJoins.forEach(j => {
        const title = (j.invite_title || "").trim() || "Без названия";
        map.set(title, (map.get(title) || 0) + 1);
    });

    let stats = Array.from(map.entries()).map(([invite_title, count]) => ({
        invite_title,
        count,
    }));

    stats.sort((a, b) => b.count - a.count || a.invite_title.localeCompare(b.invite_title, "ru"));

    if (subscriptionsMinCountFilter) {
        stats = stats.filter(x => x.count >= subscriptionsMinCountFilter);
    }

    return stats;
}

function renderSubscriptionsStats(filteredJoins) {
    const box = document.getElementById("subscriptions-stats");
    if (!box) return;

    const stats = buildJoinInviteStats(filteredJoins);
    const filterValue = subscriptionsMinCountFilter ?? "";

    let html = `
      <div class="sub-stats">
        <div class="sub-stats-head">
          <h3>Статистика</h3>
          <div class="sub-stats-filter">
            <label for="subscriptions-min-count">Мин. подписок:</label>
            <input id="subscriptions-min-count" type="number" min="1" value="${filterValue}" onchange="setSubscriptionsMinCountFilter(this.value)">
            <button type="button" onclick="clearSubscriptionsMinCountFilter()">Сброс</button>
          </div>
        </div>
    `;

    if (!stats.length) {
        html += `<div class="sub-stats-empty">Нет данных за выбранный период</div></div>`;
        box.innerHTML = html;
        return;
    }

    html += `
      <table class="sub-stats-table">
        <thead>
          <tr>
            <th>Ссылка</th>
            <th>Подписки</th>
          </tr>
        </thead>
        <tbody>
    `;

    stats.forEach(row => {
        html += `
          <tr>
            <td>${escapeSubHtml(row.invite_title)}</td>
            <td>${row.count}</td>
          </tr>
        `;
    });

    html += `</tbody></table></div>`;
    box.innerHTML = html;
}

function getFilteredSubscriptionPosts() {
    const from = document.getElementById("filter-from").value;
    const to = document.getElementById("filter-to").value;

    return (subscriptionsData.posts || [])
        .filter(post => {
            if (!post.post_date) return false;
            const date = post.post_date.slice(0, 10);
            if (from && date < from) return false;
            if (to && date > to) return false;
            return true;
        })
        .sort((a, b) => (b.post_date || "").localeCompare(a.post_date || ""));
}

function formatPostDateTime(dateStr) {
    if (!dateStr) return "Без даты";
    return new Date(dateStr).toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function renderSubscriptionsPosts() {
    const box = document.getElementById("subscriptions-posts");
    if (!box) return;

    const posts = getFilteredSubscriptionPosts();

    let html = `
      <div class="subscriptions-posts-block">
        <div class="subscriptions-posts-head">
          <div>
            <div class="subscriptions-chart-title">Посты канала</div>
            <div class="subscriptions-posts-subtitle">Кликните на пост, чтобы открыть график охвата и реакций</div>
          </div>
        </div>
    `;

    if (!posts.length) {
        html += `<div class="subscriptions-posts-empty">Нет постов за выбранный период</div></div>`;
        box.innerHTML = html;
        return;
    }

    html += `<div class="subscriptions-posts-list">`;

    posts.forEach(post => {
        const postTitle = post.post_title || `Пост #${post.message_id}`;
        html += `
          <button type="button" class="subscriptions-post-card" onclick="openPostMetricsModal(${post.message_id})">
            <div class="subscriptions-post-card-head">
              <div class="subscriptions-post-card-title">${escapeSubHtml(postTitle)}</div>
              <div class="subscriptions-post-card-date">${escapeSubHtml(formatPostDateTime(post.post_date))}</div>
            </div>
            <div class="subscriptions-post-card-meta">
              <div class="subscriptions-post-chip">Охват: ${post.views}</div>
              <div class="subscriptions-post-chip">Реакции: ${post.reactions_count}</div>
            </div>
          </button>
        `;
    });

    html += `</div></div>`;
    box.innerHTML = html;
}

async function openPostMetricsModal(messageId) {
    if (!selectedChat) return;

    const post = (subscriptionsData.posts || []).find(item => item.message_id === messageId);
    const modal = document.getElementById("post-metrics-modal");
    const subtitle = document.getElementById("post-metrics-modal-subtitle");

    if (!modal || !subtitle || !post) return;

    subtitle.textContent = `${post.post_title || `Пост #${messageId}`}${post.post_date ? ` • ${formatPostDateTime(post.post_date)}` : ""}`;
    modal.style.display = "flex";

    try {
        let metrics = [];

        if (selectedChat.userbot_id === "demo") {
            metrics = demoPostMetricsMap.get(messageId) || [];
        } else {
            const response = await fetch(
                `/userbots/${selectedChat.userbot_id}/channels/${selectedChat.chat_id}/posts/${messageId}/metrics?limit=500`
            );

            if (!response.ok) {
                throw new Error(`Ошибка загрузки metrics: ${response.status}`);
            }

            metrics = await response.json();
        }

        renderPostMetricsChart(metrics);
    } catch (err) {
        console.error("Ошибка загрузки истории поста:", err);
        showToast("Не удалось загрузить историю поста", "warning");
        renderPostMetricsChart([]);
    }
}

function closePostMetricsModal() {
    const modal = document.getElementById("post-metrics-modal");
    if (modal) {
        modal.style.display = "none";
    }

    if (postMetricsChart) {
        postMetricsChart.destroy();
        postMetricsChart = null;
    }
}

function getMetricPercentDelta(baseValue, nextValue) {
    const base = Number(baseValue) || 0;
    const next = Number(nextValue) || 0;
    const delta = Math.abs(next - base);

    return base > 0 ? (delta / base) * 100 : (delta > 0 ? 100 : 0);
}

function makePostMetricPoint(item, valueKey) {
    return {
        captured_at: item.captured_at,
        value: Number(item[valueKey]) || 0
    };
}

function compressPostMetricPoints(points, valueKey, minPercentDelta = 10) {
    if (!Array.isArray(points) || !points.length) return [];

    const result = [makePostMetricPoint(points[0], valueKey)];

    for (let i = 1; i < points.length; i++) {
        const point = makePostMetricPoint(points[i], valueKey);

        if (result.length === 1) {
            result.push(point);
            continue;
        }

        const previousFixedPoint = result[result.length - 2];
        const lastVisiblePoint = result[result.length - 1];
        const percentDelta = getMetricPercentDelta(previousFixedPoint.value, point.value);

        if (percentDelta < minPercentDelta) {
            lastVisiblePoint.captured_at = point.captured_at;
            lastVisiblePoint.value = point.value;
            continue;
        }

        result.push(point);
    }

    return result;
}

function buildPostMetricsChartData(points) {
    const compressedViews = compressPostMetricPoints(points, "views");
    const compressedReactions = compressPostMetricPoints(points, "reactions_count");
    const labelsMap = new Map();

    [...compressedViews, ...compressedReactions].forEach(item => {
        labelsMap.set(item.captured_at, null);
    });

    const labels = Array.from(labelsMap.keys()).sort((a, b) => String(a || "").localeCompare(String(b || "")));
    const buildDataset = compressedPoints => {
        const valuesByDate = new Map(compressedPoints.map(item => [item.captured_at, item.value]));
        return labels.map(label => valuesByDate.has(label) ? valuesByDate.get(label) : null);
    };

    return {
        labels: labels.map(item => new Date(item).toLocaleString("ru-RU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        })),
        views: buildDataset(compressedViews),
        reactions: buildDataset(compressedReactions)
    };
}

function renderPostMetricsChart(metrics) {
    const canvas = document.getElementById("post-metrics-chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const points = Array.isArray(metrics) ? metrics.slice().sort((a, b) => {
        return String(a.captured_at || "").localeCompare(String(b.captured_at || ""));
    }) : [];

    const chartData = buildPostMetricsChartData(points);

    if (postMetricsChart) {
        postMetricsChart.destroy();
    }

    postMetricsChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: "Охват",
                    data: chartData.views,
                    yAxisID: "views",
                    borderColor: "rgba(52, 152, 219, 1)",
                    backgroundColor: "rgba(52, 152, 219, 0.14)",
                    fill: false,
                    tension: 0.3,
                    spanGaps: true,
                    pointRadius: 0,
                    pointHoverRadius: 0
                },
                {
                    label: "Реакции",
                    data: chartData.reactions,
                    yAxisID: "reactions",
                    borderColor: "rgba(46, 204, 113, 1)",
                    backgroundColor: "rgba(46, 204, 113, 0.14)",
                    fill: false,
                    tension: 0.3,
                    spanGaps: true,
                    pointRadius: 0,
                    pointHoverRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                intersect: false,
                mode: "index"
            },
            plugins: {
                legend: {
                    display: true,
                    position: "top"
                },
                tooltip: {
                    callbacks: {
                        label: context => `${context.dataset.label}: ${context.raw ?? "—"}`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: "rgba(0,0,0,0.05)"
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8
                    }
                },
                views: {
                    type: "linear",
                    position: "left",
                    beginAtZero: true,
                    grid: {
                        color: "rgba(0,0,0,0.05)"
                    }
                },
                reactions: {
                    type: "linear",
                    position: "right",
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}


document.querySelectorAll(".btn-category").forEach(btn => {
    btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        activeCategories[type] = !activeCategories[type];
        btn.classList.toggle("active", activeCategories[type]);
        renderChart();
        renderWheelList();
    });
});


document.getElementById("filter-from").addEventListener("change", () => {
    renderSubscribersChart();
    renderChart();
    renderWheelList();
    renderSubscriptionsPosts();
});
document.getElementById("filter-to").addEventListener("change", () => {
    renderSubscribersChart();
    renderChart();
    renderWheelList();
    renderSubscriptionsPosts();
});
document.addEventListener("DOMContentLoaded", () => {
    initBroadcastMediaUI();
    initBroadcastEditorUI();
    const postMetricsModal = document.getElementById("post-metrics-modal");
    if (postMetricsModal) {
        postMetricsModal.addEventListener("click", e => {
            if (e.target === postMetricsModal) {
                closePostMetricsModal();
            }
        });
    }
});


function showToast(message, type = "info", timeout = 4000) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    const remove = () => toast.remove();
    toast.onclick = remove;

    setTimeout(remove, timeout);
}


function renderFakeManagers() {
    const tab = document.getElementById("tab-managers");
    if (!tab) return;

    if (tab.querySelector(".manager-card-full")) return;

    showToast("Менеджеры: демо-режим", "info");

    const fake = [
        {name: "Иван Петров", email: "ivan@test.local"},
        {name: "Мария Смирнова", email: "maria@test.local"},
    ];

    fake.forEach(m => {
        const el = document.createElement("section");
        el.className = "card manager-card-full";
        el.innerHTML = `
            <div class="manager-header">
                <div class="manager-avatar">${m.name[0]}</div>
                <div class="manager-info">
                    <div class="manager-name">${m.name}</div>
                    <div class="manager-email">${m.email}</div>
                </div>
            </div>
            <p class="empty-small">Демо-данные</p>
        `;
        tab.appendChild(el);
    });
}

function openBindBotModal(userbotId) {
    document.getElementById("bind-userbot-id").value = userbotId;
    document.getElementById("bind-bot-modal").style.display = "flex";
    loadBotsForBind(userbotId);
}

function closeBindBotModal() {
    document.getElementById("bind-bot-modal").style.display = "none";
}

function renderFakeUserbots() {
    const tab = document.getElementById("tab-userbots");
    if (!tab) return;

    if (tab.querySelector(".bot-card")) return; // реальные есть

    showToast("Юзер-боты: демо-данные", "info");

    const fake = [
        {id: "fake1", name: "DemoBot", username: "@demo_bot", active: true},
        {id: "fake2", name: "TestBot", username: "@test_bot", active: false},
    ];

    const container = tab.querySelector(".tuna-block");

    fake.forEach(bot => {
        const el = document.createElement("section");
        el.className = "card bot-card";
        el.innerHTML = `
            <div class="bot-head">
                <div>
                    <div class="bot-name">${bot.name}</div>
                    <div class="bot-token">${bot.username}</div>
                </div>
                <div class="bot-actions">
                    <span style="color:${bot.active ? "green" : "gray"}">
                        ${bot.active ? "Активен" : "Выключен"}
                    </span>
                </div>
            </div>
        `;
        container.appendChild(el);
    });
}


document.addEventListener("DOMContentLoaded", () => {
    renderFakeUserbots();
    renderFakeManagers();
});


function formatDateShort(dateStr) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
}

function updateEditorToolbarState() {
    const editor = document.getElementById("broadcast-editor");
    if (document.activeElement !== editor) {
        document.querySelectorAll(".editor-toolbar button")
            .forEach(b => b.classList.remove("active"));
        return;
    }

    // --- стандартные режимы ---
    const states = {
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
    };

    document.querySelectorAll(".editor-toolbar button").forEach(btn => {
        const cmd = btn.dataset.cmd;
        btn.classList.toggle("active", !!states[cmd]);
    });

    // --- кастомные режимы (Range API) ---
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    let node = sel.anchorNode;
    if (node.nodeType === 3) node = node.parentElement;

    const hasParent = (el, selector) => el && el.closest(selector);

    toggleToolbar("code", hasParent(node, "code"));
    toggleToolbar("quote", hasParent(node, "blockquote"));
    toggleToolbar("spoiler", hasParent(node, "span[data-spoiler]"));
}

function toggleToolbar(cmd, enabled) {
    const btn = document.querySelector(`.editor-toolbar button[data-cmd="${cmd}"]`);
    if (!btn) return;
    btn.classList.toggle("active", !!enabled);
}

function escapeMarkdownV2(text) {
    return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

const addBotForm = document.getElementById("add-bot-form");

if (addBotForm) {
    addBotForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const tokenInput = document.getElementById("bot-token-input");
        const token = tokenInput.value.trim();

        if (!token) {
            showToast("Введите токен бота", "warning");
            return;
        }

        showPreloader();

        try {
            const fd = new FormData();
            fd.append("bot_token", token);
            fd.append("user_id", userId);

            const res = await fetch("/bots/", {
                method: "POST",
                body: fd
            });


            let data = null;
            try {
                data = await res.json();
            } catch {
            }

            if (!res.ok) {
                let errMsg = "Неверный токен бота";

                if (typeof data?.detail === "string") {
                    errMsg = data.detail;
                } else if (Array.isArray(data?.detail)) {
                    errMsg = data.detail.map(e => e.msg).join(", ");
                }

                showToast(errMsg, "error");
                return;
            }

            showToast("Бот успешно добавлен ✅", "success");

            // перезагружаем страницу ТОЛЬКО при успехе
            setTimeout(() => location.reload(), 800);

        } catch (e) {
            console.error(e);
            showToast("Ошибка сети или сервера", "error");
        } finally {
            hidePreloader();
        }
    });
}

