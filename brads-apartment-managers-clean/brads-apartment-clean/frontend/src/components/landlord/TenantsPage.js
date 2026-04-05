import React, { useState, useEffect } from 'react';
import { Card, Button, EmptyState, Badge } from '../UI';
import { Users, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/tenants').then(r => setTenants(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleEvict = async (tenant) => {
    if (!window.confirm(`Remove tenant "${tenant.fullName}"? They will be deactivated.`)) return;
    try {
      await api.delete(`/tenants/${tenant._id}/evict`);
      setTenants(t => t.filter(x => x._id !== tenant._id));
      toast.success('Tenant removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove tenant');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Tenants</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>{tenants.length} tenant{tenants.length !== 1 ? 's' : ''} registered</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 64 }}>Loading...</div>
      ) : tenants.length === 0 ? (
        <EmptyState icon={<Users size={40} />} title="No tenants yet" desc="Tenants who register using your name will appear here." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['Name', 'Email', 'Phone', 'Unit', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: 12, borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((t, i) => (
                <tr key={t._id} style={{ borderBottom: i < tenants.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '13px 16px', fontWeight: 500 }}>{t.fullName}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)' }}>{t.email}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)' }}>{t.phone || '-'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    {t.assignedUnit ? (
                      <Badge color="success">{t.assignedUnit.unitNumber}</Badge>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Not assigned</span>}
                  </td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <button onClick={() => handleEvict(t)} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}>
                      <Trash2 size={13} />
                    </button>
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
