// src/components/OrderForm.jsx
import React, { useState, useEffect } from 'react';
import {
  searchClient,
  getOrganizations,
  getWarehouses,
  getBills,
  getPriceTypes,
  getNomenclature,
  createSale
} from '../api/api';

const OrderForm = ({ token }) => {
  const [phone, setPhone] = useState('');
  const [client, setClient] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [bills, setBills] = useState([]);
  const [priceTypes, setPriceTypes] = useState([]);
  const [nomenclature, setNomenclature] = useState([]);
  const [goods, setGoods] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedBill, setSelectedBill] = useState('');
  const [paidRubles, setPaidRubles] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
  if (!token) return;
  const fetchData = async () => {
    try {
      const [orgRes, whRes, billRes, ptRes, nomRes] = await Promise.all([
        getOrganizations(token),
        getWarehouses(token),
        getBills(token),
        getPriceTypes(token),
        getNomenclature(token)
      ]);

      setOrganizations(orgRes);
      console.log("Организации:", orgRes.slice(0, 3));

      setWarehouses(whRes);
      setBills(billRes);
      setPriceTypes(ptRes);
      setNomenclature(nomRes);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError('Не удалось загрузить справочники. Проверьте токен и интернет.');
    }
  };
  fetchData();
}, [token]);


  const handleSearchClient = async () => {
    if (!phone) return;
    try {
      const data = await searchClient(phone, token);
      const found = Array.isArray(data.results) ? data.results[0] : data[0];
      if (found) setClient(found);
    } catch (err) {
      setError('Клиент не найден');
    }
  };

  const addGood = () => {
    if (nomenclature.length === 0) return;
    const firstGood = nomenclature[0];
    setGoods([
      ...goods,
      {
        nomenclature: firstGood.id,
        name: firstGood.name,
        price: firstGood.prices?.[0]?.price || 0,
        quantity: 1,
        sum: firstGood.prices?.[0]?.price || 0
      }
    ]);
  };

  const updateGood = (index, field, value) => {
    const newGoods = [...goods];
    newGoods[index][field] = value;
    newGoods[index].sum = newGoods[index].price * newGoods[index].quantity;
    setGoods(newGoods);
  };

  const removeGood = (index) => {
    setGoods(goods.filter((_, i) => i !== index));
  };

  const getTotalSum = () => {
    return goods.reduce((sum, g) => sum + g.sum, 0);
  };

  const handleSubmit = async (conduct) => {
    setLoading(true);
    setError('');
    const payload = {
      operation: "Заказ",
      tax_included: true,
      tax_active: true,
      goods: goods.map(g => ({
        price: g.price,
        quantity: g.quantity,
        unit: 116,
        discount: 0,
        sum_discounted: g.sum,
        nomenclature: g.nomenclature
      })),
      loyality_card_id: client?.loyalty_cards?.[0]?.id || null,
      warehouse: selectedWarehouse,
      contragent: client?.id || null,
      paybox: selectedBill,
      organization: selectedOrg,
      status: !conduct,
      paid_rubles: parseFloat(paidRubles) || 0
    };

    try {
      const result = await createSale(payload, token);
      alert(conduct ? '✅ Заказ создан и проведён' : '💾 Черновик сохранён');
      console.log('Ответ API:', result);
    } catch (err) {
      setError('Ошибка отправки заказа');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: '16px', color: '#333' }}>Оформление заказа</h2>

      {error && <div style={{ color: 'red', marginBottom: '12px' }}>{error}</div>}

      {/* Поиск клиента */}
      <div className="input-group">
        <label>Телефон клиента</label>
        <div style={{ display: 'flex' }}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="79991234567"
          />
          <button onClick={handleSearchClient} className="search-btn">
            Найти
          </button>
        </div>
        {client && (
          <div className="client-info">
            🧑 <strong>{client.name}</strong> | Баланс: {client.balance || 0} ₽
          </div>
        )}
      </div>

      {/* Организация */}
      <div className="input-group">
        <label>Организация</label>
        <select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}>
          <option value="">Выберите организацию</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      </div>

      {/* Склад */}
      <div className="input-group">
        <label>Склад</label>
        <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)}>
          <option value="">Выберите склад</option>
          {warehouses.map(wh => (
            <option key={wh.id} value={wh.id}>{wh.name}</option>
          ))}
        </select>
      </div>

      {/* Касса (счёт) */}
      <div className="input-group">
        <label>Касса (счёт)</label>
        <select value={selectedBill} onChange={(e) => setSelectedBill(e.target.value)}>
          <option value="">Выберите кассу</option>
          {bills.map(bill => (
            <option key={bill.id} value={bill.id}>{bill.name}</option>
          ))}
        </select>
      </div>

      {/* Товары */}
      <div>
        <h3 style={{ marginBottom: '12px', color: '#333' }}>Товары</h3>
        {goods.map((good, index) => (
          <div key={index} className="good-item">
            <input
              type="number"
              placeholder="Цена"
              value={good.price}
              onChange={(e) => updateGood(index, 'price', +e.target.value)}
            />
            <input
              type="number"
              placeholder="Кол-во"
              value={good.quantity}
              onChange={(e) => updateGood(index, 'quantity', +e.target.value)}
            />
            <button
              onClick={() => removeGood(index)}
              className="remove-btn"
            >
              Удалить
            </button>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>
              Сумма: <strong>{good.sum} ₽</strong>
            </div>
          </div>
        ))}
        <button onClick={addGood} style={{ width: '100%', padding: '10px', marginBottom: '16px' }}>
          + Добавить товар
        </button>
      </div>

      {/* Оплата */}
      <div className="input-group">
        <label>Оплачено (₽)</label>
        <input
          type="number"
          step="0.01"
          value={paidRubles}
          onChange={(e) => setPaidRubles(e.target.value)}
          placeholder="0.00"
        />
      </div>

      {/* Итого */}
      <div className="total">Итого: {getTotalSum().toFixed(2)} ₽</div>

      {/* Кнопки */}
      <div className="button-group">
        <button
          onClick={() => handleSubmit(false)}
          className="btn btn-secondary"
          disabled={loading}
        >
          {loading ? 'Отправка...' : 'Создать'}
        </button>
        <button
          onClick={() => handleSubmit(true)}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Проведение...' : 'Создать и провести'}
        </button>
      </div>
    </div>
  );
};

export default OrderForm;

