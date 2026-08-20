import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analytics.service';
import { AnalyticsSummary } from '../types';

export function useAnalytics(period: 'today' | 'week' | 'month' = 'today') {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [driverStats, setDriverStats] = useState<any[]>([]);
  const [boxStats, setBoxStats] = useState<any[]>([]);
  const [tripStats, setTripStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, collectionsRes, driversRes, boxesRes, tripsRes] =
        await Promise.all([
          analyticsService.getSummary(period),
          analyticsService.getCollections(),
          analyticsService.getDriverStats(period),
          analyticsService.getBoxStats(period),
          analyticsService.getTrips(),
        ]);
      setSummary(summaryRes.data.data);
      setCollections(collectionsRes.data.data || []);
      setDriverStats(driversRes.data.data || []);
      setBoxStats(boxesRes.data.data || []);
      setTripStats(tripsRes.data.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { summary, collections, driverStats, boxStats, tripStats, loading, error, refetch: fetchAll };
}
