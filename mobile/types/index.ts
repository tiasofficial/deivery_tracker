export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'VENDOR' | 'DRIVER';
  vehicleNo?: string;
  vendorId?: string;
  createdAt: string;
}

export interface Merchant {
  id: string;
  name: string;
  address: string;
  phone?: string;
  vendorId: string;
}

export interface BoxType {
  id: string;
  name: string;
  description?: string;
  vendorId: string;
}

export type TripStatus = 'ASSIGNED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'SETTLED' | 'CANCELLED';
export type StopStatus = 'PENDING' | 'ARRIVED' | 'DELIVERED' | 'COLLECTED' | 'SKIPPED';

export interface RouteStopBox {
  id: string;
  boxTypeId: string;
  boxType: BoxType;
  quantity: number;
}

export interface RouteStop {
  id: string;
  tripId: string;
  merchantId: string;
  merchant: Merchant;
  stopOrder: number;
  status: StopStatus;
  collectedAmount?: number;
  collectedAt?: string;
  skipped: boolean;
  skipReason?: string;
  arrivedAt?: string;
  deliveredAt?: string;
  boxes: RouteStopBox[];
}

export interface Trip {
  id: string;
  vendorId: string;
  driverId: string;
  driver: User;
  tripDate: string;
  transportFee: number;
  status: TripStatus;
  totalCollected?: number;
  isSettled: boolean;
  notes?: string;
  stops: RouteStop[];
  createdAt: string;
}

export interface Settlement {
  id: string;
  tripId: string;
  trip: Trip;
  driverId: string;
  vendorId: string;
  amount: number;
  settledAt: string;
  notes?: string;
}

export interface AnalyticsSummary {
  totalTrips: number;
  totalCollection: number;
  unsettledBalance: number;
  activeDrivers: number;
}
