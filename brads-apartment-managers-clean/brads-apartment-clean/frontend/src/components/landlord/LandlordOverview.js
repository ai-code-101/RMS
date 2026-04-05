import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge } from '../UI';
import { Building2, Home, Users, TrendingUp, DoorClosed, DoorOpen, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';

function StatCard({ icon, label, value, color = 'var(--text-primary)' }) {
  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</div>
      </div>
    </Card>
  );
}

export default function LandlordOverview() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/payments/overview'),
      api.get('/units'),
    ]).then(([ovRes, unRes]) => {
      setOverview(ovRes.data);
      setUnits(unRes.data.slice(0, 8));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 48 }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
          Welcome back, {user?.fullName}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Here is an overview of your properties.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon={<Building2 size={22} />} label="Total Units" value={overview?.totalUnits ?? 0} />
        <StatCard icon={<DoorClosed size={22} />} label="Occupied" value={overview?.occupiedUnits ?? 0} color="var(--success)" />
        <StatCard icon={<DoorOpen size={22} />} label="Vacant" value={overview?.vacantUnits ?? 0} color="var(--warning)" />
        <StatCard icon={<CheckCircle size={22} />} label="Paid" value={overview?.paidUnits ?? 0} color="var(--success)" />
        <StatCard icon={<XCircle size={22} />} label="Unpaid" value={overview?.unpaidUnits ?? 0} color="var(--error)" />
        <StatCard icon={<TrendingUp size={22} />} label="Monthly Revenue (KES)" value={(overview?.monthlyRevenue ?? 0).toLocaleString()} color="var(--info)" />
      </div>

      {units.length > 0 && (
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18 }}>Recent Units</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Unit', 'Apartment', 'Rent (KES)', 'Status', 'Payment', 'Tenant'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {units.map(unit => (
                  <tr key={unit._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 12px', fontWeight: 500 }}>{unit.unitNumber}</td>
                    <td style={{ padding: '12px 12px', color: 'var(--text-secondary)' }}>{unit.apartment?.name}</td>
                    <td style={{ padding: '12px 12px' }}>{unit.rentPrice?.toLocaleString()}</td>
                    <td style={{ padding: '12px 12px' }}>
                      <Badge color={unit.status === 'occupied' ? 'success' : 'warning'}>
                        {unit.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <Badge color={unit.paymentStatus === 'paid' ? 'success' : 'error'}>
                        {unit.paymentStatus}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 12px', color: 'var(--text-secondary)' }}>
                      {unit.tenant?.fullName || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
