import type { Event } from '@rebase/types';

type EventStatusInput = Pick<Event, 'status' | 'startAt' | 'endAt' | 'registrationUrl'>;

const toTimestamp = (value: string | undefined) => {
  const timestamp = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : undefined;
};

export function resolvePublicEventStatus(event: EventStatusInput, now = Date.now()) {
  const startTime = toTimestamp(event.startAt);
  const endTime = toTimestamp(event.endAt);
  const isPastByTime = typeof endTime === 'number' ? endTime < now : typeof startTime === 'number' ? startTime < now : false;
  const isPast = isPastByTime || event.status === 'past';
  const canRegister = !isPast && Boolean(event.registrationUrl);

  return {
    isPast,
    isUpcoming: !isPast,
    canRegister,
    statusLabel: isPast ? '往期活动' : '即将举行',
    detailStatusLabel: isPast ? '活动归档' : '即将举办',
    actionLabel: canRegister ? '立即报名' : isPast ? '查看回顾' : '查看详情',
    detailActionLabel: canRegister ? '打开报名链接' : isPast ? '查看历史活动链接' : '查看活动详情',
  };
}
