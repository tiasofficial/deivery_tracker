import { useState, useEffect, useCallback } from 'react';
import { merchantService } from '../services/merchant.service';
import { Merchant } from '../types';

export function useMerchants() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMerchants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await merchantService.getMerchants();
      setMerchants(res.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load merchants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  return { merchants, loading, error, refetch: fetchMerchants };
}
