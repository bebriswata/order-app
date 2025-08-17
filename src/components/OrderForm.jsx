import React, { useState, useEffect } from 'react';
import DropdownInput from "./DropdownInput";
import {
  searchClient,
  getOrganizations,
  getWarehouses,
  getBills,
  getPriceTypes,
  getNomenclature,
  createSale,
} from '../api/api';

const OrderForm = ({ token }) => {
  const [organizations, setOrganizations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [bills, setBills] = useState([]);
  const [setPriceTypes] = useState([]);
  const [nomenclature, setNomenclature] = useState([]);
  const [goods, setGoods] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedBill, setSelectedBill] = useState('');
  const [paidRubles, setPaidRubles] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [orgRes, whRes, billRes, ptRes, nomRes] = await Promise.all([
          getOrganizations(token),
          getWarehouses(token),
          getBills(token),
          getPriceTypes(token),
          getNomenclature(token),
        ]);
        setOrganizations(orgRes);
        setWarehouses(whRes);
        setBills(billRes);
        // setPriceTypes(ptRes);
        setNomenclature(nomRes);
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setError("Не удалось загрузить справочники. Проверьте токен и интернет.");
      }
    };
    fetchData();
  }, [token]);

  const getDisplayName = (item) =>
      item?.name || item?.short_name || item?.full_name || item?.work_name || "— без названия —";

  const getProductName = (p) =>
      p?.name || p?.work_name || p?.full_name || p?.article || p?.sku || `#${p?.id}`;

  const addGoodFromProduct = (p) => {
    if (!p) return;
    const price = p?.prices?.[0]?.price ?? 0;
    setGoods((prev) => [
      ...prev,
      {
        nomenclature: p.id,
        name: getProductName(p),
        price,
        quantity: 0,
        sum: price,
      },
    ]);
  };

  const [clientOptions, setClientOptions] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  const handleSearchClient = async (term) => {
    try {
      const data = await searchClient(term, token);
      const list =
          Array.isArray(data?.result) ? data.result :
              Array.isArray(data?.results) ? data.results :
                  Array.isArray(data) ? data : [];
      setClientOptions(list);
    } catch (e) {
      console.error("Ошибка поиска клиента", e);
      setClientOptions([]);
    }
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
      goods: goods.map((g) => ({
        price: g.price,
        quantity: g.quantity,
        unit: 116,
        discount: 0,
        sum_discounted: g.sum,
        nomenclature: g.nomenclature,
      })),
      contragent: selectedClient?.id || null,
      loyality_card_id: selectedClient?.loyalty_cards?.[0]?.id || null,
      warehouse: selectedWarehouse,
      paybox: selectedBill,
      organization: selectedOrg,
      status: !conduct,
      paid_rubles: parseFloat(paidRubles) || 0,
    };

    try {
      const result = await createSale(payload, token);
      alert(conduct ? "✅ Заказ создан и проведён" : "💾 Черновик сохранён");
      console.log("Ответ API:", result);
    } catch (err) {
      setError("Ошибка отправки заказа");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="container">
        <h2 style={{ marginBottom: "16px", color: "#333" }}>Оформление заказа</h2>
        {error && <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>}

        {/* Клиент */}
        <div className="input-group">
          <DropdownInput
              label="Клиент"
              options={clientOptions}
              selected={selectedClient}
              onSelect={(c) => setSelectedClient(c)}
              onSearch={handleSearchClient}
              getDisplayName={(c) =>
                  c?.short_name || c?.name || c?.phone || String(c?.id ?? "")
              }
              placeholder="Введите телефон или ID клиента"
              minChars={2}
          />
        </div>

        {/* Организация */}
        <div className="input-group">
          <DropdownInput
              label="Организация"
              options={organizations}
              selected={selectedOrg}
              onSelect={setSelectedOrg}
              getDisplayName={getDisplayName}
              placeholder="Выберите организацию"
          />
        </div>

        {/* Склад */}
        <div className="input-group">
          <DropdownInput
              label="Склад"
              options={warehouses}
              selected={selectedWarehouse}
              onSelect={setSelectedWarehouse}
              getDisplayName={getDisplayName}
              placeholder="Выберите склад"
          />
        </div>

        {/* Касса */}
        <div className="input-group">
          <DropdownInput
              label="Касса (счёт)"
              options={bills}
              selected={selectedBill}
              onSelect={setSelectedBill}
              getDisplayName={getDisplayName}
              placeholder="Выберите кассу"
          />
        </div>

        {/* Добавление товаров */}
        <div className="input-group">
          <DropdownInput
              label="Товар"
              options={nomenclature}
              selected={null}
              onSelect={(prod) => addGoodFromProduct(prod)}
              getDisplayName={getProductName}
              placeholder="Начните вводить название или артикул"
          />
        </div>

        {/* Таблица товаров */}
        {goods.length > 0 && (
            <div className="goods-table-container">
              <table className="goods-table">
                <thead>
                <tr>
                  <th>Название</th>
                  <th>Цена</th>
                  <th>Кол-во</th>
                  <th>Сумма</th>
                  <th className="goods-actions">Действия</th>
                </tr>
                </thead>
                <tbody>
                {goods.map((good, index) => (
                    <tr key={index}>
                      <td>{good.name}</td>
                      <td>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={good.price === 0 ? "" : good.price}
                            onChange={(e) => {
                              const value = e.target.value;

                              const updatedGoods = [...goods];
                              updatedGoods[index].price = value === "" ? 0 : parseFloat(value) || 0;
                              setGoods(updatedGoods);
                            }}
                            placeholder="0"
                            className="goods-input goods-input-price"
                        />
                      </td>
                      <td>
                        <input
                            type="number"
                            step="1"
                            min="0"
                            value={good.quantity === 0 ? "" : good.quantity}
                            onChange={(e) => {
                              const value = e.target.value;

                              const updatedGoods = [...goods];
                              updatedGoods[index].quantity = value === "" ? 0 : parseFloat(value) || 0;;
                              setGoods(updatedGoods);
                            }}
                            placeholder="0"
                            className="goods-input goods-input-quantity"
                            aria-label="Количество товара"
                        />
                      </td>
                      <td className="goods-total">
                        {new Intl.NumberFormat("ru-RU").format(good.price * good.quantity)} ₽
                      </td>
                      <td className="goods-actions">
                        <button
                            className="goods-remove-btn"
                            onClick={() => removeGood(index)}
                            aria-label={`Удалить товар ${good.name}`}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}

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
            {loading ? "Отправка..." : "Создать"}
          </button>
          <button
              onClick={() => handleSubmit(true)}
              className="btn btn-primary"
              disabled={loading}
          >
            {loading ? "Проведение..." : "Создать и провести"}
          </button>
        </div>
      </div>
  );
};

export default OrderForm;
