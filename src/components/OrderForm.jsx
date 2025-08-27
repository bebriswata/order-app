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
  const [nomenclature, setNomenclature] = useState([]);
  const [goods, setGoods] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paidRubles, setPaidRubles] = useState('');
  const [paidLt, setPaidLt] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [priceTypes, setPriceTypes] = useState([]);

    useEffect(() => {
        const testSearch = async () => {
            const data = await searchClient("79183668715", token);
            console.log('🔍 Найденные клиенты по 79183668715:', data);
        };
        if (token) testSearch();
    }, [token]);

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
        setPriceTypes(ptRes);
        setNomenclature(nomRes);

          console.log('Номенклатура:', nomRes);
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

    const handleSelectClient = (selected) => {
        setClient(selected); // ✅ Устанавливаем выбранного клиента
        setClientOptions([]); // Закрываем выпадающий список
    };

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
        setGoods(prev => prev.map((good, i) => {
            if (i !== index) return good;
            const updated = { ...good, [field]: value };
            return { ...updated, sum: updated.price * updated.quantity };
        }));
    };
  const removeGood = (index) => {
    setGoods(goods.filter((_, i) => i !== index));
  };

  const getTotalSum = () => {
    return goods.reduce((sum, good) => sum + good.sum, 0);
  };

    const handleSubmit = async (conduct) => {
        setLoading(true);
        setError('');

        if (!client) {
            setError('Клиент не выбран');
            setLoading(false);
            return;
        }
        if (!selectedOrg) {
            setError('Выберите организацию');
            setLoading(false);
            return;
        }
        if (!selectedWarehouse) {
            setError('Выберите склад');
            setLoading(false);
            return;
        }
        if (!selectedBill) {
            setError('Выберите кассу');
            setLoading(false);
            return;
        }
        if (goods.length === 0) {
            setError('Добавьте хотя бы один товар');
            setLoading(false);
            return;
        }

        const total = getTotalSum();
        const paidTotal =
            (parseFloat(paidRubles) || 0) + (parseFloat(paidLt) || 0);

        if (paidTotal < total) {
            setError('Сумма оплаты меньше итоговой суммы');
            setLoading(false);
            return;
        }

        const now = Math.floor(Date.now() / 1000);

        const payload = [
            {
                operation: "Заказ",
                dated: now,
                tax_included: true,
                tax_active: true,
                goods: goods.map((g) => ({
                    price: g.price,
                    quantity: g.quantity,
                    unit: g.unit || 116, // если нет, ставим дефолт
                    discount: 0,
                    sum_discounted: 0,
                    nomenclature: g.nomenclature,
                })),
                settings: { date_next_created: null },
                contragent: client.id,
                organization: selectedOrg,
                warehouse: selectedWarehouse,
                cashbox: selectedBill,              // 🔹 вместо paybox
                status: conduct,                    // 🔹 true = провести
                paid_rubles: parseFloat(paidRubles) || 0, // 🔹 число
                paid_lt: parseFloat(paidLt) || 0,
            },
        ];

        try {
            const result = await createSale(payload, token);
            console.log("✅ Ответ API:", result);
            alert(conduct
                ? "✅ Заказ проведён и оплачен"
                : "✅ Заказ создан (черновик)");
        } catch (err) {
            setError("Ошибка: " + err.message);
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
                onSelect={(c) => {
                    setSelectedClient(c);
                    setClient(c); // ✅ Устанавливаем client для использования в payload
                }}
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
              onSelect={(org) => setSelectedOrg(org.id)}
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
              onSelect={(wh) => setSelectedWarehouse(wh.id)}
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
              onSelect={(bill) => setSelectedBill(bill.id)}
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
                                    updateGood(index, 'price', value === "" ? 0 : parseFloat(value) || 0);
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
                                    updateGood(index, 'quantity', value === "" ? 0 : parseFloat(value) || 0);
                                }}
                                placeholder="0"
                                className="goods-input goods-input-quantity"
                            />
                        </td>
                            <td className="goods-total">
                        {new Intl.NumberFormat("ru-RU").format(good.price * good.quantity)} ₽
                      </td>
                      <td className="goods-actions">
                          <button
                              onClick={() => removeGood(index)}
                              className="remove-icon"
                              aria-label="Удалить товар"
                          >
                              🗑️
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
        <div className="total">
            Итого: {getTotalSum().toFixed(2)} ₽
        </div>

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
