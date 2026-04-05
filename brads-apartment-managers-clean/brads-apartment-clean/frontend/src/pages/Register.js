import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Input, Button } from '../components/UI';
import { Building2, Sun, Moon, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [form, setForm] = useState({
    fullName: '', companyName: '', email: '', password: '',
    confirmPassword: '', landlordName: '', phone: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const payload = { fullName: form.fullName, email: form.email, password: form.password, role, phone: form.phone };
      if (role === 'landlord') payload.companyName = form.companyName;
      if (role === 'tenant') payload.landlordName = form.landlordName;

      const user = await register(payload);
      toast.success('Account created successfully');
      navigate(user.role === 'landlord' ? '/landlord' : '/tenant');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <header style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 18 }}>
          <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-fg)' }}>
            <Building2 size={18} />
          </div>
          Brads Apartment Managers
        </div>
        <button onClick={toggleTheme} style={{ width: 38, height: 38, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', cursor: 'pointer' }}>
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <button onClick={() => navigate(`/login/${role}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14, cursor: 'pointer', background: 'none', border: 'none' }}>
            <ArrowLeft size={16} /> Back to Sign In
          </button>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
              Create {role === 'landlord' ? 'Landlord' : 'Tenant'} Account
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Fill in your details to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Full Name" placeholder="John Doe" value={form.fullName} onChange={set('fullName')} required />
            {role === 'landlord' && (
              <Input label="Company Name (optional)" placeholder="Brads Properties Ltd" value={form.companyName} onChange={set('companyName')} />
            )}
            <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            <Input label="Phone Number" type="tel" placeholder="0712345678" value={form.phone} onChange={set('phone')} />
            {role === 'tenant' && (
              <Input label="Landlord Name or Company" placeholder="Name of your landlord or company" value={form.landlordName} onChange={set('landlordName')} required />
            )}
            <Input label="Password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required />
            <Input label="Confirm Password" type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
            <Button type="submit" loading={loading} size="lg" style={{ marginTop: 4 }}>
              Create Account
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to={`/login/${role}`} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
