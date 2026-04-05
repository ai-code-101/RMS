import React, { useState, useEffect } from 'react';
import { EmptyState, Badge } from '../UI';
import { CreditCard } from 'lucide-react';
import api from '../../utils/api';

export default function TenantPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments/history').then(r => setPayments(r.data)).finally(() => setLoading(false));
  }, []);

  const statusColor = { completed: 'success', failed: 'error', cancelled: 'error', pending: 'warning' };
  const typeLabel = { initial: 'Initial (Rent + Deposit)', rent: 'Monthly Rent' };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Payment History</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>All your rent transactions</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 64 }}>Loading...</div>
      ) : payments.length === 0 ? (
        <EmptyState icon={<CreditCard size={40} />} title="No payments yet" desc="Your payment history will appear here once you make your first payment." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {payments.map(p => (
            <div key={p._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: p.status === 'completed' ? 'var(--success-bg)' : p.status === 'pending' ? 'var(--warning-bg)' : 'var(--error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} style={{ color: p.status === 'completed' ? 'var(--success)' : p.status === 'pending' ? 'var(--warning)' : 'var(--error)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>KES {p.amount?.toLocaleString()}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{typeLabel[p.type] || p.type}</div>
                  {p.transactionReceipt && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>Receipt: {p.transactionReceipt}</div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <Badge color={statusColor[p.status] || 'default'}>{p.status}</Badge>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(p.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
