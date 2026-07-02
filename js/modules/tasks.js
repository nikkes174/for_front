import { api } from "../api.js";
import { escapeHtml } from "../dom.js";

let refreshTimer = null;

const statusLabels = {
  queued: "В очереди",
  running: "В работе",
  completed: "Готово",
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
  return job.type || "Задача";
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

function taskRows(jobs) {
  return jobs.length
    ? jobs.map((job) => `
      <tr>
        <td>${escapeHtml(jobName(job))}</td>
        <td>${escapeHtml(statusLabels[job.status] || job.status || "-")}</td>
        <td>${progressBar(job)}</td>
        <td>${escapeHtml(`Переведено ${job.applied || 0}, проверено ${job.total || job.checked || 0}`)}</td>
        <td>${escapeHtml(job.message || "-")}</td>
        <td>${escapeHtml(formatDate(job.updated_at))}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="6">Фоновых задач пока нет.</td></tr>`;
}

export async function tasks(ctx) {
  const jobs = await api.workerJobs(ctx.org.id).catch(() => []);

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
  refreshTimer = window.setInterval(async () => {
    const tableBody = root.querySelector("[data-task-jobs]");
    if (!location.pathname.includes("/tasks") || !tableBody || isRefreshing) return;
    isRefreshing = true;
    try {
      tableBody.innerHTML = taskRows(await api.workerJobs(ctx.org.id).catch(() => []));
    } finally {
      isRefreshing = false;
    }
  }, 2000);
}
