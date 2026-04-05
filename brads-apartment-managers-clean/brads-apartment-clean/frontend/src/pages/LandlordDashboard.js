import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LandlordOverview from '../components/landlord/LandlordOverview';
import ApartmentsPage from '../components/landlord/ApartmentsPage';
import UnitsPage from '../components/landlord/UnitsPage';
import TenantsPage from '../components/landlord/TenantsPage';
import PaymentsPage from '../components/landlord/PaymentsPage';

const navItems = [
  { label: 'Overview', path: '/landlord' },
  { label: 'Apartments', path: '/landlord/apartments' },
  { label: 'Units', path: '/landlord/units' },
  { label: 'Tenants', path: '/landlord/tenants' },
  { label: 'Payments', path: '/landlord/payments' },
];

export default function LandlordDashboard() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <Navbar navItems={navItems} />
      <div style={{ flex: 1, padding: '28px 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Routes>
          <Route index element={<LandlordOverview />} />
          <Route path="apartments" element={<ApartmentsPage />} />
          <Route path="units" element={<UnitsPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="*" element={<Navigate to="/landlord" />} />
        </Routes>
      </div>
    </div>
  );
}
