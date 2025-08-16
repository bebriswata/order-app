import React, { useState } from 'react';

// Функция для проверки токена
const validateToken = async (token) => {
  try {
    const res = await fetch(`https://app.tablecrm.com/api/v1/organizations/?token=${token}&limit=1`);
    return res.ok; 
  } catch (err) {
    return false;
  }
};

function AuthForm({ onAuth }) {
  const [inputToken, setInputToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!inputToken.trim()) {
      setError('Токен обязателен');
      setLoading(false);
      return;
    }

    // Проверяем токен
    const isValid = await validateToken(inputToken);
    if (!isValid) {
      setError('Неверный или недействительный токен. Проверьте данные.');
      setLoading(false);
      return;
    }

    // Если всё ок — передаём токен в App
    onAuth(inputToken);
  };

  return (
    <div className="auth-container">
        <div className="container">
      <h2>Авторизация в кассе</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Введите токен"
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
          disabled={loading}
          style={{
            padding: '12px',
            fontSize: '16px',
            width: '100%',
            marginBottom: '10px',
            border: '1px solid #ccc',
            borderRadius: '6px'
          }}
        />

        {error && (
          <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            fontSize: '16px',
            width: '100%',
            backgroundColor: loading ? '#aaa' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'wait' : 'pointer'
          }}
        >
          {loading ? 'Проверка...' : 'Войти'}
        </button>
      </form>
      </div>
    </div>
  );
}

export default AuthForm;