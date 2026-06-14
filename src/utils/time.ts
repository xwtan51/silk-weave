import i18n from '../i18n';

export function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) {
    const h = Math.floor(diff / 3600000);
    return i18n.t('common.hoursAgo', { h });
  }
  if (days < 7) return i18n.t('common.daysAgo', { d: days });
  const w = Math.floor(days / 7);
  return i18n.t('common.weeksAgo', { w });
}
