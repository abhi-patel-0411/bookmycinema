import React, { useRef } from "react";
import { motion } from "framer-motion";

const CustomSeatLayout = ({
  seatLayout,
  bookedSeats = [],
  selectedSeats = [],
  lockedSeats = [],
  onSeatClick,
  pricing = { silver: 150, gold: 200, premium: 300 },
}) => {
  const scrollContainerRef = useRef(null);

  const getSeatId = (row, seatNumber) => `${row}${seatNumber}`;

  const getSeatStatus = (row, seatNumber) => {
    const seatId = getSeatId(row, seatNumber);
    if (bookedSeats.includes(seatId)) return "booked";
    if (selectedSeats.some((s) => s.id === seatId)) return "selected";
    if (lockedSeats.includes(seatId)) return "locked";
    return "available";
  };

  const getSeatClass = (rowObj, rowIndex) => {
    // Check if row has specific class defined
    if (rowObj.class) {
      return rowObj.class;
    }
    const totalRows = seatLayout.length;

    // Premium: Last 2 rows only
    if (rowIndex >= totalRows - 2) return "premium";

    // Divide remaining rows equally between silver and gold
    const remainingRows = totalRows - 2;
    const halfRemaining = Math.floor(remainingRows / 2);

    // Silver: First half of remaining rows
    if (rowIndex < halfRemaining) return "silver";
    // Gold: Second half of remaining rows
    return "gold";
  };

  const getSeatPrice = (seatClass) => {
    return pricing[seatClass] || pricing.silver;
  };

  const getSeatColor = (seatClass, status) => {
    if (status === "booked") return "#dc3545";
    if (status === "selected") return "#28a745";

    return "rgba(184, 184, 184, 0.3)";
  };

  const handleSeatClick = (row, seatNumber, rowIndex, seatClass) => {
    if (seatNumber === null) return;

    const seatId = getSeatId(row, seatNumber);
    const status = getSeatStatus(row, seatNumber);

    if (status === "booked" || status === "locked") return;

    const seatData = {
      id: seatId,
      row,
      number: seatNumber,
      price: getSeatPrice(seatClass),
      type: seatClass,
      class: seatClass,
    };

    onSeatClick(seatData);
  };

  if (!seatLayout || seatLayout.length === 0) {
    return (
      <div className="text-center text-secondary py-4">
        No seat layout available
      </div>
    );
  }

  return (
    <div className="seat-layout-professional">
      <div className="text-center mb-4" style={{ marginTop: "30px" }}>
        <div
          className="screen aos-init aos-animate"
          data-aos="fade-up"
          style={{ color: "#fff" }}
        >
          Screen
        </div>
      </div>
      <div
        className="seat-layout-scroll"
        ref={scrollContainerRef}
        style={{
          marginTop: "30px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {seatLayout.map((rowObj, rowIndex) => {
          const seatClass = getSeatClass(rowObj, rowIndex);
          const sectionLabel =
            rowObj.section ||
            seatClass.charAt(0).toUpperCase() + seatClass.slice(1);

          return (
            <div key={rowIndex}>
              {/* Section Label */}
              {(() => {
                // Only show section label for rows with seats
                if (rowObj.seats.filter((seat) => seat !== null).length === 0)
                  return false;

                // Show for first row with seats
                if (rowIndex === 0) return true;

                // Find the last non-empty row before current row
                let lastNonEmptyRowIndex = -1;
                for (let i = rowIndex - 1; i >= 0; i--) {
                  if (
                    seatLayout[i].seats.filter((seat) => seat !== null).length >
                    0
                  ) {
                    lastNonEmptyRowIndex = i;
                    break;
                  }
                }

                // If no previous non-empty row found, show section label
                if (lastNonEmptyRowIndex === -1) return true;

                // Show section label if seat class is different from last non-empty row
                return (
                  getSeatClass(
                    seatLayout[lastNonEmptyRowIndex],
                    lastNonEmptyRowIndex
                  ) !== seatClass
                );
              })() && (
                <div className="text-center mb-2 mt-3">
                  <div
                    className={`section-label ${seatClass}-section`}
                    style={{
                      display: "inline-block",
                      padding: "4px 16px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "#fff",
                      background: getSeatColor(seatClass, "available"),
                      textTransform: "uppercase",
                    }}
                  >
                    {sectionLabel} - ₹{getSeatPrice(seatClass)}
                  </div>
                </div>
              )}

              <motion.div
                className="seat-row-professional"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rowIndex * 0.05 }}
              >
                {rowObj.seats.filter((seat) => seat !== null).length > 0 && (
                  <div className="row-label-professional">{rowObj.row}</div>
                )}

                <div
                  className={`seats-container-professional ${
                    rowObj.seats.filter((seat) => seat !== null).length <= 15
                      ? "seats-centered"
                      : ""
                  }`}
                >
                  {rowObj.seats.map((seat, seatIndex) => {
                    if (seat === null) {
                      return <div key={seatIndex} className="seat-gap" />;
                    }

                    const status = getSeatStatus(rowObj.row, seat);
                    const price = getSeatPrice(seatClass);
                    let seatClassName = "seat-professional ";

                    if (status === "booked") seatClassName += "seat-booked";
                    else if (status === "selected")
                      seatClassName += "seat-selected";
                    else if (status === "locked")
                      seatClassName += "seat-locked";
                    else if (seatClass === "premium")
                      seatClassName += "seat-premium";
                    else if (seatClass === "gold") seatClassName += "gold-seat";
                    else if (seatClass === "silver")
                      seatClassName += "silver-seat";
                    else seatClassName += "seat-available";

                    return (
                      <button
                        key={seatIndex}
                        onClick={() =>
                          handleSeatClick(rowObj.row, seat, rowIndex, seatClass)
                        }
                        disabled={status === "booked" || status === "locked"}
                        title={`${
                          rowObj.row
                        }${seat} - ₹${price} (${seatClass.toUpperCase()}) ${
                          status === "locked"
                            ? "- Being selected by another user"
                            : status === "selected"
                            ? "- Click to deselect"
                            : ""
                        }`}
                        className={seatClassName}
                      >
                        {status === "booked"
                          ? "✕"
                          : status === "locked"
                          ? "⏳"
                          : seat}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomSeatLayout;
