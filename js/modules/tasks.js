import { api } from "../api.js";
import { escapeHtml } from "../dom.js";

let refreshTimer = null;

const statusLabels = {
  queued: "В очереди",
  running: "В работе",
  completed: "Готово",
  stopped: "Остановлена",
  failed: "Ошибка",
};

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("ru-RU");
}

function jobName(job) {
  if (job.name) return job.name;
  if (job.type === "apply_rule_to_all") return `Применение правила «${job.rule_name || `#${job.rule_id}`}» ко всем`;
  if (["push_broadcast", "push_notification", "send_push_notification", "notification_broadcast"].includes(job.type)) {
    return `Рассылка «${job.title || job.message_title || "без темы"}»`;
  }
  return job.type || "Задача";
}

function jobResult(job) {
  if (["push_broadcast", "push_notification", "send_push_notification", "notification_broadcast"].includes(job.type)) {
    return `Отправлено ${job.sent || job.applied || 0}, проверено ${job.total || job.recipients || job.checked || 0}`;
  }
  return `Переведено ${job.applied || 0}, проверено ${job.total || job.checked || 0}`;
}

function progressBar(job) {
  const progress = Math.max(0, Math.min(100, Number(job.progress || 0)));
  return `
    <div class="task-progress">
      <progress value="${progress}" max="100"></progress>
      <span>${progress}%</span>
    </div>
  `;
}

function isPushJob(job) {
  return ["push_broadcast", "push_notification", "send_push_notification", "notification_broadcast"].includes(job.type);
}

function stopButton(job) {
  if (!["queued", "running"].includes(job.status)) return "";
  const type = isPushJob(job) ? "push" : "worker";
  return `<button type="button" class="client-delete-button" data-task-stop="${escapeHtml(job.id)}" data-task-type="${type}">Остановить</button>`;
}

function taskRows(jobs) {
  return jobs.length
    ? jobs.map((job) => `
      <tr>
        <td>${escapeHtml(jobName(job))}</td>
        <td>${escapeHtml(statusLabels[job.status] || job.status || "-")}</td>
        <td>${progressBar(job)}</td>
        <td>${escapeHtml(jobResult(job))}</td>
        <td>${escapeHtml(job.message || "-")}</td>
        <td>${escapeHtml(formatDate(job.updated_at))}</td>
        <td>${stopButton(job)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="7">Фоновых задач пока нет.</td></tr>`;
}

async function loadJobs(orgId) {
  const [workerJobs, notificationJobs] = await Promise.all([
    api.workerJobs(orgId).catch(() => []),
    (api.pushNotificationJobs?.(orgId) || Promise.resolve([])).catch(() => []),
  ]);
  return [...workerJobs, ...notificationJobs].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
}

export async function tasks(ctx) {
  const jobs = await loadJobs(ctx.org.id);

  return `
    <section class="panel" data-tasks>
      <h2>Задачи</h2>
      <table>
        <thead>
          <tr>
            <th>Задача</th>
            <th>Статус</th>
            <th>Прогресс</th>
            <th>Результат</th>
            <th>Сообщение</th>
            <th>Обновлено</th>
            <th></th>
          </tr>
        </thead>
        <tbody data-task-jobs>${taskRows(jobs)}</tbody>
      </table>
    </section>
  `;
}

export function bindTasks(root, ctx) {
  let isRefreshing = false;
  if (refreshTimer) window.clearInterval(refreshTimer);
  root.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-task-stop]");
    if (!button) return;
    button.disabled = true;
    try {
      if (button.dataset.taskType === "push") await api.stopPushNotificationJob(button.dataset.taskStop, ctx.org.id);
      else await api.stopWorkerJob(button.dataset.taskStop, ctx.org.id);
      const tableBody = root.querySelector("[data-task-jobs]");
      if (tableBody) tableBody.innerHTML = taskRows(await loadJobs(ctx.org.id));
    } catch (error) {
      button.disabled = false;
      console.error(error);
    }
  });
  refreshTimer = window.setInterval(async () => {
    const tableBody = root.querySelector("[data-task-jobs]");
    if (!location.pathname.includes("/tasks") || !tableBody || isRefreshing) return;
    isRefreshing = true;
    try {
      tableBody.innerHTML = taskRows(await loadJobs(ctx.org.id));
    } finally {
      isRefreshing = false;
    }
  }, 2000);
}
