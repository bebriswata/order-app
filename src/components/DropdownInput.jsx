import React, { useState, useEffect, useRef } from "react";

const DropdownInput = ({
                           label,
                           options = [],
                           selected = null,
                           onSelect,
                           onSearch,
                           getDisplayName,
                           placeholder = "Введите значение",
                       }) => {
    const [inputValue, setInputValue] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // скрываем список при клике вне
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // локальная фильтрация (если options уже загружены)
    const filtered = options.filter((o) =>
        getDisplayName(o).toLowerCase().includes(inputValue.toLowerCase())
    );

    return (
        <div className="input-group dropdown-input" ref={wrapperRef}>
            {label && (
                <label style={{ display: "block", marginBottom: "6px" }}>{label}</label>
            )}
            <input
                type="text"
                value={inputValue}
                placeholder={placeholder}
                onFocus={() => {
                    setIsOpen(true);
                    if (onSearch) onSearch(inputValue.trim());
                }}
                onChange={(e) => {
                    const val = e.target.value;
                    setInputValue(val);
                    setIsOpen(true);
                    if (onSearch) onSearch(val.trim());
                }}
                className="dropdown-input-field"
            />

            {isOpen && (
                <ul className="dropdown-list">
                    {filtered.length === 0 ? (
                        <li
                            style={{
                                color: "#999",
                                fontStyle: "italic",
                                cursor: "default",
                            }}
                        >
                            Ничего не найдено
                        </li>
                    ) : (
                        filtered.map((o) => (
                            <li
                                key={o.id}
                                onClick={() => {
                                    onSelect?.(o);
                                    setInputValue(getDisplayName(o));
                                    setIsOpen(false);
                                }}
                            >
                                {getDisplayName(o)}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

export default DropdownInput;
