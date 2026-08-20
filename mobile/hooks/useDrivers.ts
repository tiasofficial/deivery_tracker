import { useState, useEffect, useCallback } from 'react';
import { driverService } from '../services/driver.service';
import { User } from '../types';

export function useDrivers() {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await driverService.getAll();
      setDrivers(res.data.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  return { drivers, loading, error, refetch: fetchDrivers };
}
