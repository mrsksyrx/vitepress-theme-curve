import dayjs from "dayjs";
import { onBeforeUnmount, onMounted, ref } from "vue";

/**
 * 提供一个“仅客户端生效”的当前时间源。
 *
 * 用于所有会随当前日期/时间变化的展示（如：已过多少天、还剩多少天、
 * 多少天前等）。SSR 阶段不会取真实当前时间，避免把构建时刻的时间
 * 固化进静态 HTML / 缓存中；客户端挂载后由浏览器本地时钟驱动刷新。
 *
 * @param {Object} options
 * @param {number} options.interval 刷新间隔（毫秒），默认 1000
 * @returns {{ now: import("vue").Ref<import("dayjs").Dayjs | null>, isMounted: import("vue").Ref<boolean> }}
 *   now 在 SSR 阶段为 null，挂载后为浏览器当前时间
 */
export const useClientNow = ({ interval = 1000 } = {}) => {
  const now = ref(null);
  const isMounted = ref(false);
  let timer = null;

  const updateNow = () => {
    now.value = dayjs();
  };

  onMounted(() => {
    isMounted.value = true;
    updateNow();
    timer = setInterval(updateNow, interval);
  });

  onBeforeUnmount(() => {
    clearInterval(timer);
    timer = null;
  });

  return { now, isMounted };
};

/**
 * 计算时间戳对应的相对日期文案（仅在浏览器端基于当前时间计算）。
 * 规则：
 * - 今天：今日内
 * - 昨天：1天前
 * - 7 天内（过去）：n天前
 * - 7 天内（未来）：n天后
 * - 更早/更远：月/日（当年）或 年/月/日（更早）
 *
 * @param {number|string|Date} timestamp 目标时间；优先传 `post.dateYMD`（"YYYY-MM-DD"，
 *   dayjs 按本地零点解析，与访客时区无关），旧索引可传 epoch 毫秒
 * @param {import("dayjs").Dayjs | null} now 当前时间（来自 useClientNow），为 null 时返回 ""
 * @returns {string}
 */
export const formatTimestampAt = (timestamp, now) => {
  if (!now) return "";
  const targetDate = dayjs(timestamp);
  if (!targetDate.isValid()) return "";
  const today = now.startOf("day");
  const targetDay = targetDate.startOf("day");
  const difference = today.diff(targetDay, "day");
  if (difference === 0) return "今日内";
  // difference < 0 表示目标时间在未来，对称显示「n天后」
  if (difference < 0 && -difference < 7) return `${-difference}天后`;
  if (difference > 0 && difference < 7) return `${difference}天前`;
  if (targetDate.year() === now.year()) {
    return `${targetDate.month() + 1}/${targetDate.date()}`;
  }
  return `${targetDate.year()}/${targetDate.month() + 1}/${targetDate.date()}`;
};

/**
 * 计算给定日期距离当前日期已过多少天（日历天）。
 *
 * @param {number|string|Date} timestamp 目标时间；优先传 `post.dateYMD`
 * @param {import("dayjs").Dayjs | null} now 当前时间（来自 useClientNow），为 null 时返回 null
 * @returns {number|null}
 */
export const daysPassedAt = (timestamp, now) => {
  if (!now) return null;
  const target = dayjs(timestamp);
  if (!target.isValid()) return null;
  return now.startOf("day").diff(target.startOf("day"), "day");
};

/**
 * 解析事件日期。支持完整日期 `2025-03-24` 与无年份的每年循环项 `09-07`。
 * 无年份写法用 date 面板构造，保证落在**本地**那一天；也能避免
 * `dayjs("09-07")` 被解析成 2001 年这种意外。非法日期（如 02-30、非闰年的 02-29）返回 null。
 *
 * @param {string} value
 * @param {import("dayjs").Dayjs | null} base 无年份写法的基准日（通常为 now）
 * @returns {import("dayjs").Dayjs | null}
 */
export const parseEventDate = (value, base) => {
  const str = String(value ?? "").trim();
  const monthDay = /^(\d{1,2})-(\d{1,2})$/.exec(str);
  if (monthDay) {
    const month = Number(monthDay[1]);
    const day = Number(monthDay[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const ref = base || dayjs();
    // 先把日固定到 1 再设月份，避免基准日处于月末（如 31 号）时
    // .month(month - 1) 在原生 Date 层进位到次月，导致合法日期落错月份。
    const parsed = ref
      .startOf("day")
      .date(1)
      .month(month - 1)
      .date(day)
      .startOf("day");
    // 非法日期（如 02-30）会被 Date 层进位到下个月，这里按无效处理
    if (parsed.month() !== month - 1 || parsed.date() !== day) return null;
    return parsed.isValid() ? parsed : null;
  }
  const parsed = dayjs(str);
  return parsed.isValid() ? parsed : null;
};

/**
 * 加 N 年并钳制月末溢出：部分日期库对 2/29 加一年会进位到 3/1，
 * 这里钳回目标年原月最后一天（2/28 或 2/29）。当前 dayjs 已自带钳制，
 * 此函数作防御性收口，保证 Timing / LiveDate 行为一致。
 *
 * @param {import("dayjs").Dayjs} date
 * @param {number} years
 * @returns {import("dayjs").Dayjs}
 */
export const addYearsClamped = (date, years = 1) => {
  const month = date.month();
  const next = date.add(years, "year");
  // 月份变了说明日号溢出进位（如 2/29 → 3/1），date(0) 即上月最后一天
  return next.month() === month ? next : next.date(0);
};
