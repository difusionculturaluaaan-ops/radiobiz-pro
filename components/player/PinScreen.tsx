'use client';

import { useState } from 'react';
import styles from './PinScreen.module.css';

interface PinScreenProps {
  pin: string;
  onSubmit: (enteredPin: string) => void;
}

export default function PinScreen({ pin, onSubmit }: PinScreenProps) {
  const [pinBuf, setPinBuf] = useState('');
  const [error, setError] = useState('');

  const handleDigit = (digit: string) => {
    if (pinBuf.length < 4) {
      setPinBuf(pinBuf + digit);
    }
  };

  const handleBackspace = () => {
    setPinBuf(pinBuf.slice(0, -1));
    setError('');
  };

  const handleSubmit = () => {
    if (pinBuf === pin) {
      onSubmit(pinBuf);
    } else {
      setError('PIN incorrecto');
      setPinBuf('');
    }
  };

  const handleClear = () => {
    setPinBuf('');
    setError('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.modal}>
        <div style={{ fontSize: '2rem', marginBottom: '24px' }}>🔐</div>
        <h1 style={{ marginBottom: '8px', fontSize: '1.3rem', fontWeight: 700 }}>Acceso requerido</h1>
        <p style={{ color: 'var(--text2)', marginBottom: '24px', fontSize: '0.85rem' }}>
          Ingresa el PIN de 4 dígitos
        </p>

        {/* PIN Display */}
        <div className={styles.pinDisplay}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${styles.pinDot} ${i < pinBuf.length ? styles.filled : ''}`} />
          ))}
        </div>

        {/* Error Message */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Numeric Keypad */}
        <div className={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button key={digit} className={styles.key} onClick={() => handleDigit(String(digit))}>
              {digit}
            </button>
          ))}
          <button className={`${styles.key} ${styles.wide}`} onClick={handleClear}>
            ✕ Limpiar
          </button>
          <button className={styles.key} onClick={() => handleDigit('0')}>
            0
          </button>
          <button className={`${styles.key} ${styles.wide}`} onClick={handleBackspace}>
            ← Retroceso
          </button>
        </div>

        {/* Submit Button */}
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={pinBuf.length !== 4}
          style={{ marginTop: '16px', width: '100%' }}
        >
          Acceder →
        </button>
      </div>
    </div>
  );
}
