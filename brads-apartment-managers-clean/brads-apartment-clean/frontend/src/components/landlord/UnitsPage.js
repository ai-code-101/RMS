import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Modal, EmptyState, Badge } from '../UI';
import { Home, Plus, Pencil, Trash2, DoorClosed, DoorOpen } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ unitNumber: '', apartmentId: '', rentPrice: '', deposit: '' });
  const [saving, setSaving] = useState(false);
  const [filterApt, setFilterApt] = useState('');

  const load = () => {
    Promise.all([api.get('/units'), api.get('/apartments')]).then(([u, a]) => {
      setUnits(u.data); setApartments(a.data);
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setForm({ unitNumber: '', apartmentId: apartments[0]?._id || '', rentPrice: '', deposit: '' }); setSelected(null); setModal('create'); };
  const openEdit = (unit) => {
    setForm({ unitNumber: unit.unitNumber, apartmentId: unit.apartment?._id, rentPrice: unit.rentPrice, deposit: unit.deposit || '' });
    setSelected(unit); setModal('edit');
  };

  const handleSave = async () => {
    if (!form.unitNumber || !form.apartmentId || !form.rentPrice) return toast.error('Unit number, apartment, and rent price are required');
    setSaving(true);
    try {
      if (modal === 'create') {
        const r = await api.post('/units', form);
        setUnits(u => [r.data, ...u]);
        toast.success('Unit created');
      } else {
        const r = await api.put(`/units/${selected._id}`, form);
        setUnits(u => u.map(x => x._id === selected._id ? r.data : x));
        toast.success('Unit updated');
      }
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (unit) => {
    if (!window.confirm(`Delete unit "${unit.unitNumber}"?`)) return;
    try {
      await api.delete(`/units/${unit._id}`);
      setUnits(u => u.filter(x => x._id !== unit._id));
      toast.success('Unit deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const toggleOccupied = async (unit) => {
    const isOccupied = unit.status === 'occupied' && unit.isExistingTenant;
    try {
      if (isOccupied) {
        const r = await api.put(`/units/${unit._id}/mark-vacant`);
        setUnits(u => u.map(x => x._id === unit._id ? r.data : x));
        toast.success('Marked as vacant');
      } else {
        const r = await api.put(`/units/${unit._id}/mark-occupied`);
        setUnits(u => u.map(x => x._id === unit._id ? r.data : x));
        toast.success('Marked as occupied (existing tenant)');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const filtered = filterApt ? units.filter(u => u.apartment?._id === filterApt) : units;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Units</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>{units.length} unit{units.length !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={openCreate} disabled={apartments.length === 0}><Plus size={15} /> Add Unit</Button>
      </div>

      {apartments.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Select value={filterApt} onChange={e => setFilterApt(e.target.value)} style={{ maxWidth: 260 }}>
            <option value="">All Apartments</option>
            {apartments.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </Select>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 64 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Home size={40} />} title="No units yet" desc={apartments.length === 0 ? 'Add an apartment first, then add units.' : 'Add units to your apartments.'} action={apartments.length > 0 && <Button onClick={openCreate}><Plus size={15} /> Add Unit</Button>} />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['Unit', 'Apartment', 'Rent (KES)', 'Deposit (KES)', 'Status', 'Payment', 'Tenant', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((unit, i) => (
                <tr key={unit._id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '13px 16px', fontWeight: 600 }}>{unit.unitNumber}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)' }}>{unit.apartment?.name}</td>
                  <td style={{ padding: '13px 16px' }}>{unit.rentPrice?.toLocaleString()}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)' }}>{(unit.deposit || unit.rentPrice)?.toLocaleString()}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <Badge color={unit.status === 'occupied' ? 'success' : 'warning'}>{unit.status}</Badge>
                    {unit.isExistingTenant && <Badge color="info" style={{ marginLeft: 4 }}>existing</Badge>}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <Badge color={unit.paymentStatus === 'paid' ? 'success' : 'error'}>{unit.paymentStatus}</Badge>
                  </td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)' }}>{unit.tenant?.fullName || '-'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button title="Edit" onClick={() => openEdit(unit)} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        <Pencil size={13} />
                      </button>
                      {!unit.tenant && (
                        <button
                          title={unit.status === 'occupied' && unit.isExistingTenant ? 'Mark vacant' : 'Mark as existing tenant occupied'}
                          onClick={() => toggleOccupied(unit)}
                          style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: unit.status === 'occupied' ? 'var(--warning)' : 'var(--success)' }}>
                          {unit.status === 'occupied' && unit.isExistingTenant ? <DoorOpen size={13} /> : <DoorClosed size={13} />}
                        </button>
                      )}
                      <button title="Delete" onClick={() => handleDelete(unit)} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Unit' : 'Edit Unit'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select label="Apartment" value={form.apartmentId} onChange={e => setForm(f => ({ ...f, apartmentId: e.target.value }))}>
            {apartments.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </Select>
          <Input label="Unit Number" placeholder="e.g. A1, 101" value={form.unitNumber} onChange={e => setForm(f => ({ ...f, unitNumber: e.target.value }))} />
          <Input label="Rent Price (KES)" type="number" placeholder="e.g. 15000" value={form.rentPrice} onChange={e => setForm(f => ({ ...f, rentPrice: e.target.value }))} />
          <Input label="Deposit (KES) - defaults to rent price" type="number" placeholder="Leave blank to use rent price" value={form.deposit} onChange={e => setForm(f => ({ ...f, deposit: e.target.value }))} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{modal === 'create' ? 'Create' : 'Save Changes'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
