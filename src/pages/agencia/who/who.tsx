import { Link } from "react-router-dom";
import "./who.css";

export default function Who() {
  return (
    <main className="who-page">
      {/* HERO */}
      <section className="who-hero" aria-label="Agency hero">
        <div className="who-hero-img" role="img" aria-label="Modern office" />
      </section>

      {/* INTRO */}
      <section className="who-intro container">
        <p className="who-eyebrow">Who</p>
        <h1 className="who-title">
          A company based on real estate management.
        </h1>
        <p className="who-lead">
          We were born with a clear purpose: to offer a specialized, transparent
          and results-driven service for buying, selling and managing real-estate
          assets. Our experience and personalized attention are the pillars of
          our philosophy, allowing us to interpret our clients’ needs and guide
          them through every step of their transaction.
        </p>
        <p className="who-lead subtle">
          Over the years, hundreds of clients have trusted our team for quality
          advice and a unique management approach, adapting to new needs while
          maintaining the highest standards of service.
        </p>
      </section>

      {/* WHAT */}
      <section className="who-split container">
        <div className="split-img">
          <div className="img img-what" role="img" aria-label="Advisor working on laptop" />
        </div>
        <div className="split-copy">
          <p className="eyebrow">What</p>
          <h2 className="section-title">
            We help our clients make the right decision
          </h2>
          <p>
            Many people have entrusted us with their dreams when it comes to
            finding and selling a quality, exclusive and unique property. We
            guide you through every step of your real-estate transaction,
            providing fully personalized attention and thorough market insight.
          </p>
          <p className="subtle">
            From needs analysis to closing, we coordinate all parties to ensure
            a smooth, safe and successful process.
          </p>
        </div>
      </section>

      {/* HOW */}
      <section className="who-split container reverse">
        <div className="split-img">
          <div className="img img-how" role="img" aria-label="Business meeting" />
        </div>
        <div className="split-copy">
          <p className="eyebrow">How</p>
          <h2 className="section-title">
            Quality service is our cornerstone
          </h2>
          <p>
            Financial advice, market research, curated listings and legal
            coordination are part of our method. Our sales division details each
            service and leverages a wide residential and tertiary portfolio,
            collaborating with individuals, developers and investors.
          </p>
          <p className="subtle">
            We eliminate friction—time, paperwork, and uncertainty—so you can
            operate efficiently and focus on your goals from day one.
          </p>
        </div>
      </section>

      {/* WHY */}
      <section className="who-split container">
        <div className="split-img">
          <div className="img img-why" role="img" aria-label="Handshake after closing a deal" />
        </div>
        <div className="split-copy">
          <p className="eyebrow">Why</p>
          <h2 className="section-title">
            Our goal: the satisfaction of our customers
          </h2>
          <p>
            Each person on our team studies their area of influence in depth to
            become expert managers in residential, investment and commercial
            assets—so we can give the best advice every time.
          </p>
          <p className="subtle">
            We present the best options for each demand and defend your
            interests at every stage—buy, sell or rent.
          </p>
        </div>
      </section>

      {/* TEAM */}
      <section className="who-team container">
        <div className="team-hero" role="img" aria-label="Real estate team" />
        <div className="team-copy">
          <p className="eyebrow">Our Team</p>
          <h2 className="section-title">
            The best team of real-estate professionals.
          </h2>
          <p className="subtle center">
            Our success lies in a commercial network made up of experienced
            advisors with deep knowledge of neighborhoods, services and
            facilities. We combine market data with on-the-ground criteria to
            offer the best strategic decisions.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="who-cta container">
        <p className="cta-text">
          Our greatest guarantee is the number of clients who recommend us.
          If you need any kind of real-estate service, we’ll be happy to help.
        </p>
        <Link to="/contacto" className="btn-primary" aria-label="Go to Contact">
          ✉️ Contact
        </Link>
      </section>

      <footer className="who-footer">
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
