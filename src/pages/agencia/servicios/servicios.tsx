import { useState } from "react";
import "./servicios.css";

type PanelKey = "include" | "disposal" | "presale" | "sale";

export default function Servicios() {
  const [open, setOpen] = useState<Record<PanelKey, boolean>>({
    include: true,
    disposal: false,
    presale: false,
    sale: false,
  });

  const toggle = (k: PanelKey) =>
    setOpen((s) => ({ ...s, [k]: !s[k] }));

  return (
    <main className="services-page">
      {/* HERO */}
      <section className="services-hero" aria-label="Services hero">
        <div className="services-hero-img" role="img" aria-label="Happy clients meeting" />
      </section>

      {/* INTRO */}
      <section className="services-intro container">
        <p className="eyebrow center">Our services</p>
        <h1 className="page-title center">Consultancy, Advice and Marketing.</h1>
        <p className="lead center">
          The exclusivity of our brand—together with the technical level of our professionals—
          allows us to provide specialised consultancy for buying and selling, renting, appraisals,
          valuations, advice and marketing, both nationally and internationally, across residential,
          investment, commercial and tertiary markets. We apply clear, flexible guidelines to define
          the path and adapt to evolving needs, ensuring quality at every step.
        </p>
      </section>

      {/* LAYOUT: LEFT TITLE + RIGHT ACCORDION */}
      <section className="services-grid container">
        <div className="left-title">
          <p className="eyebrow">We are</p>
          <h2 className="big-title">
            Much more than real estate agents.
          </h2>
        </div>

        <div className="right-accordion">
          {/* GROUP HEADER */}
          <div className="group-header">
            <span className="caret caret-down" aria-hidden="true" />
            <span className="group-title">Our services include</span>
          </div>

          {/* PANEL 1 */}
          <button
            className="acc-summary"
            onClick={() => toggle("include")}
            aria-expanded={open.include}
            aria-controls="panel-include"
          >
            <span className={`caret ${open.include ? "caret-up" : "caret-down"}`} aria-hidden="true" />
            <span>Periodic advertising</span>
          </button>
          <div id="panel-include" className={`acc-panel ${open.include ? "open" : ""}`}>
            <ul className="list">
              <li>Local, national and international press.</li>
              <li>Real estate portals and premium placements.</li>
              <li>Official site presence and campaign tracking.</li>
              <li>Direct mail to residents and businesses in the area.</li>
              <li>Personalised offers to owners and developers with current listings.</li>
              <li>General offers to our entire customer base.</li>
            </ul>

            <h4 className="subheading">Commercialisation efforts</h4>
            <ul className="list">
              <li>Comprehensive advice through purchase/sale or rental.</li>
              <li>Market research, advertising and performance analytics.</li>
              <li>Marketing actions and customer acquisition.</li>
              <li>Reservation management and signalling.</li>
              <li>Contract formalisation and deed coordination.</li>
            </ul>
          </div>

          {/* PANEL 2 */}
          <button
            className="acc-summary"
            onClick={() => toggle("disposal")}
            aria-expanded={open.disposal}
            aria-controls="panel-disposal"
          >
            <span className={`caret ${open.disposal ? "caret-up" : "caret-down"}`} aria-hidden="true" />
            <span>We place at your disposal</span>
          </button>
          <div id="panel-disposal" className={`acc-panel ${open.disposal ? "open" : ""}`}>
            <ol className="list numbered">
              <li>Extensive client portfolio endorsed by thousands of referrals.</li>
              <li>Professional commercial network.</li>
              <li>National–regional–zonal press.</li>
              <li>Guides, reports and appearances in sector media.</li>
              <li>Outdoor and promotional poster formats.</li>
              <li>Internet presence (portals and own site).</li>
              <li>Fairs and events in Madrid, Barcelona and Costa del Sol.</li>
            </ol>
          </div>

          {/* PANEL 3 */}
          <button
            className="acc-summary"
            onClick={() => toggle("presale")}
            aria-expanded={open.presale}
            aria-controls="panel-presale"
          >
            <span className={`caret ${open.presale ? "caret-up" : "caret-down"}`} aria-hidden="true" />
            <span>Pre-sale</span>
          </button>
          <div id="panel-presale" className={`acc-panel ${open.presale ? "open" : ""}`}>
            <ul className="list">
              <li>Waiting list management for qualified buyers.</li>
              <li>Creation of posters and billboards adapted to each asset.</li>
              <li>Preparation of documentation and media kits.</li>
            </ul>
          </div>

          {/* PANEL 4 */}
          <button
            className="acc-summary"
            onClick={() => toggle("sale")}
            aria-expanded={open.sale}
            aria-controls="panel-sale"
          >
            <span className={`caret ${open.sale ? "caret-up" : "caret-down"}`} aria-hidden="true" />
            <span>Sale</span>
          </button>
          <div id="panel-sale" className={`acc-panel ${open.sale ? "open" : ""}`}>
            <ul className="list">
              <li>National press advertising and digital campaigns.</li>
              <li>Promotion on our website and main portals.</li>
              <li>Briefing to the sales network and constant feedback.</li>
              <li>Timely information to owners on marketing progress.</li>
              <li>Closing supervised by our Commercial Director.</li>
            </ul>
          </div>
        </div>
      </section>

       {/* ===== CONTACT (antes del footer) ===== */}
      <section className="services-contact container" aria-label="Contact form">
        <div className="contact-grid">
          <div
            className="contact-photo"
            role="img"
            aria-label="Elegant meeting room"
          />
          <form
            className="contact-form"
            onSubmit={(e) => {
              e.preventDefault();
              // aquí puedes enganchar tu lógica/envío
            }}
          >
            <div className="form-row">
              <label htmlFor="name">Name</label>
              <input id="name" type="text" placeholder="Your name" required />
            </div>

            <div className="form-row two">
              <div>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone">Phone</label>
                <input id="phone" type="tel" placeholder="+34 ..." />
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                rows={6}
                placeholder="Tell us about your needs..."
              />
            </div>

            <div className="form-actions">
              <label className="checkbox">
                <input type="checkbox" required />
                <span>
                  I have read and accepted the privacy policy and terms and
                  conditions.
                </span>
              </label>
              <button type="submit" className="btn-send">
                Enviar
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ====== FOOTER (mismo que en Who) ====== */}
      <footer className="servicios-footer">
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
    </main>
  );
}

