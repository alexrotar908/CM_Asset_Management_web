import React, { useState } from 'react';
import './contacto.css';

const Contacto: React.FC = () => {
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', mensaje: '', consentimiento: false });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value, type } = e.target;

  const newValue = type === 'checkbox'
    ? (e.target as HTMLInputElement).checked
    : value;

  setForm(prev => ({
    ...prev,
    [name]: newValue,
  }));
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(form);
    // Aquí podrías conectar con n8n o Supabase
    alert('Mensaje enviado');
    setForm({ nombre: '', apellido: '', email: '', mensaje: '', consentimiento: false });
  };

  return (

    <div className="contacto-page">
    <div className="contacto-container">
      <h2>Contact</h2>
      <div className="form-info-wrapper">
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-row">
            <input type="text" name="nombre" placeholder="Your name..." required value={form.nombre} onChange={handleChange} />
            <input type="text" name="apellido" placeholder="Your surname..." required value={form.apellido} onChange={handleChange} />
          </div>
          <input type="email" name="email" placeholder="Email..." required value={form.email} onChange={handleChange} />
          <textarea name="mensaje" placeholder="How can we help you..." required value={form.mensaje} onChange={handleChange} />
          <div className="gdpr-checkbox">
            <input type="checkbox" name="consentimiento" checked={form.consentimiento} onChange={handleChange} />
            <label>I give my consent for this website to store the submitted information.</label>
          </div>
          <button type="submit">Enviar</button>
        </form>

        <div className="contact-info">
          <h4>Quality Keys Inmobiliarios Madrid</h4>
          <p>Ave. Juan Antonio Samaranch S/N</p>
          <p>28055 – Madrid</p>
          <p>+34 911 644 182</p>

          <h4>Office hours Madrid</h4>
          <p>M – F: From 10AM to 7PM</p>
          <p>Sat: From 10AM to 2PM</p>

          <h4>Quality Keys Inmobiliarios Marbella</h4>
          <p>St./ El Califa, Urb. Las Lolas, Edificio C, local 6</p>
          <p>29660 – Nueva Andalucía (Marbella)</p>
          <p>+34 951 568 381</p>

          <h4>Office hours Marbella</h4>
          <p>M – F: 9:30AM to 2:30PM and 3:00PM to 6:00PM</p>
        </div>
      </div>

      <div className="map-wrapper">
        <h4>Madrid Office</h4>
        <iframe
          title="Madrid Map"
          src="https://www.google.com/maps?q=Av.+de+Juan+Antonio+Samaranch,+28055+Madrid,+España&output=embed"
          width="100%"
          height="300"
          style={{ border: 0 }}
          loading="lazy"
        ></iframe>

        <h4>Marbella Office</h4>
        <iframe
          title="Marbella Map"
          src="https://www.google.com/maps?q=29660+Nueva+Andalucía,+Marbella,+España&output=embed"
          width="100%"
          height="300"
          style={{ border: 0 }}
          loading="lazy"
        ></iframe>
      </div>
      </div>

      <footer className="contacto-footer">
        <div className="footer-top">
          <div className="footer-location">
            <h4>📍 MADRID</h4>
            <p>Avda. Juan Antonio Samaranch S/N<br />28055 – Madrid</p>
            <p>📞 +34 911 644 182</p>
            <p>📧 info@qualitykeys.es</p>
          </div>
          <div className="footer-location">
            <h4>📍 MARBELLA</h4>
            <p>Calle El Califa, Urbanización Las Lolas, Edificio C, Local 6.<br />29660 Nueva Andalucía, Marbella</p>
            <p>📞 +34 951 568 381</p>
            <p>📧 marbella@qualitykeys.es</p>
          </div>
          <div className="footer-links">
            <h4>Useful links</h4>
            <ul>
              <li><a href="#">Legal Notice</a></li>
              <li><a href="#">Cookie Policy</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="logo-socials">
            <img src="/logo_white.png" alt="QualityKeys" className="footer-logo" />
            <div className="social-icons">
              <a href="#"><i className="fab fa-pinterest" /></a>
              <a href="#"><i className="fab fa-linkedin-in" /></a>
              <a href="#"><i className="fab fa-instagram" /></a>
            </div>
          </div>
          <p className="copyright">© 102web - All rights reserved</p>
        </div>
      </footer>

    </div>

    
  );
};

export default Contacto;
