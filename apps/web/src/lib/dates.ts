const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const monthYearFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
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
  });

  return `${datePart} · ${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
}
