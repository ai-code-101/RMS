import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TenantHome from '../components/tenant/TenantHome';
import TenantPayments from '../components/tenant/TenantPayments';

const navItems = [
  { label: 'My Unit', path: '/tenant' },
  { label: 'Payment History', path: '/tenant/payments' },
];

export default function TenantDashboard() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <Navbar navItems={navItems} />
      <div style={{ flex: 1, padding: '28px 24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <Routes>
          <Route index element={<TenantHome />} />
          <Route path="payments" element={<TenantPayments />} />
          <Route path="*" element={<Navigate to="/tenant" />} />
        </Routes>
      </div>
    </div>
  );
}
