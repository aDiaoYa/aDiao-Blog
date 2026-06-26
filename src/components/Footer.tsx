import Link from "next/link";
import { SITE, NAV_ITEMS, SOCIAL, FOOTER } from "@/lib/constants";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-icon">{SITE.icon}</span>
          <strong>{SITE.title}</strong>
        </div>
        <div className="footer-links">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </div>
        <div className="footer-social">
          <a
            href={SOCIAL.github}
            target="_blank"
            rel="noopener"
            title="GitHub"
            aria-label="GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
        <div className="footer-info">
          <span>&copy; {FOOTER.copyrightYear}{year > FOOTER.copyrightYear ? `-${year}` : ""} {SITE.title}</span>
          <span className="footer-dot">·</span>
          <a href={FOOTER.licenseUrl} target="_blank" rel="noopener">
            {FOOTER.license}
          </a>
          <span className="footer-dot">·</span>
          <span>
            Powered by{" "}
            <a href={FOOTER.poweredByUrl} target="_blank" rel="noopener">
              {FOOTER.poweredBy}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
