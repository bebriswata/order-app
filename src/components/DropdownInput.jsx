// src/components/DropdownInput.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";

const safeName = (item, getDisplayName) => {
    try {
        const s = (getDisplayName?.(item) ?? "").toString();
        return s;
    } catch {
        return "";
    }
};

const DropdownInput = ({
                           label,
                           options = [],
                           selected = null,              // объект или строка/id
                           onSelect,                     // (item) => void
                           onSearch,                     // (text) => void  — если нужен серверный поиск
                           getDisplayName,               // (item) => string
                           placeholder = "Введите значение",
                           minChars = 0,
                           showAllWhenEmpty = true,
                           clearOnSelect = false,
                           maxItems = 50,                // ограничим длину списка
                       }) => {
    const [inputValue, setInputValue] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);


    // клик вне
    useEffect(() => {
        const onDocClick = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    // локальная фильтрация
    const filtered = useMemo(() => {
        const val = inputValue.trim().toLowerCase();
        if (val.length < minChars) {
            // показываем все, если разрешено, иначе пусто
            return showAllWhenEmpty ? options.slice(0, maxItems) : [];
        }
        const arr = options.filter((o) =>
            safeName(o, getDisplayName).toLowerCase().includes(val)
        );
        return arr.slice(0, maxItems);
    }, [inputValue, options, getDisplayName, minChars, showAllWhenEmpty, maxItems]);

    return (
        <div className="input-group dropdown-input" ref={wrapperRef}>
            {label && <label style={{ display: "block", marginBottom: 6 }}>{label}</label>}

            <input
                type="text"
                value={inputValue}
                placeholder={placeholder}
                onFocus={() => {
                    setIsOpen(true);
                    onSearch?.(inputValue.trim()); // подгрузить при фокусе
                }}
                onChange={(e) => {
                    const val = e.target.value;
                    setInputValue(val);
                    setIsOpen(true);
                    onSearch?.(val.trim());
                }}
                className="dropdown-input-field"
            />

            {isOpen && (
                <ul className="dropdown-list">
                    {filtered.length === 0 ? (
                        <li
                            style={{ color: "#999", fontStyle: "italic", cursor: "default" }}
                        >
                            Ничего не найдено
                        </li>
                    ) : (
                        filtered.map((o) => {
                            const title = safeName(o, getDisplayName);
                            return (
                                <li
                                    key={o.id ?? title}
                                    onClick={() => {
                                        onSelect?.(o);
                                        setIsOpen(false);
                                        setInputValue(clearOnSelect ? "" : title);
                                    }}
                                >
                                    {title}
                                </li>
                            );
                        })
                    )}
                </ul>
            )}
        </div>
    );
};

export default DropdownInput;
