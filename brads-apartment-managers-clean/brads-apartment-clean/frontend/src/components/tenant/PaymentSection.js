import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge } from '../UI';
import { CreditCard, CheckCircle, XCircle, Clock, Phone } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const POLL_INTERVAL = 5000; // 5 seconds
const MAX_POLLS = 24;        // stop after 2 minutes

// Inject pulse animation once
const styleTag = document.createElement('style');
styleTag.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50%       { opacity: 1;   transform: scale(1.2); }
  }
`;
document.head.appendChild(styleTag);

function StatusDisplay({ status, amount, receipt }) {
  if (status === 'completed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 16px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={32} style={{ color: 'var(--success)' }} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--success)' }}>Payment Successful</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>KES {amount?.toLocaleString()} received</div>
        {receipt && (
          <div style={{ padding: '8px 16px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 13, fontFamily: 'monospace' }}>
            Receipt: {receipt}
          </div>
        )}
      </div>
    );
  }

  if (status === 'failed' || status === 'cancelled') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 16px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <XCircle size={32} style={{ color: 'var(--error)' }} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--error)' }}>
          {status === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          {status === 'cancelled'
            ? 'You cancelled the M-Pesa prompt on your phone.'
            : 'The payment could not be processed. Please try again.'}
        </div>
      </div>
    );
  }

  // pending / waiting
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '32px 16px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Clock size={32} style={{ color: 'var(--warning)' }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--warning)' }}>Waiting for Payment</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 300 }}>
        An M-Pesa prompt has been sent to your phone. Enter your PIN to complete the payment.
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {[0, 0.3, 0.6].map((delay, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)', animation: `pulse 1.2s ease-in-out ${delay}s infinite` }} />
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Checking payment status automatically...</div>
    </div>
  );
}

export default function PaymentSection({ unit, onPaymentComplete }) {
  const [phone, setPhone] = useState('');
  const [initiating, setInitiating] = useState(false);

  // Payment flow state
  const [paymentId, setPaymentId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | pending | completed | failed | cancelled
  const [paymentData, setPaymentData] = useState(null);     // { amount, type, transactionReceipt }

  const pollCount = useRef(0);
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  useEffect(() => () => stopPolling(), []);

  const pollStatus = async (pid) => {
    pollCount.current += 1;
    try {
      const r = await api.post(`/payments/status/${pid}`);
      const { status, payment } = r.data;

      setPaymentStatus(status);
      if (payment) setPaymentData(pd => ({ ...pd, transactionReceipt: payment.transactionReceipt }));

      if (status === 'completed') {
        stopPolling();
        toast.success('Payment confirmed!');
        onPaymentComplete && onPaymentComplete();
        return;
      }
      if (status === 'failed' || status === 'cancelled') {
        stopPolling();
        return;
      }
      if (pollCount.current >= MAX_POLLS) {
        stopPolling();
        setPaymentStatus('failed');
        toast.error('Payment timed out. Please try again.');
      }
    } catch {
      // ignore network errors during polling; keep trying
    }
  };

  const startPolling = (pid) => {
    pollCount.current = 0;
    stopPolling();
    // First check after 4 seconds, then every 5 seconds
    setTimeout(() => pollStatus(pid), 4000);
    pollRef.current = setInterval(() => pollStatus(pid), POLL_INTERVAL);
  };

  const handlePay = async () => {
    if (!phone.trim()) return toast.error('Enter your M-Pesa phone number');

    const cleaned = phone.replace(/\s+/g, '').replace(/^(\+254|0254)/, '0');
    if (!/^0[17]\d{8}$/.test(cleaned)) {
      return toast.error('Enter a valid Kenyan phone number (e.g. 0712345678)');
    }

    setInitiating(true);
    try {
      // The backend decides whether this is 'initial' or 'rent'
      // based on unit state and payment history — we just send the phone.
      const r = await api.post('/payments/initiate', { phone: cleaned });
      const { paymentId: pid, amount, type } = r.data;

      setPaymentId(pid);
      setPaymentStatus('pending');
      setPaymentData({ amount, type });
      toast.success('STK Push sent. Check your phone.');
      startPolling(pid);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setInitiating(false);
    }
  };

  const handleRetry = () => {
    stopPolling();
    setPaymentId(null);
    setPaymentStatus(null);
    setPaymentData(null);
  };

  if (!unit) return null;

  // ----------------------------------------------------------------
  // Determine what the tenant currently owes, for display only.
  // The backend is the source of truth for actual charge amounts.
  // ----------------------------------------------------------------
  const isContinuing = unit.isExistingTenant || !!unit.lastPaymentDate;
  const rentDue = unit.paymentStatus !== 'paid';

  // Nothing to pay right now
  if (!rentDue && !paymentStatus) {
    return (
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={26} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--success)' }}>Rent is up to date</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Your next payment is due on the 5th of next month.
          </div>
        </div>
      </Card>
    );
  }

  // Expected amount (display only — backend enforces the real figure)
  const displayAmount = isContinuing
    ? unit.rentPrice
    : unit.rentPrice + (unit.deposit || unit.rentPrice);
  const isInitial = !isContinuing;

  return (
    <Card>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 38, height: 38, background: 'var(--bg-secondary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CreditCard size={18} style={{ color: 'var(--text-primary)' }} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {paymentStatus ? 'Payment Status' : isInitial ? 'Initial Payment' : 'Pay Rent'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Via M-Pesa (MegaPay)</div>
        </div>
      </div>

      {/* Amount breakdown — shown only before payment starts */}
      {!paymentStatus && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
          {isInitial ? (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Initial payment breakdown</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Monthly Rent</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>KES {unit.rentPrice?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Deposit</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>KES {(unit.deposit || unit.rentPrice)?.toLocaleString()}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Total Due Now</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>KES {displayAmount?.toLocaleString()}</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Monthly Rent Due</span>
              <span style={{ fontWeight: 700, fontSize: 18 }}>KES {unit.rentPrice?.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Live payment status */}
      {paymentStatus && (
        <StatusDisplay
          status={paymentStatus}
          amount={paymentData?.amount}
          receipt={paymentData?.transactionReceipt}
        />
      )}

      {/* Phone input + pay button */}
      {!paymentStatus && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
              M-Pesa Phone Number
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="tel"
                placeholder="0712 345 678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePay()}
                style={{
                  width: '100%', padding: '10px 14px 10px 38px',
                  border: '1px solid var(--border)', borderRadius: 8,
                  background: 'var(--bg-input)', color: 'var(--text-primary)',
                  fontSize: 14, outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Safaricom M-Pesa number (e.g. 0712345678)
            </span>
          </div>

          <Button onClick={handlePay} loading={initiating} size="lg">
            Pay KES {displayAmount?.toLocaleString()} via M-Pesa
          </Button>
        </div>
      )}

      {/* Retry after failure or cancellation */}
      {(paymentStatus === 'failed' || paymentStatus === 'cancelled') && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <Button variant="outline" onClick={handleRetry}>Try Again</Button>
        </div>
      )}
    </Card>
  );
}
