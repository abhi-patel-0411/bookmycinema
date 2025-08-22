import React, { useState, useEffect } from "react";
import { Row, Col, Button, Form, Card, Badge, Modal } from "react-bootstrap";
import { FaPlus, FaMinus, FaTrash, FaSave, FaEye } from "react-icons/fa";
import { motion } from "framer-motion";
import "../../styles/screen-design.css";

const SeatLayoutBuilder = ({ show, onHide, onSave, initialLayout = [] }) => {
  const [layout, setLayout] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    if (initialLayout.length > 0) {
      setLayout(initialLayout);
    } else {
      // Default layout
      setLayout([
        { row: "A", seats: [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10] },
        { row: "B", seats: [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10] },
        { row: "C", seats: [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10] },
      ]);
    }
  }, [initialLayout]);

  const addRow = () => {
    const rowsWithSeats = layout.filter((row) => row.seats.length > 0);
    const nextRowLetter = String.fromCharCode(65 + rowsWithSeats.length);
    setLayout([
      ...layout,
      {
        row: nextRowLetter,
        seats: [],
      },
    ]);
  };

  const removeRow = (rowIndex) => {
    setLayout(layout.filter((_, index) => index !== rowIndex));
    // return true → that row stays.
    //     _ → the actual element (ignored here).
    // index → the position of that element.
  };

  const addSeat = (rowIndex) => {
    const newLayout = [...layout];
    const row = newLayout[rowIndex];

    if (row.seats.length >= 15) {
      //seat alert
      alert("Maximum 15 seats per row allowed");
      return;
    }

    // If this is the first seat being added to an empty row, assign alphabet
    if (row.seats.length === 0) {
      const rowsWithSeats = newLayout.filter((r) => r.seats.length > 0);
      row.row = String.fromCharCode(65 + rowsWithSeats.length);
    }

    const maxSeat = Math.max(...row.seats.filter((s) => s !== null), 0);
    const nextSeatNumber = maxSeat + 1;
    row.seats.push(nextSeatNumber);
    setLayout(newLayout);
  };

  const addGap = (rowIndex) => {
    const newLayout = [...layout];

    if (newLayout[rowIndex].seats.length >= 15) {
      // gap alert
      alert("Maximum 15 seats per row allowed with gap");
      return;
    }

    newLayout[rowIndex].seats.push(null);
    setLayout(newLayout);
  };

  const addCustomRow = (pattern) => {
    const rowsWithSeats = layout.filter((row) => row.seats.length > 0);
    const nextRowLetter = String.fromCharCode(65 + rowsWithSeats.length);
    let seats = [];

    switch (pattern) {
      case "left-right":
        seats = [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10];
        break;
      case "middle-only":
        seats = [null, null, 1, 2, 3, 4, 5, null, null];
        break;
      case "full-row":
        seats = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        break;
      case "random-gaps":
        seats = [1, 2, null, 3, 4, 5, null, null, 6, 7, 8];
        break;
      default:
        seats = [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10];
    }

    setLayout([...layout, { row: nextRowLetter, seats }]);
  };

  const removeSeat = (rowIndex, seatIndex) => {
    const newLayout = [...layout];
    newLayout[rowIndex].seats.splice(seatIndex, 1);//remove for use splice
    setLayout(newLayout);
  };

  const toggleSeatGap = (rowIndex, seatIndex) => {
    const newLayout = [...layout];
    const currentSeat = newLayout[rowIndex].seats[seatIndex];

    if (currentSeat === null) {
      // Convert gap to seat
      const maxSeat = Math.max(
        ...newLayout[rowIndex].seats.filter((s) => s !== null)
      );
      newLayout[rowIndex].seats[seatIndex] = maxSeat + 1;
    } else {
      // Convert seat to gap
      newLayout[rowIndex].seats[seatIndex] = null;
    }

    setLayout(newLayout);
  };

  const handlePreviewSeatClick = (rowLetter, seatNumber) => {
    if (seatNumber === null) return;

    const seatId = `${rowLetter}${seatNumber}`;
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  const calculateTotalCapacity = () => {
    return layout.reduce(
      (total, row) => total + row.seats.filter((seat) => seat !== null).length,
      0
    );
  };

  const handleSave = () => {
    onSave(layout);
    onHide();
  };

  const renderSeatLayoutBuilder = () => (
    <div className="seat-layout-builder">
      <div className="mb-4 text-center">
        <div className="screen aos-init aos-animate" data-aos="fade-up" style={{ color: "#fff" }}>
          Screen
        </div>
      </div>

      {layout.map((rowObj, rowIndex) => (
        <motion.div
          key={rowIndex}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="row-builder mb-3 p-3 border rounded"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <div className="d-flex align-items-center mb-2">
            {rowObj.seats.length > 0 && (
              <Badge bg="primary" className="me-2">
                {rowObj.row}
              </Badge>
            )}
            {rowObj.seats.length === 0 && (
              <Badge bg="secondary" className="me-2">
                Empty Row
              </Badge>
            )}
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => removeRow(rowIndex)}
              className="ms-auto"
            >
              <FaTrash />
            </Button>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-1">
            {rowObj.seats.map((seat, seatIndex) => (
              <div key={seatIndex} className="seat-builder-item">
                {seat === null ? (
                  <button
                    className="seat-gap"
                    onClick={() => toggleSeatGap(rowIndex, seatIndex)}
                    style={{
                      width: "35px",
                      height: "35px",
                      border: "2px dashed #666",
                      background: "transparent",
                      borderRadius: "5px",
                      margin: "2px",
                    }}
                  >
                    <span style={{ fontSize: "10px", color: "#666" }}>GAP</span>
                  </button>
                ) : (
                  <button
                    className="seat-builder"
                    onClick={() => toggleSeatGap(rowIndex, seatIndex)}
                    style={{
                      width: "35px",
                      height: "35px",
                      border: "1px solid #007bff",
                      background: "#007bff",
                      color: "white",
                      borderRadius: "5px",
                      margin: "2px",
                      fontSize: "12px",
                    }}
                  >
                    {seat}
                  </button>
                )}
                <button
                  className="remove-seat-btn"
                  onClick={() => removeSeat(rowIndex, seatIndex)}
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    width: "15px",
                    height: "15px",
                    borderRadius: "50%",
                    border: "none",
                    background: "#dc3545",
                    color: "white",
                    fontSize: "10px",
                    display: "none",
                  }}
                  onMouseEnter={(e) => (e.target.style.display = "block")}
                >
                  ×
                </button>
              </div>
            ))}

            <div className="d-flex gap-1 ms-2">
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => addSeat(rowIndex)}
                title="Add Seat"
              >
                <FaPlus />
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => addGap(rowIndex)}
                title="Add Gap"
              >
                ⬜
              </Button>
            </div>
          </div>
        </motion.div>
      ))}

      <div className="text-center mt-4">
        <div className="mb-3">
          <h6 className="text-white mb-2">Quick Add Row Templates:</h6>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => addCustomRow("left-right")}
            >
              Left-Gap-Right
            </Button>
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => addCustomRow("middle-only")}
            >
              Middle Only
            </Button>
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => addCustomRow("full-row")}
            >
              Full Row
            </Button>
            <Button
              variant="outline-info"
              size="sm"
              onClick={() => addCustomRow("random-gaps")}
            >
              Random Gaps
            </Button>
          </div>
        </div>

        <div className="d-flex justify-content-center gap-2">
          <Button variant="outline-primary" onClick={addRow}>
            <FaPlus className="me-1" />
            Add Custom Row
          </Button>
          <Button variant="outline-info" onClick={() => setPreviewMode(true)}>
            <FaEye className="me-1" />
            Preview
          </Button>
        </div>
      </div>

      <div
        className="mt-4 p-3 rounded"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <h6 className="text-white">Layout Summary</h6>
        <p className="text-white mb-1">Total Rows: {layout.length}</p>
        <p className="text-white mb-1">
          Total Capacity: {calculateTotalCapacity()}
        </p>
        <p className="text-white mb-0">
          Layout:{" "}
          {layout
            .map(
              (row) =>
                `${row.row}(${row.seats.filter((s) => s !== null).length})`
            )
            .join(", ")}
        </p>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="seat-layout-preview">
      <div className="mb-4 text-center">
        <div className="screen aos-init aos-animate" data-aos="fade-up" style={{ color: "#fff" }}>
          Screen
        </div>
      </div>

      {layout.map((rowObj, rowIndex) => (
        <div key={rowIndex} className="d-flex align-items-center mb-2">
          {rowObj.seats.filter((seat) => seat !== null).length > 0 && (
            <Badge bg="secondary" className="me-3" style={{ minWidth: "30px" }}>
              {rowObj.row}
            </Badge>
          )}
          <div className="d-flex gap-1">
            {rowObj.seats.map((seat, seatIndex) => {
              if (seat === null) {
                return (
                  <div
                    key={seatIndex}
                    className="seat-gap"
                    style={{
                      width: "30px",
                      height: "30px",
                      margin: "2px",
                    }}
                  />
                );
              }

              const seatId = `${rowObj.row}${seat}`;
              const isSelected = selectedSeats.includes(seatId);

              return (
                <button
                  key={seatIndex}
                  className={`seat ${isSelected ? "selected" : "available"}`}
                  onClick={() => handlePreviewSeatClick(rowObj.row, seat)}
                  style={{
                    width: "30px",
                    height: "30px",
                    margin: "2px",
                    border: "none",
                    borderRadius: "5px",
                    fontSize: "11px",
                    background: isSelected ? "#28a745" : "#6c757d",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  {seat}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-4">
        <div className="d-flex justify-content-center gap-4">
          <div className="d-flex align-items-center">
            <div className="seat-legend available me-2"></div>
            <small className="text-white">Available</small>
          </div>
          <div className="d-flex align-items-center">
            <div className="seat-legend selected me-2"></div>
            <small className="text-white">Selected</small>
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <Button
          variant="outline-secondary"
          onClick={() => setPreviewMode(false)}
        >
          Back to Editor
        </Button>
      </div>
    </div>
  );

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header
        closeButton
        className="border-0"
        style={{ background: "#1f2025" }}
      >
        <Modal.Title className="text-white">
          {previewMode ? "Seat Layout Preview" : "Custom Seat Layout Builder"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body
        style={{ background: "#1f2025", maxHeight: "70vh", overflowY: "auto" }}
      >
        {previewMode ? renderPreview() : renderSeatLayoutBuilder()}
      </Modal.Body>
      <Modal.Footer className="border-0" style={{ background: "#1f2025" }}>
        <Button variant="outline-secondary" onClick={onHide}>
          Cancel
        </Button>
        {!previewMode && (
          <Button variant="success" onClick={handleSave}>
            <FaSave className="me-1" />
            Save Layout
          </Button>
        )}
      </Modal.Footer>

      <style>{`
        .seat-legend.available {
          width: 20px;
          height: 20px;
          background: #6c757d;
          border-radius: 3px;
        }
        .seat-legend.selected {
          width: 20px;
          height: 20px;
          background: #28a745;
          border-radius: 3px;
        }
        .seat-builder-item {
          position: relative;
        }
        .seat-builder-item:hover .remove-seat-btn {
          display: block !important;
        }
      `}</style>
    </Modal>
  );
};

export default SeatLayoutBuilder;
