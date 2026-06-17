import webpush from "web-push";

const DAY_MS = 86400000;

export default {
  async scheduled(controller, env, ctx) {
    const records = await env.DB.prepare(
      `
        SELECT
          installation_id,
          endpoint,
          p256dh,
          auth,
          salary_day,
          lead_days,
          reminder_hour,
          timezone,
          last_sent_key
        FROM salary_push_subscriptions
        WHERE enabled = 1
      `
    ).all();

    if (!records?.results?.length) {
      return;
    }

    const subject = env.VAPID_SUBJECT || "mailto:no-reply@example.com";
    webpush.setVapidDetails(subject, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

    const jobs = records.results.map((entry) => processEntry(entry, env));
    ctx.waitUntil(Promise.all(jobs));
  }
};

async function processEntry(entry, env) {
  const now = new Date();
  const local = getLocalParts(now, entry.timezone || "Asia/Shanghai");
  if (local.hour < Number(entry.reminder_hour || 9)) {
    return;
  }

  const targetSalary = getNextSalaryParts(local, Number(entry.salary_day || 15));
  const daysUntil = daysBetween(local, targetSalary);

  if (daysUntil !== Number(entry.lead_days || 0)) {
    return;
  }

  const cycleKey = toCycleKey(targetSalary);
  if (cycleKey === entry.last_sent_key) {
    return;
  }

  const body = buildReminderBody(daysUntil, targetSalary);
  const payload = JSON.stringify({
    title: "发薪提醒",
    body,
    tag: `salary-${cycleKey}`,
    url: env.APP_URL || "/"
  });

  try {
    await webpush.sendNotification(
      {
        endpoint: entry.endpoint,
        keys: {
          p256dh: entry.p256dh,
          auth: entry.auth
        }
      },
      payload
    );

    await env.DB.prepare(
      `
        UPDATE salary_push_subscriptions
        SET last_sent_key = ?, last_sent_at = ?, updated_at = ?
        WHERE installation_id = ?
      `
    )
      .bind(cycleKey, new Date().toISOString(), new Date().toISOString(), entry.installation_id)
      .run();
  } catch (error) {
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      await env.DB.prepare(
        `
          UPDATE salary_push_subscriptions
          SET enabled = 0, updated_at = ?
          WHERE installation_id = ?
        `
      )
        .bind(new Date().toISOString(), entry.installation_id)
        .run();
      return;
    }

    throw error;
  }
}

function getLocalParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23"
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour)
  };
}

function getNextSalaryParts(local, salaryDay) {
  const candidate = {
    year: local.year,
    month: local.month,
    day: salaryDay
  };

  if (local.day <= salaryDay) {
    return candidate;
  }

  const rolled = new Date(Date.UTC(local.year, local.month, 1));
  return {
    year: rolled.getUTCFullYear(),
    month: rolled.getUTCMonth() + 1,
    day: salaryDay
  };
}

function daysBetween(start, end) {
  const startUtc = Date.UTC(start.year, start.month - 1, start.day);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  return Math.round((endUtc - startUtc) / DAY_MS);
}

function toCycleKey(parts) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function buildReminderBody(daysUntil, targetSalary) {
  if (daysUntil === 0) {
    return `今天是发薪日，记得留意 ${targetSalary.month} 月工资到账情况。`;
  }

  return `${daysUntil} 天后是发薪日，建议提前检查工资卡、账单和自动扣款安排。`;
}
