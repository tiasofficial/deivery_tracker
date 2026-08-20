import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Trip } from '../types';

export const useTrips = (role: 'VENDOR' | 'DRIVER') => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/trips?role=${role}`);
      setTrips(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return { trips, loading, error, refetch: fetchTrips };
};
