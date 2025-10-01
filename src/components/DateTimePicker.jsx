// src/components/DateTimePicker.jsx
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./dateTimePicker.css"; // 👈 estilos personalizados

const DateTimePicker = ({ onChange }) => {
  const [startDate, setStartDate] = useState(new Date());

  const handleChange = (date) => {
    setStartDate(date);
    if (onChange) onChange(date); // 👈 por si querés guardar en Firestore
  };

  return (
    <div className="date-picker-container">
      <DatePicker
        selected={startDate}
        onChange={handleChange}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={30}
        dateFormat="dd/MM/yyyy HH:mm"
        className="date-input"
        placeholderText="Seleccionar fecha y hora"
      />
    </div>
  );
};

export default DateTimePicker;
