module.exports = {
  theme: {
    extend: {
      colors: {
        brand: "#1A3A5C",
        accent: "#E07B2A",
        warm: "#F2C94C",
        bg: "#FDFAF4",
        "bg-alt": "#EEF4F0",
        "bg-dark": "#1A3A5C",
        surface: "#FFFFFF",
        "surface-warm": "#FFF8EE",
        text: "#1A1A1A",
        "text-light": "#555555",
        "text-inv": "#FFFFFF",
        success: "#3A8C5C",
        error: "#C0392B",
        locked: "#BBBBBB",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Nunito", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "16px",
        lg: "24px",
        pill: "100px",
        blob: "60% 40% 50% 60% / 50% 60% 40% 50%",
      },
      boxShadow: {
        card: "0 2px 20px rgba(26,58,92,0.08)",
        "card-hover": "0 12px 40px rgba(26,58,92,0.15)",
        accent: "0 8px 24px rgba(224,123,42,0.35)",
      },
    },
  },
};
