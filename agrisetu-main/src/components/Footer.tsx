import { Link } from "react-router-dom";
import { Sprout, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="hidden md:block bg-card border-t border-border/40 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Sprout className="h-4 w-4 text-primary-foreground" />
              </div>
              AgriSetu
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering farmers with technology. Rent equipment, hire labor, and grow together.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4">Services</h4>
            <ul className="space-y-2.5">
              {[
                { to: "/equipment", label: t("equipment") },
                { to: "/labor", label: t("labor") },
                { to: "/group-labor", label: t("groupLabor") },
                { to: "/finance", label: t("finance") },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4">Help</h4>
            <ul className="space-y-2.5">
              {["FAQs", "Support", "Terms of Service", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" /> support@agrisetu.in
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" /> +91 98765 43210
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" /> India
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AgriSetu. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
