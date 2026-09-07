/** @type {import('tailwindcss').Config} */

// 색상 토큰은 CSS 변수(RGB 삼원색)로 정의한다.
// 라이트/다크 값은 src/input.css 의 :root / html.dark 에서 스왑되므로
// 마크업의 bg-background, text-on-surface 등은 그대로 두면 다크 모드가 자동 적용된다.
function token(name) {
  return `rgb(var(--c-${name}) / <alpha-value>)`;
}

const colorNames = [
  "primary", "on-primary", "primary-container", "on-primary-container",
  "primary-fixed", "primary-fixed-dim", "on-primary-fixed", "on-primary-fixed-variant",
  "secondary", "on-secondary", "secondary-container", "on-secondary-container",
  "secondary-fixed", "secondary-fixed-dim", "on-secondary-fixed", "on-secondary-fixed-variant",
  "tertiary", "on-tertiary", "tertiary-container", "on-tertiary-container",
  "tertiary-fixed", "tertiary-fixed-dim", "on-tertiary-fixed", "on-tertiary-fixed-variant",
  "background", "on-background",
  "surface", "on-surface", "surface-tint", "surface-variant", "on-surface-variant",
  "surface-container", "surface-container-low", "surface-container-lowest",
  "surface-container-high", "surface-container-highest", "surface-dim", "surface-bright",
  "outline", "outline-variant",
  "error", "on-error", "error-container", "on-error-container",
  "inverse-surface", "inverse-on-surface", "inverse-primary",
];

const colors = {};
colorNames.forEach((n) => { colors[n] = token(n); });

module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./list.html",
    "./detail.html",
    "./offline.html",
    "./404.html",
    "./admin/**/*.html",
    "./assets/**/*.js",
  ],
  theme: {
    extend: {
      colors,
      borderRadius: { "DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem", "2xl": "1rem" },
      spacing: { "margin-mobile": "20px", "margin-desktop": "64px", "gutter": "24px", "base": "8px", "container-max": "1200px" },
      fontFamily: {
        "headline-lg": ["EB Garamond", "Noto Serif KR", "serif"],
        "label-lg": ["Hanken Grotesk", "Pretendard", "sans-serif"],
        "body-lg": ["Hanken Grotesk", "Pretendard", "sans-serif"],
        "headline-lg-mobile": ["EB Garamond", "Noto Serif KR", "serif"],
        "label-sm": ["Hanken Grotesk", "Pretendard", "sans-serif"],
        "headline-md": ["EB Garamond", "Noto Serif KR", "serif"],
        "display-lg": ["EB Garamond", "Noto Serif KR", "serif"],
        "body-md": ["Hanken Grotesk", "Pretendard", "sans-serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};
