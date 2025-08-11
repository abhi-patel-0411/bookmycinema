import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import './Footer.css';
import BrandLogo from './common/BrandLogo';


const Footer = () => {
    return (
        <footer className="custom-footer mt-5">
            <Container fluid className="px-4 px-md-5">
                <div className="pt-4 pb-4">
                    <Row className="justify-content-between border-bottom border-secondary pb-4 mb-4">
                        <Col md={4} className="mb-4 mb-md-0">
                            <BrandLogo className="mb-3" />
                            <p className="footer-text">
                                Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
                            </p>
                            <div className="d-flex gap-2 mt-3">
                                <img 
                                    src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/refs/heads/main/assets/appDownload/googlePlayBtnBlack.svg" 
                                    alt="google play" 
                                    className="app-download-btn"
                                />
                                <img 
                                    src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/refs/heads/main/assets/appDownload/appleStoreBtnBlack.svg" 
                                    alt="app store" 
                                    className="app-download-btn"
                                />
                            </div>
                        </Col>
                        <Col md={6}>
                            <Row>
                                <Col sm={6}>
                                    <h5 className="footer-heading">Company</h5>
                                    <ul className="footer-links">
                                        <li><a href="#">Home</a></li>
                                        <li><a href="#">About us</a></li>
                                        <li><a href="#">Contact us</a></li>
                                        <li><a href="#">Privacy policy</a></li>
                                    </ul>
                                </Col>
                                <Col sm={6}>
                                    <h5 className="footer-heading">Get in touch</h5>
                                    <div className="footer-contact">
                                        <p>+91 7016057005</p>
                                        <p>abhiposhiya0104@gmail.com</p>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <p className="text-center footer-copyright">
                        Copyright {new Date().getFullYear()} © BookCinema. All Rights Reserved.
                    </p>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;