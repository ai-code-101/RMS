import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Select, Badge, EmptyState } from '../UI';
import PaymentSection from './PaymentSection';
import { Home, Building2, Calendar, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function TenantHome() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState('loading'); // loading | select-unit | dashboard
  const [apartments, setApartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedApt, setSelectedApt] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [assignedUnit, setAssignedUnit] = useState(null);
  const [landlord, setLandlord] = useState(null);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [selecting, setSelecting] = useState(false);

  const loadApartments = useCallback(async () => {
    try {
      const r = await api.get('/apartments/by-landlord');
      setApartments(r.data.apartments);
      setLandlord(r.data.landlord);
    } catch (err) {
      toast.error('Could not find your landlord. Check the name you registered with.');
    }
  }, []);

  const loadAssignedUnit = useCallback(async () => {
    try {
      if (user?.assignedUnit) {
        const r = await api.get(`/units/${typeof user.assignedUnit === 'string' ? user.assignedUnit : user.assignedUnit._id}`);
        setAssignedUnit(r.data);
        setStep('dashboard');
      } else {
        await loadApartments();
        setStep('select-unit');
      }
    } catch {
      await loadApartments();
      setStep('select-unit');
    }
  }, [user, loadApartments]);

  useEffect(() => { loadAssignedUnit(); }, [loadAssignedUnit]);

  useEffect(() => {
    if (!selectedApt) { setUnits([]); setSelectedUnit(''); return; }
    setLoadingUnits(true);
    api.get(`/units/apartment/${selectedApt}`)
      .then(r => {
        // Show vacant units + existing-tenant occupied units
        const available = r.data.filter(u => u.status === 'vacant' || (u.status === 'occupied' && u.isExistingTenant && !u.tenant));
        setUnits(available);
        setSelectedUnit('');
      })
      .finally(() => setLoadingUnits(false));
  }, [selectedApt]);

  const handleSelectUnit = async () => {
    if (!selectedUnit) return toast.error('Please select a unit');
    setSelecting(true);
    try {
      const r = await api.post(`/units/${selectedUnit}/select`);
      setAssignedUnit(r.data.unit);
      await refreshUser();
      setStep('dashboard');
      toast.success('Unit selected successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to select unit');
    } finally {
      setSelecting(false);
    }
  };

  const onPaymentComplete = async () => {
    try {
      const r = await api.get(`/units/${assignedUnit._id}`);
      setAssignedUnit(r.data);
      await refreshUser();
    } catch {}
  };

  if (step === 'loading') {
    return <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 80 }}>Loading your unit...</div>;
  }

  if (step === 'select-unit') {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Select Your Unit</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Choose the apartment and unit you reside in.
          </p>
        </div>

        {!landlord && (
          <Card style={{ marginBottom: 20, borderColor: 'var(--warning)', background: 'var(--warning-bg)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <AlertCircle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--warning)' }}>Landlord not found</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  No landlord matching "{user?.landlordName}" was found. Make sure the name matches exactly what your landlord registered with.
                </div>
              </div>
            </div>
          </Card>
        )}

        {landlord && (
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: 'var(--bg-secondary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={18} style={{ color: 'var(--text-primary)' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your landlord</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{landlord.companyName || landlord.fullName}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{landlord.email}</div>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Select
              label="Apartment"
              value={selectedApt}
              onChange={e => setSelectedApt(e.target.value)}
              disabled={!apartments.length}
            >
              <option value="">-- Select an apartment --</option>
              {apartments.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </Select>

            {selectedApt && (
              <Select
                label="Unit"
                value={selectedUnit}
                onChange={e => setSelectedUnit(e.target.value)}
                disabled={loadingUnits || !units.length}
              >
                <option value="">
                  {loadingUnits ? 'Loading units...' : units.length === 0 ? 'No available units' : '-- Select a unit --'}
                </option>
                {units.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.unitNumber} — KES {u.rentPrice?.toLocaleString()}/month
                    {u.isExistingTenant ? ' (already occupied — existing tenant)' : ''}
                  </option>
                ))}
              </Select>
            )}

            <Button
              onClick={handleSelectUnit}
              loading={selecting}
              disabled={!selectedUnit}
              size="lg"
            >
              Confirm Unit Selection
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Dashboard view
  const isExisting = assignedUnit?.isExistingTenant && !assignedUnit?.lastPaymentDate;
  const nextDue = assignedUnit?.nextDueDate ? new Date(assignedUnit.nextDueDate) : null;
  const today = new Date();
  const daysUntilDue = nextDue ? Math.round((nextDue - today) / (1000 * 60 * 60 * 24)) : null;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>My Unit</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>Manage your tenancy and payments</p>
      </div>

      {/* Unit info card */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 52, height: 52, background: 'var(--bg-secondary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Home size={24} style={{ color: 'var(--text-primary)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>Unit {assignedUnit?.unitNumber}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>{assignedUnit?.apartment?.name}</div>
              {assignedUnit?.apartment?.address && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{assignedUnit.apartment.address}</div>
              )}
            </div>
          </div>
          <Badge color={assignedUnit?.paymentStatus === 'paid' ? 'success' : 'error'} style={{ fontSize: 13 }}>
            {assignedUnit?.paymentStatus === 'paid' ? 'Rent Paid' : 'Payment Required'}
          </Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Monthly Rent</div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>KES {assignedUnit?.rentPrice?.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Deposit Paid</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>KES {(assignedUnit?.deposit || assignedUnit?.rentPrice)?.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Landlord</div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{assignedUnit?.landlord?.companyName || assignedUnit?.landlord?.fullName}</div>
          </div>
          {nextDue && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Next Due Date</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} style={{ color: isOverdue ? 'var(--error)' : isDueSoon ? 'var(--warning)' : 'var(--text-secondary)' }} />
                <span style={{ fontWeight: 500, fontSize: 14, color: isOverdue ? 'var(--error)' : isDueSoon ? 'var(--warning)' : 'var(--text-primary)' }}>
                  {nextDue.toLocaleDateString()}
                  {isOverdue && ` (${Math.abs(daysUntilDue)}d overdue)`}
                  {isDueSoon && !isOverdue && ` (in ${daysUntilDue}d)`}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Due date alert */}
      {(isOverdue || isDueSoon) && assignedUnit?.paymentStatus !== 'paid' && (
        <Card style={{ marginBottom: 20, borderColor: isOverdue ? 'var(--error)' : 'var(--warning)', background: isOverdue ? 'var(--error-bg)' : 'var(--warning-bg)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <AlertCircle size={18} style={{ color: isOverdue ? 'var(--error)' : 'var(--warning)', flexShrink: 0 }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: isOverdue ? 'var(--error)' : 'var(--warning)' }}>
              {isOverdue
                ? `Your rent is overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}. Please pay immediately.`
                : daysUntilDue === 0
                  ? 'Your rent is due today. Please pay to avoid late fees.'
                  : `Your rent is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.`
              }
            </div>
          </div>
        </Card>
      )}

      {/* Payment section */}
      <PaymentSection
        unit={assignedUnit}
        onPaymentComplete={onPaymentComplete}
      />
    </div>
  );
}
