import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Badge,
  InputGroup,
  Alert,
  Tabs,
  Tab,
  Table,
} from "react-bootstrap";
import "../../styles/admin-theaters.css";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
  FaDesktop,
  FaEye,
  FaCog,
} from "react-icons/fa";
import { toast } from "react-toastify";
import AdminLayout from "../../components/admin/AdminLayout";
import ModernLoader from "../../components/common/ModernLoader";
import SeatLayoutBuilder from "../../components/admin/SeatLayoutBuilder";
import AddScreenModal from "../../components/admin/AddScreenModal";
import api from "../../services/api";

const AdminTheaters = () => {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showScreenModal, setShowScreenModal] = useState(false);
  const [showSeatLayoutModal, setShowSeatLayoutModal] = useState(false);
  const [editingTheater, setEditingTheater] = useState(null);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("theaters");

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    address: {
      city: "",
      state: "",
    },
    contactInfo: {
      phone: "",
      email: "",
    },
    amenities: "",
    status: {
      isActive: true,
      isVerified: false,
    },
  });

  const [screenFormData, setScreenFormData] = useState({
    name: "",
    screenType: "2D",
    soundSystem: "Stereo",
    projectionType: "Digital",
    seatLayout: [],
  });

  useEffect(() => {
    fetchTheaters();
  }, []);

  const fetchTheaters = async () => {
    try {
      setLoading(true);
      console.log("Fetching theaters...");

      const response = await api.get("/theaters");
      console.log("API response:", response.data);

      let theatersData = [];
      if (response.data.theaters) {
        theatersData = response.data.theaters;
      } else if (Array.isArray(response.data)) {
        theatersData = response.data;
      } else if (response.data.data) {
        theatersData = response.data.data;
      }

      // Filter out null/invalid theaters
      const validTheaters = theatersData.filter(
        (theater) => theater && theater._id && typeof theater === "object"
      );

      console.log("Valid theaters:", validTheaters);
      setTheaters(validTheaters);
    } catch (error) {
      console.error("Fetch theaters error:", error);
      toast.error("Failed to fetch theaters");
      setTheaters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        amenities:
          typeof formData.amenities === "string"
            ? formData.amenities
                .split(",")
                .map((a) => a.trim())
                .filter((a) => a)
            : formData.amenities || [],
      };

      console.log("Submitting theater data:", submitData);

      if (editingTheater && editingTheater._id) {
        await api.put(`/theaters/${editingTheater._id}`, submitData);
        toast.success("Theater updated successfully!");
      } else {
        await api.post("/theaters", submitData);
        toast.success("Theater created successfully!");
      }

      await fetchTheaters();
      handleCloseModal();
    } catch (error) {
      console.error("Theater save error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to save theater";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (theaterId, theaterName) => {
    if (!theaterId) {
      toast.error("Invalid theater ID");
      return;
    }

    const theater = theaters.find(t => t._id === theaterId);
    const confirmMessage = `Are you sure you want to permanently delete "${theaterName || theater?.name || 'this theater'}"?\n\nThis will:\n• Remove the theater completely from the database\n• Delete all screens and seat layouts\n• Cancel all shows and bookings for this theater\n\nThis action cannot be undone!`;

    if (window.confirm(confirmMessage)) {
      try {
        await api.delete(`/theaters/${theaterId}`);
        toast.success(`"${theaterName || theater?.name || 'Theater'}" deleted successfully!`);
        await fetchTheaters();
      } catch (error) {
        console.error("Theater delete error:", error);
        toast.error("Failed to delete theater: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleEdit = (theater) => {
    console.log("Editing theater:", theater);

    if (!theater) {
      console.error("Theater is null or undefined");
      toast.error("Cannot edit: Theater data is missing");
      return;
    }

    if (!theater._id) {
      console.error("Theater ID is missing:", theater);
      toast.error("Cannot edit: Theater ID is missing");
      return;
    }

    setEditingTheater(theater);
    setFormData({
      name: theater.name || "",
      location: theater.location || "",
      address: {
        city: theater.address?.city || theater.city || "",
        state: theater.address?.state || "",
      },
      contactInfo: {
        phone: theater.contactInfo?.phone || "",
        email: theater.contactInfo?.email || "",
      },
      amenities: Array.isArray(theater.amenities)
        ? theater.amenities.join(", ")
        : theater.amenities || "",
      status: {
        isActive: theater.status?.isActive !== false,
        isVerified: theater.status?.isVerified || false,
      },
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTheater(null);
    setFormData({
      name: "",
      location: "",
      address: { city: "", state: "" },
      contactInfo: { phone: "", email: "" },
      amenities: "",
      status: { isActive: true, isVerified: false },
    });
  };

  const handleAddScreen = async (e) => {
    e.preventDefault();
    if (!selectedTheater) {
      toast.error("No theater selected");
      return;
    }

    try {
      console.log('Adding screen to theater:', selectedTheater._id);
      console.log('Screen form data:', screenFormData);
      
      const screenData = {
        name: screenFormData.name || `Screen ${(selectedTheater.screens?.length || 0) + 1}`,
        screenType: screenFormData.screenType || '2D',
        soundSystem: screenFormData.soundSystem || 'Stereo',
        projectionType: screenFormData.projectionType || 'Digital',
        seatLayout: screenFormData.seatLayout?.length > 0 ? screenFormData.seatLayout : undefined,
      };
      
      console.log('Sending screen data:', screenData);

      const response = await api.post(`/theaters/${selectedTheater._id}/screens`, screenData);
      console.log('Screen added response:', response.data);
      
      toast.success("Screen added successfully!");
      await fetchTheaters();
      setShowScreenModal(false);
      setScreenFormData({
        name: "",
        screenType: "2D",
        soundSystem: "Stereo",
        projectionType: "Digital",
        seatLayout: [],
      });
    } catch (error) {
      console.error("Add screen error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to add screen";
      toast.error(errorMessage);
    }
  };

  const handleDeleteScreen = async (theaterId, screenId, screenName) => {
    const theater = theaters.find(t => t._id === theaterId);
    const screen = theater?.screens?.find(s => s._id === screenId);
    const theaterName = theater?.name || 'Unknown Theater';
    const displayScreenName = screenName || screen?.name || 'Unknown Screen';
    
    const confirmMessage = `Are you sure you want to delete "${displayScreenName}" from "${theaterName}"?\n\nThis will:\n• Remove the screen permanently\n• Delete the seat layout\n• Cancel all shows for this screen\n\nThis action cannot be undone!`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await api.delete(`/theaters/${theaterId}/screens/${screenId}`);
        toast.success(`"${displayScreenName}" deleted successfully from "${theaterName}"!`);
        await fetchTheaters();
      } catch (error) {
        console.error("Delete screen error:", error);
        toast.error("Failed to delete screen: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleEditSeatLayout = (theater, screen) => {
    setSelectedTheater(theater);
    setSelectedScreen(screen);
    setShowSeatLayoutModal(true);
  };

  const handleSaveSeatLayout = async (seatLayout) => {
    if (!selectedTheater || !selectedScreen) return;

    try {
      await api.put(
        `/theaters/${selectedTheater._id}/screens/${selectedScreen._id}/layout`,
        {
          seatLayout,
        }
      );
      toast.success("Seat layout updated successfully!");
      await fetchTheaters();
      setShowSeatLayoutModal(false);
    } catch (error) {
      console.error("Update seat layout error:", error);
      toast.error("Failed to update seat layout");
    }
  };

  const filteredTheaters = theaters.filter((theater) => {
    if (!theater || !theater.name) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      theater.name.toLowerCase().includes(searchLower) ||
      (theater.location &&
        theater.location.toLowerCase().includes(searchLower)) ||
      (theater.address?.city &&
        theater.address.city.toLowerCase().includes(searchLower)) ||
      (theater.city && theater.city.toLowerCase().includes(searchLower))
    );
  });

  if (loading) return <ModernLoader text="Loading Theaters" />;

  return (
    <AdminLayout>
      <div className="theater-management-container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="gradient-text mb-2">Theater Management</h1>
            <p className="text-secondary mb-0">
              Manage cinema theaters and screens
            </p>
          </div>
          <Button
            className="theater-btn-primary px-4 py-2"
            onClick={() => setShowModal(true)}
          >
            <FaPlus className="me-2" />
            Add Theater
          </Button>
        </div>

        {/* Debug Info */}
        <Alert variant="info" className="mb-4">
          <strong>Status:</strong> Found {theaters.length} theaters in database
          {theaters.length > 0 && (
            <div className="mt-2">
              <small>
                Theaters: {theaters.map((t) => t.name || "Unnamed").join(", ")}
              </small>
            </div>
          )}
        </Alert>

        {/* Search - matching shows page layout */}
        <div className="filters-container mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
            <h5 className="text-white mb-2 mb-md-0 d-flex align-items-center">
              <FaSearch className="me-2 text-primary" />
              Search Theaters
            </h5>
            <Button 
              variant="outline-secondary"
              size="sm"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </Button>
          </div>
          <Row className="g-3">
            <Col lg={8} md={8} xs={12}>
              <div className="d-flex align-items-center border border-secondary rounded-pill px-3 overflow-hidden" style={{ height: '46px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 30 30" fill="#6B7280">
                  <path d="M13 3C7.489 3 3 7.489 3 13s4.489 10 10 10a9.95 9.95 0 0 0 6.322-2.264l5.971 5.971a1 1 0 1 0 1.414-1.414l-5.97-5.97A9.95 9.95 0 0 0 23 13c0-5.511-4.489-10-10-10m0 2c4.43 0 8 3.57 8 8s-3.57 8-8 8-8-3.57-8-8 3.57-8 8-8"/>
                </svg>
                <Form.Control
                  type="text"
                  placeholder="Search theaters by name, location, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 bg-transparent w-100 h-100 ms-2"
                  style={{ 
                    outline: 'none', 
                    boxShadow: 'none', 
                    color: '#ffffff', 
                    fontSize: '16px',
                    fontWeight: '400'
                  }}
                />
              </div>
            </Col>
            <Col lg={4} md={4} xs={12}>
              <Button
                variant="outline-secondary"
                onClick={() => setSearchTerm('')}
                className="w-100 rounded-pill"
                style={{ height: '46px' }}
              >
                Clear Search
              </Button>
            </Col>
          </Row>
        </div>

        {/* Tabs for Theater and Screen Management */}
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4 theater-tabs"
          variant="pills"
        >
          <Tab eventKey="theaters" title="Theaters">
            {/* Theater Cards - Professional Layout */}
            <div className="cards-container mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {filteredTheaters.length > 0 ? (
                <Row className="g-4">
                  {filteredTheaters.map((theater) => {
                    if (!theater || !theater._id) {
                      console.warn("Skipping invalid theater:", theater);
                      return null;
                    }

                    return (
                      <Col key={theater._id} xl={4} lg={6} md={6} sm={12} className="d-flex">
                        <Card className="theater-card h-100 w-100" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <h5 className="mb-0 text-white fw-bold">
                                {theater.name || "Unnamed Theater"}
                              </h5>
                              <Badge
                                bg={
                                  theater.status?.isActive !== false
                                    ? "success"
                                    : "danger"
                                }
                                style={{ fontSize: "0.75rem" }}
                              >
                                {theater.status?.isActive !== false
                                  ? "Active"
                                  : "Inactive"}
                              </Badge>
                            </div>

                            <div className="mb-3">
                              <div className="d-flex align-items-center mb-2">
                                <FaMapMarkerAlt className="me-2 text-primary" />
                                <small className="text-secondary">
                                  {theater.location || "No location specified"}
                                </small>
                              </div>

                              <div className="d-flex align-items-center mb-2">
                                <FaBuilding
                                  className="me-2"
                                  style={{ color: "#28a745" }}
                                />
                                <small style={{ color: "#adb5bd" }}>
                                  City:{" "}
                                  {theater.address?.city || theater.city || "N/A"}
                                </small>
                              </div>

                              <div className="d-flex align-items-center mb-2">
                                <FaDesktop
                                  className="me-2"
                                  style={{ color: "#ffc107" }}
                                />
                                <small style={{ color: "#adb5bd" }}>
                                  Screens:{" "}
                                  {theater.screens?.length ||
                                    theater.totalScreens ||
                                    0}
                                </small>
                              </div>

                              {theater.contactInfo?.phone && (
                                <div className="d-flex align-items-center">
                                  <FaPhone
                                    className="me-2"
                                    style={{ color: "#6f42c1" }}
                                  />
                                  <small style={{ color: "#adb5bd" }}>
                                    {theater.contactInfo.phone}
                                  </small>
                                </div>
                              )}
                            </div>

                            <div className="d-flex gap-2 flex-wrap">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2 theater-btn-outline"
                                onClick={() => handleEdit(theater)}
                              >
                                <FaEdit className="me-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="me-2 theater-btn-outline"
                                onClick={() => {
                                  if (theater && theater._id) {
                                    setSelectedTheater(theater);
                                    setShowScreenModal(true);
                                  } else {
                                    toast.error("Invalid theater data");
                                  }
                                }}
                              >
                                <FaPlus className="me-1" />
                                Screen
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="theater-btn-outline"
                                onClick={() => {
                                  if (theater && theater._id) {
                                    handleDelete(theater._id, theater.name);
                                  } else {
                                    toast.error("Invalid theater ID");
                                  }
                                }}
                                title="Delete Theater"
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              ) : (
                <div className="text-center py-5" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '15px' }}>
                  <FaBuilding className="text-primary mb-3" size={50} style={{ opacity: 0.5 }} />
                  <h4 className="text-white mb-3">No Theaters Found</h4>
                  <p className="text-secondary mb-4">
                    {theaters.length === 0
                      ? "No theaters in database. Add some theaters to get started."
                      : "No theaters match your search criteria."}
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2"
                  >
                    <FaPlus className="me-2" />
                    Add First Theater
                  </Button>
                </div>
              )}
            </div>
          </Tab>

          <Tab eventKey="screens" title="Screen Management">
            {/* Screen Management */}
            <div className="screens-container mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {theaters.map((theater) =>
                theater.screens && theater.screens.length > 0 ? (
                  <div key={theater._id} className="mb-4">
                    <Card
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <Card.Header
                        style={{
                          background: "transparent",
                          borderBottom: "1px solid #495057",
                        }}
                      >
                        <h5 className="text-white mb-0">{theater.name}</h5>
                        <small className="text-secondary">
                          {theater.location}
                        </small>
                      </Card.Header>
                      <Card.Body>
                        <Table responsive variant="dark" className="mb-0 theater-table">
                          <thead>
                            <tr>
                              <th>Screen</th>
                              <th>Type</th>
                              <th>Capacity</th>
                              <th>Sound</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {theater.screens.map((screen) => (
                              <tr key={screen._id}>
                                <td>{screen.name}</td>
                                <td>
                                  <Badge bg="info" className={`screen-type-badge screen-type-${screen.screenType.toLowerCase()}`}>{screen.screenType}</Badge>
                                </td>
                                <td>{screen.capacity} seats</td>
                                <td>{screen.soundSystem}</td>
                                <td>
                                  <Badge
                                    bg={screen.isActive ? "success" : "danger"}
                                    className={screen.isActive ? "theater-badge-success" : "theater-badge-danger"}
                                  >
                                    {screen.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() =>
                                        handleEditSeatLayout(theater, screen)
                                      }
                                    >
                                      <FaCog className="me-1" />
                                      Layout
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteScreen(
                                          theater._id,
                                          screen._id,
                                          screen.name
                                        )
                                      }
                                      title="Delete Screen"
                                    >
                                      <FaTrash />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </div>
                ) : null
              )}
            </div>
          </Tab>
        </Tabs>

        {/* Theater Form Modal */}
        <Modal
          show={showModal}
          onHide={handleCloseModal}
          size="lg"
          backdrop="static"
          className="theater-modal"
        >
          <Modal.Header
            closeButton
          >
            <Modal.Title style={{ color: "#fff" }}>
              {editingTheater ? "Edit Theater" : "Add New Theater"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Theater Name *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="theater-form-control"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>City *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.address.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            city: e.target.value,
                          },
                        })
                      }
                      required
                      className="theater-form-control"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label style={{ color: "#fff" }}>
                  Location/Address *
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                  style={{
                    background: "#495057",
                    border: "1px solid #6c757d",
                    color: "#fff",
                  }}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: "#fff" }}>
                      Contact Phone
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.contactInfo.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactInfo: {
                            ...formData.contactInfo,
                            phone: e.target.value,
                          },
                        })
                      }
                      style={{
                        background: "#495057",
                        border: "1px solid #6c757d",
                        color: "#fff",
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: "#fff" }}>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.contactInfo.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactInfo: {
                            ...formData.contactInfo,
                            email: e.target.value,
                          },
                        })
                      }
                      style={{
                        background: "#495057",
                        border: "1px solid #6c757d",
                        color: "#fff",
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label style={{ color: "#fff" }}>
                  Amenities (comma separated)
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.amenities}
                  onChange={(e) =>
                    setFormData({ ...formData, amenities: e.target.value })
                  }
                  placeholder="AC, Parking, Food Court, etc."
                  style={{
                    background: "#495057",
                    border: "1px solid #6c757d",
                    color: "#fff",
                  }}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="activeTheater"
                      label="Active Theater"
                      checked={formData.status.isActive}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: {
                            ...formData.status,
                            isActive: e.target.checked,
                          },
                        })
                      }
                      className="text-white"
                      style={{ 
                        color: "#fff",
                        fontSize: "1rem",
                        fontWeight: "500"
                      }}
                    />
                    <Form.Text className="text-muted">
                      Inactive theaters won't be visible to users
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="verifiedTheater"
                      label="Verified Theater"
                      checked={formData.status.isVerified}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: {
                            ...formData.status,
                            isVerified: e.target.checked,
                          },
                        })
                      }
                      className="text-white"
                      style={{ 
                        color: "#fff",
                        fontSize: "1rem",
                        fontWeight: "500"
                      }}
                    />
                    <Form.Text className="text-muted">
                      Mark as verified for premium listing
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
              }}
            >
              {editingTheater ? "Update Theater" : "Add Theater"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Add Screen Modal */}
        <AddScreenModal
          show={showScreenModal}
          onHide={() => setShowScreenModal(false)}
          selectedTheater={selectedTheater}
          screenFormData={screenFormData}
          setScreenFormData={setScreenFormData}
          onSubmit={handleAddScreen}
          onConfigureSeatLayout={() => {
            setShowSeatLayoutModal(true);
            setShowScreenModal(false);
          }}
        />

        {/* Seat Layout Builder Modal */}
        <SeatLayoutBuilder
          show={showSeatLayoutModal}
          onHide={() => {
            setShowSeatLayoutModal(false);
            if (selectedTheater && !selectedScreen) {
              setShowScreenModal(true);
            }
          }}
          onSave={(seatLayout) => {
            if (selectedScreen) {
              handleSaveSeatLayout(seatLayout);
            } else {
              setScreenFormData({ ...screenFormData, seatLayout });
              setShowSeatLayoutModal(false);
              setShowScreenModal(true);
            }
          }}
          initialLayout={
            selectedScreen?.seatLayout || screenFormData.seatLayout
          }
        />
      </div>
    </AdminLayout>
  );
};

export default AdminTheaters;
