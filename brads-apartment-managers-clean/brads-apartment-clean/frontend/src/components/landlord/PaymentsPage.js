import React, { useState, useEffect } from 'react';
import { Card, EmptyState, Badge } from '../UI';
import { CreditCard } from 'lucide-react';
import api from '../../utils/api';

export default function PaymentsPage() {
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
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Payments</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>All payment transactions across your properties</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 64 }}>Loading...</div>
      ) : payments.length === 0 ? (
        <EmptyState icon={<CreditCard size={40} />} title="No payments yet" desc="Completed tenant payments will appear here." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['Date', 'Tenant', 'Unit', 'Apartment', 'Amount (KES)', 'Type', 'Status', 'Receipt'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: 12, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p._id} style={{ borderBottom: i < payments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '13px 16px', fontWeight: 500 }}>{p.tenant?.fullName || '-'}</td>
                  <td style={{ padding: '13px 16px' }}>{p.unit?.unitNumber || '-'}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)' }}>{p.apartment?.name || '-'}</td>
                  <td style={{ padding: '13px 16px', fontWeight: 600 }}>{p.amount?.toLocaleString()}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: 12 }}>{typeLabel[p.type] || p.type}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <Badge color={statusColor[p.status] || 'default'}>{p.status}</Badge>
                  </td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}>
                    {p.transactionReceipt || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
