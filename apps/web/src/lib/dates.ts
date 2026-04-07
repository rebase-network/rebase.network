const DEFAULT_TIME_ZONE = 'Asia/Shanghai';

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: DEFAULT_TIME_ZONE,
});

const monthYearFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  timeZone: DEFAULT_TIME_ZONE,
});

export function formatDate(input: string) {
  return dateFormatter.format(new Date(input));
}

export function formatMonthYear(input: string) {
  return monthYearFormatter.format(new Date(input));
}

export function formatEventWindow(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  const datePart = dateFormatter.format(start);
  const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: DEFAULT_TIME_ZONE,
  });

  return `${datePart} · ${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
}
