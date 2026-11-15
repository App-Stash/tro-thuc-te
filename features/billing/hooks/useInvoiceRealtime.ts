import { useEffect } from 'react';
import { supabase } from '../../../services/supabase';

export function useInvoiceRealtime(invoiceId: string | undefined, onPaidCallback: () => void) {
  useEffect(() => {
    if (!invoiceId) return;

    const channel = supabase
      .channel(`invoice-status-${invoiceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'invoices',
          filter: `id=eq.${invoiceId}`,
        },
        (payload) => {
          if (payload.new && payload.new.status === 'paid') {
            onPaidCallback();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invoiceId]);
}