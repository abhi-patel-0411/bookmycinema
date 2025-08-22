import React from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import { FaCog } from "react-icons/fa";

const AddScreenModal = ({
  show,
  onHide,
  selectedTheater,
  screenFormData,
  setScreenFormData,
  onSubmit,
  onConfigureSeatLayout,
}) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <div className="modal-content modal-content-beautiful">
        <div
          className="modal-header modal-header-beautiful"
          style={{
            background: "#1f2025",
            border: "none",
            color: "rgb(255, 255, 255)",
          }}
        >
          <div
            className="modal-title h4"
            style={{ color: "rgb(255, 255, 255)" }}
          >
            Add Screen to {selectedTheater?.name}
          </div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={onHide}
          />
        </div>

        <div
          className="modal-body modal-body-beautiful"
          style={{
            background: "#1f2025",
            color: "rgb(255, 255, 255)",
          }}
        >
          <Form onSubmit={(e) => {
            e.preventDefault();
            onSubmit(e);
          }}>
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <label
                    className="form-label form-label-beautiful"
                    style={{ color: "rgb(255, 255, 255)" }}
                  >
                    Screen Name
                  </label>
                  <input
                    placeholder="Screen 1"
                    type="text"
                    className="form-control text-white form-control-beautiful"
                    value={screenFormData.name}
                    onChange={(e) =>
                      setScreenFormData({
                        ...screenFormData,
                        name: e.target.value,
                      })
                    }
                    style={{
                      background: "#1f2025",
                      border: "1px solid rgb(108, 117, 125)",
                      borderRadius: "30px",
                      color: "rgb(255, 255, 255)",
                    }}
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <label
                    className="form-label form-label-beautiful"
                    style={{ color: "rgb(255, 255, 255)" }}
                  >
                    Screen Type
                  </label>
                  <select
                    className="form-select"
                    value={screenFormData.screenType}
                    onChange={(e) =>
                      setScreenFormData({
                        ...screenFormData,
                        screenType: e.target.value,
                      })
                    }
                    style={{
                      background: "#1f2025",
                      border: "1px solid rgb(108, 117, 125)",
                      borderRadius: "30px",
                      color: "rgb(255, 255, 255)",
                    }}
                  >
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                    <option value="IMAX">IMAX</option>
                    <option value="4DX">4DX</option>
                    <option value="Dolby Atmos">Dolby Atmos</option>
                  </select>
                </div>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <label
                    className="form-label form-label-beautiful"
                    style={{ color: "rgb(255, 255, 255)" }}
                  >
                    Sound System
                  </label>
                  <select
                    className="form-select"
                    value={screenFormData.soundSystem}
                    onChange={(e) =>
                      setScreenFormData({
                        ...screenFormData,
                        soundSystem: e.target.value,
                      })
                    }
                    style={{
                      background: "#1f2025",
                      border: "1px solid rgb(108, 117, 125)",
                      borderRadius: "30px",
                      color: "rgb(255, 255, 255)",
                    }}
                  >
                    <option value="Stereo">Stereo</option>
                    <option value="Dolby Digital">Dolby Digital</option>
                    <option value="Dolby Atmos">Dolby Atmos</option>
                    <option value="DTS">DTS</option>
                    <option value="IMAX Sound">IMAX Sound</option>
                  </select>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <label
                    className="form-label form-label-beautiful"
                    style={{ color: "rgb(255, 255, 255)" }}
                  >
                    Projection Type
                  </label>
                  <select
                    className="form-select"
                    value={screenFormData.projectionType}
                    onChange={(e) =>
                      setScreenFormData({
                        ...screenFormData,
                        projectionType: e.target.value,
                      })
                    }
                    style={{
                      background: "#1f2025",
                      border: "1px solid rgb(108, 117, 125)",
                      borderRadius: "30px",
                      color: "rgb(255, 255, 255)",
                    }}
                  >
                    <option value="Digital">Digital</option>
                    <option value="Film">Film</option>
                    <option value="Laser">Laser</option>
                  </select>
                </div>
              </Col>
            </Row>

            <div className="text-center">
              <button
                type="button"
                className="btn btn-outline-info"
                onClick={onConfigureSeatLayout}
                style={{ borderRadius: "30px" }}
              >
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 512 512"
                  className="me-2"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"></path>
                </svg>
                Configure Seat Layout
              </button>
              <p className="text-secondary mt-2 mb-0">
                {screenFormData.seatLayout?.length > 0
                  ? `Custom layout configured (${screenFormData.seatLayout.reduce(
                      (total, row) =>
                        total + row.seats.filter((s) => s !== null).length,
                      0
                    )} seats)`
                  : "Default layout will be used"}
              </p>
            </div>
          </Form>
        </div>

        <div
          className="modal-footer modal-footer-beautiful"
          style={{
            background: "#1f2025",
            border: "none",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-beautiful-secondary"
            onClick={onHide}
            style={{ borderRadius: "30px" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-beautiful-primary"
            style={{
              background: "linear-gradient(135deg, #e63946, #f84565)",
              border: "none",
              borderRadius: "30px",
            }}
            onClick={(e) => {
              e.preventDefault();
              onSubmit(e);
            }}
          >
            Add Screen
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddScreenModal;
