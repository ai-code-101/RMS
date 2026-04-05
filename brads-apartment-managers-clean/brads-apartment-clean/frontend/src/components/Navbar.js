import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Building2, Sun, Moon, Bell, LogOut, Menu, X } from 'lucide-react';
import api from '../utils/api';

export default function Navbar({ navItems }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const unread = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    api.get('/notifications').then(r => setNotifications(r.data)).catch(() => {});
    const interval = setInterval(() => {
      api.get('/notifications').then(r => setNotifications(r.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const s = {
    nav: {
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
      padding: '0 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: 60, boxShadow: 'var(--shadow-sm)',
    },
    logo: {
      display: 'flex', alignItems: 'center', gap: 10,
      fontWeight: 700, fontSize: 16, color: 'var(--text-primary)',
    },
    logoIcon: {
      width: 32, height: 32, background: 'var(--accent)', borderRadius: 7,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-fg)',
    },
    navLinks: { display: 'flex', gap: 2, alignItems: 'center' },
    navBtn: (active) => ({
      padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer',
      border: 'none', fontFamily: 'inherit',
      background: active ? 'var(--bg-secondary)' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      transition: 'all 0.15s',
    }),
    right: { display: 'flex', alignItems: 'center', gap: 8 },
    iconBtn: {
      width: 36, height: 36, border: '1px solid var(--border)', borderRadius: 7,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer', position: 'relative',
    },
    badge: {
      position: 'absolute', top: -4, right: -4, width: 16, height: 16,
      background: 'var(--error)', borderRadius: '50%', fontSize: 10,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
    },
    notifPanel: {
      position: 'absolute', top: 42, right: 0, width: 340,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 200, overflow: 'hidden',
    },
    userInfo: {
      padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 8,
      border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    },
    avatar: {
      width: 28, height: 28, background: 'var(--accent)', borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--accent-fg)', fontSize: 12, fontWeight: 600,
    },
  };

  const typeColor = { reminder: 'var(--warning)', payment: 'var(--success)', overdue: 'var(--error)', info: 'var(--info)' };

  return (
    <nav style={s.nav}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={s.logo}>
          <div style={s.logoIcon}><Building2 size={16} /></div>
          <span style={{ display: window.innerWidth < 600 ? 'none' : 'block' }}>Brads Apartment Managers</span>
        </div>
        <div style={{ ...s.navLinks, display: window.innerWidth < 768 ? 'none' : 'flex' }}>
          {navItems?.map(item => (
            <button
              key={item.path}
              style={s.navBtn(location.pathname === item.path)}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={s.right}>
        <button style={s.iconBtn} onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        <div style={{ position: 'relative' }}>
          <button style={s.iconBtn} onClick={() => setShowNotif(v => !v)}>
            <Bell size={15} />
            {unread > 0 && <span style={s.badge}>{unread > 9 ? '9+' : unread}</span>}
          </button>

          {showNotif && (
            <div style={s.notifPanel}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>Mark all read</button>}
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No notifications</div>
                ) : notifications.map(n => (
                  <div key={n._id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: n.isRead ? 'transparent' : 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: typeColor[n.type] || 'var(--text-muted)', marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{n.message}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(n.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={s.userInfo}>
          <div style={s.avatar}>{(user?.fullName || 'U')[0].toUpperCase()}</div>
          <span style={{ fontSize: 13, fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.fullName}
          </span>
        </div>

        <button style={{ ...s.iconBtn, borderColor: 'transparent' }} onClick={handleLogout} title="Sign out">
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  );
}
