import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Building2, User, Sun, Moon } from 'lucide-react';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-primary)',
  },
  header: {
    padding: '20px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontWeight: 700,
    fontSize: 18,
    color: 'var(--text-primary)',
  },
  logoIcon: {
    width: 36,
    height: 36,
    background: 'var(--accent)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--accent-fg)',
  },
  themeBtn: {
    width: 38,
    height: 38,
    border: '1px solid var(--border)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
    background: 'var(--bg-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: 100,
    border: '1px solid var(--border)',
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 42,
    fontWeight: 700,
    textAlign: 'center',
    color: 'var(--text-primary)',
    lineHeight: 1.2,
    marginBottom: 14,
    maxWidth: 520,
  },
  subtitle: {
    fontSize: 16,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    maxWidth: 440,
    marginBottom: 56,
    lineHeight: 1.7,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-muted)',
    letterSpacing: 0.8,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  cards: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    width: 220,
    padding: '32px 28px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: 'var(--shadow)',
  },
  iconCircle: {
    width: 56,
    height: 56,
    background: 'var(--bg-secondary)',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-primary)',
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: 16,
    color: 'var(--text-primary)',
  },
  cardDesc: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  footer: {
    padding: '20px 32px',
    borderTop: '1px solid var(--border)',
    textAlign: 'center',
    fontSize: 13,
    color: 'var(--text-muted)',
  },
};

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [hovered, setHovered] = React.useState(null);

  const roles = [
    {
      key: 'landlord',
      icon: <Building2 size={26} />,
      title: 'Landlord',
      desc: 'Manage apartments, units, tenants, and track rent payments.',
    },
    {
      key: 'tenant',
      icon: <User size={26} />,
      title: 'Tenant',
      desc: 'View your unit, pay rent, and manage your tenancy.',
    },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}><Building2 size={18} /></div>
          Brads Apartment Managers
        </div>
        <button
          style={styles.themeBtn}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </header>

      <main style={styles.main}>
        <span style={styles.badge}>Rental Management System</span>
        <h1 style={styles.title}>Manage Rentals with Confidence</h1>
        <p style={styles.subtitle}>
          A complete platform for landlords and tenants to manage properties, track payments, and stay organized.
        </p>

        <p style={styles.label}>Continue as</p>
        <div style={styles.cards}>
          {roles.map(role => (
            <div
              key={role.key}
              style={{
                ...styles.card,
                borderColor: hovered === role.key ? 'var(--border-focus)' : 'var(--border)',
                transform: hovered === role.key ? 'translateY(-3px)' : 'none',
                boxShadow: hovered === role.key ? 'var(--shadow-lg)' : 'var(--shadow)',
              }}
              onClick={() => navigate(`/login/${role.key}`)}
              onMouseEnter={() => setHovered(role.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={styles.iconCircle}>{role.icon}</div>
              <div style={styles.cardTitle}>{role.title}</div>
              <div style={styles.cardDesc}>{role.desc}</div>
            </div>
          ))}
        </div>
      </main>

      <footer style={styles.footer}>
        &copy; {new Date().getFullYear()} Brads Apartment Managers. All rights reserved.
      </footer>
    </div>
  );
}
