<script setup>
import dayjs from "dayjs";
import { addYearsClamped, parseEventDate, useClientNow } from "@/utils/useClientNow.mjs";

const { theme } = useData();

// 相对时间基于浏览器本地时钟实时计算
const { now } = useClientNow();

const normalizeItem = (item) => ({
  icon: item?.icon || "💌",
  name: item?.name || "",
  event: item?.event || "",
  date: item?.date || "",
  yearly: Boolean(item?.yearly),
  includeStart: Boolean(item?.includeStart),
});

const timingItems = computed(() => {
  const timing = theme.value.aside.timing;
  if (!timing?.enable) return [];

  if (Array.isArray(timing.items) && timing.items.length > 0) {
    return timing.items.map(normalizeItem).filter((item) => item.date && (item.name || item.event));
  }

  if (timing.date && (timing.name || timing.event)) {
    return [normalizeItem(timing)];
  }

  return [];
});

const getDisplayDate = (item) => {
  // 与 LiveDate 同一套解析，避免 dayjs("02-29")→3/1 之类的口径分裂
  const target = parseEventDate(item.date, now.value || dayjs());
  if (!target || !now.value) return null;
  if (!item.yearly) return target;

  const today = now.value.startOf("day");
  let nextDate = target.startOf("day");
  while (nextDate.isBefore(today)) {
    nextDate = addYearsClamped(nextDate);
  }
  return nextDate;
};

// 三态：未来 / 当天 / 过去。当天不能再走 isAfter(now)（零点 vs 当前时刻恒 false）
const dayState = (item) => {
  const target = getDisplayDate(item);
  if (!target || !now.value) return "past";
  const diff = target.startOf("day").diff(now.value.startOf("day"), "day");
  return diff > 0 ? "future" : diff === 0 ? "today" : "past";
};

const getMode = (item) => (item.yearly ? "days-until" : "days-gap");
</script>

<template>
  <div v-if="timingItems.length" class="timing-card s-card">
    <div
      v-for="(item, index) in timingItems"
      :key="`${item.name}-${item.event}-${index}`"
      class="timing-item"
    >
      <p class="custom-text">
        <span class="item-icon">{{ item.icon }}</span>
        <span v-if="item.name" class="title-name">{{ item.name }}</span>
        <span v-if="item.event" class="event-name">{{ item.event }}</span>
        <span class="state-text">
          {{
            dayState(item) === "future" ? "还有" : dayState(item) === "today" ? "就是今天" : "已经"
          }}
        </span>
        <template v-if="dayState(item) !== 'today'">
          <span class="day-number">
            <LiveDate
              :mode="getMode(item)"
              :date="item.date"
              :yearly="item.yearly"
              :include-start="item.includeStart"
            />
          </span>
          <span class="state-text">天</span>
        </template>
      </p>
    </div>
  </div>
</template>

<style scoped>
.timing-card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.timing-item {
  width: 100%;
}

.timing-item + .timing-item {
  padding-top: 0.7rem;
  border-top: 1px solid var(--main-card-border);
}

.item-icon {
  font-size: 1rem;
  line-height: 1;
  margin-right: 0.45rem;
}

.title-name {
  font-weight: bold;
  font-size: 1rem;
  margin-right: 0.35rem;
}

.event-name {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--main-color);
  margin-right: 0.35rem;
}

.custom-text {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  font-size: 1rem;
  color: var(--main-font-color);
  text-align: center;
  line-height: 1.5;
  margin: 0;
}

.state-text {
  opacity: 0.85;
}

.day-number {
  font-size: 1.2em;
  font-weight: 800;
  color: var(--main-color);
  margin: 0 0.25rem;
}
</style>
