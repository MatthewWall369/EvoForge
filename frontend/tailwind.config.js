export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050816",
        panel: "rgba(15, 23, 42, 0.72)",
        cyanforge: "#22d3ee",
        violetforge: "#a855f7",
      },
      boxShadow: {
        glow: "0 0 28px rgba(34, 211, 238, 0.22)",
      },
    },
  },
  plugins: [],
};
