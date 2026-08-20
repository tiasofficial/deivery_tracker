import colors from '../constants/colors';
import { TripStatus, StopStatus } from '../types';

export const getTripStatusColor = (status: TripStatus) => {
  switch (status) {
    case 'COMPLETED':
    case 'SETTLED':
      return colors.success;
    case 'ASSIGNED':
      return colors.primary;
    case 'EN_ROUTE':
    case 'IN_PROGRESS':
      return colors.secondary;
    case 'CANCELLED':
      return colors.error;
    default:
      return colors.textSecondary;
  }
};

export const getStopStatusColor = (status: StopStatus) => {
  switch (status) {
    case 'COLLECTED':
      return colors.success;
    case 'DELIVERED':
      return colors.secondary;
    case 'ARRIVED':
      return colors.primary;
    case 'SKIPPED':
      return colors.error;
    default:
      return colors.textSecondary;
  }
};
