import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, EmptyState, Badge } from '../UI';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/apartments').then(r => setApartments(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setForm({ name: '', address: '', description: '' }); setSelected(null); setModal('create'); };
  const openEdit = (apt) => { setForm({ name: apt.name, address: apt.address || '', description: apt.description || '' }); setSelected(apt); setModal('edit'); };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Apartment name is required');
    setSaving(true);
    try {
      if (modal === 'create') {
        const r = await api.post('/apartments', form);
        setApartments(a => [r.data, ...a]);
        toast.success('Apartment created');
      } else {
        const r = await api.put(`/apartments/${selected._id}`, form);
        setApartments(a => a.map(x => x._id === selected._id ? r.data : x));
        toast.success('Apartment updated');
      }
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (apt) => {
    if (!window.confirm(`Delete apartment "${apt.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/apartments/${apt._id}`);
      setApartments(a => a.filter(x => x._id !== apt._id));
      toast.success('Apartment deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Apartments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>{apartments.length} apartment{apartments.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} /> Add Apartment</Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 64 }}>Loading...</div>
      ) : apartments.length === 0 ? (
        <EmptyState icon={<Building2 size={40} />} title="No apartments yet" desc="Add your first apartment to get started." action={<Button onClick={openCreate}><Plus size={15} /> Add Apartment</Button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {apartments.map(apt => (
            <Card key={apt._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, background: 'var(--bg-secondary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                    <Building2 size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{apt.name}</div>
                    {apt.address && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{apt.address}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(apt)} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(apt)} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {apt.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{apt.description}</p>}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                Added {new Date(apt.createdAt).toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Apartment' : 'Edit Apartment'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Apartment Name" placeholder="e.g. Sunrise Block A" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="Address (optional)" placeholder="123 Main Street, Nairobi" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Description (optional)</label>
            <textarea
              placeholder="Additional details..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{modal === 'create' ? 'Create' : 'Save Changes'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
