import { format, parseISO, isToday, isYesterday } from 'date-fns';

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const date = parseISO(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd MMM yyyy');
};

export const formatTime = (dateString: string | undefined): string => {
  if (!dateString) return '';
  return format(parseISO(dateString), 'hh:mm a');
};
