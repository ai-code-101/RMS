import React from 'react';

export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
      <input
        {...props}
        style={{
          padding: '10px 14px',
          border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
          borderRadius: 8,
          background: 'var(--bg-input)',
          color: 'var(--text-primary)',
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 0.15s',
          width: '100%',
          ...(props.style || {}),
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--border-focus)'; }}
        onBlur={e => { e.target.style.borderColor = error ? 'var(--error)' : 'var(--border)'; }}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--error)' }}>{error}</span>}
    </div>
  );
}

export function Select({ label, error, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
      <select
        {...props}
        style={{
          padding: '10px 14px',
          border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
          borderRadius: 8,
          background: 'var(--bg-input)',
          color: 'var(--text-primary)',
          fontSize: 14,
          outline: 'none',
          width: '100%',
          cursor: 'pointer',
          ...(props.style || {}),
        }}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: 12, color: 'var(--error)' }}>{error}</span>}
    </div>
  );
}

export function Button({ children, variant = 'primary', loading, size = 'md', ...props }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontWeight: 500,
    fontFamily: 'Inter, sans-serif',
    borderRadius: 8,
    transition: 'all 0.15s',
    cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
    opacity: props.disabled || loading ? 0.6 : 1,
    border: '1px solid transparent',
    fontSize: size === 'sm' ? 13 : 14,
    padding: size === 'sm' ? '7px 14px' : size === 'lg' ? '13px 24px' : '10px 18px',
  };

  const variants = {
    primary: {
      background: 'var(--accent)',
      color: 'var(--accent-fg)',
      borderColor: 'var(--accent)',
    },
    secondary: {
      background: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-primary)',
      borderColor: 'var(--border)',
    },
    danger: {
      background: 'var(--error)',
      color: '#fff',
      borderColor: 'var(--error)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'transparent',
    },
  };

  return (
    <button {...props} disabled={props.disabled || loading} style={{ ...base, ...variants[variant], ...(props.style || {}) }}>
      {loading ? 'Loading...' : children}
    </button>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: 24,
      boxShadow: 'var(--shadow)',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function Badge({ children, color = 'default' }) {
  const colors = {
    default: { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
    success: { bg: 'var(--success-bg)', color: 'var(--success)' },
    error: { bg: 'var(--error-bg)', color: 'var(--error)' },
    warning: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    info: { bg: 'var(--info-bg)', color: 'var(--info)' },
  };
  const c = colors[color] || colors.default;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 100,
      fontSize: 12,
      fontWeight: 500,
      background: c.bg,
      color: c.color,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        width: '100%',
        maxWidth: width,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 6, border: 'none',
              background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, desc, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '64px 24px', textAlign: 'center', gap: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>{title}</div>
      {desc && <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 320 }}>{desc}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: '2px solid var(--border)',
      borderTopColor: 'var(--text-primary)',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
    }} />
  );
}

// Inject keyframes
const style = document.createElement('style');
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
