/* ===========================================================================
   하늘향 공통 스크립트
   - Supabase 클라이언트 싱글턴
   - 공통 유틸(HTML escape, 날짜 포맷, 스크롤 리빌)
   - 다크 모드 토글
   - 서비스 워커 등록
   =========================================================================== */
(function () {
  "use strict";

  var SUPABASE_URL = "https://eyoahkbqfxcisvmkvikp.supabase.co";
  var SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5b2Foa2JxZnhjaXN2bWt2aWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDAzODUsImV4cCI6MjA5NTAxNjM4NX0.-JgH5ACzfq-d96VXEZlXovXx0w_uR3gJiwonaushah8";

  var client = null;
  function supa() {
    if (!client && window.supabase) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return client;
  }

  /* ---- 유틸 ------------------------------------------------------------- */

  // 사용자/DB에서 온 문자열을 HTML에 넣기 전 이스케이프 (저장형 XSS 방지)
  function esc(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // 줄바꿈만 <br>로, 나머지는 이스케이프
  function escMultiline(value) {
    return esc(value).replace(/\n/g, "<br>");
  }

  function fmtDate(iso, opts) {
    try {
      return new Date(iso).toLocaleDateString(
        "ko-KR",
        opts || { year: "numeric", month: "long", day: "numeric" }
      );
    } catch (e) {
      return "";
    }
  }

  // 이미지 URL이 우리가 신뢰하는 출처인지 확인 (임의 src 주입 방지)
  function safeImg(url, fallback) {
    fallback = fallback || "./assets/icon1.png";
    if (!url || typeof url !== "string") return fallback;
    try {
      var u = new URL(url, window.location.href);
      if (u.protocol !== "https:" && u.protocol !== "http:") return fallback;
      var okHost =
        u.hostname === "eyoahkbqfxcisvmkvikp.supabase.co" ||
        u.hostname === "images.unsplash.com" ||
        u.hostname === window.location.hostname;
      return okHost ? u.href : fallback;
    } catch (e) {
      return fallback;
    }
  }

  // 업로드 전 이미지 축소/압축. 실패하면 원본 File 을 그대로 돌려준다.
  // maxDim: 가장 긴 변 최대 픽셀, quality: JPEG 품질(0~1)
  function resizeImage(file, maxDim, quality) {
    maxDim = maxDim || 1600;
    quality = quality || 0.85;
    return new Promise(function (resolve) {
      if (!file || !/^image\//.test(file.type) || file.type === "image/gif") {
        return resolve(file);
      }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          if (scale === 1 && file.size < 600 * 1024) {
            URL.revokeObjectURL(url);
            return resolve(file);
          }
          var canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            function (blob) {
              URL.revokeObjectURL(url);
              if (!blob || blob.size >= file.size) return resolve(file);
              resolve(new File([blob], (file.name || "image").replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }));
            },
            "image/jpeg",
            quality
          );
        } catch (e) {
          URL.revokeObjectURL(url);
          resolve(file);
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }

  function initReveal() {
    var reveals = document.querySelectorAll(".reveal:not(.active)");
    if (!reveals.length) return;
    if (!("IntersectionObserver" in window)) {
      reveals.forEach(function (el) {
        el.classList.add("active");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "50px" }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---- 다크 모드 ------------------------------------------------------- */
  // 초기 클래스 적용은 각 페이지 <head>의 인라인 스크립트가 담당(FOUC 방지).
  function currentTheme() {
    try {
      return localStorage.getItem("hy-theme") || "system";
    } catch (e) {
      return "system";
    }
  }
  function applyTheme(mode) {
    var dark =
      mode === "dark" ||
      (mode === "system" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#12140f" : "#17341c");
  }
  function setTheme(mode) {
    try {
      localStorage.setItem("hy-theme", mode);
    } catch (e) {}
    applyTheme(mode);
    updateThemeToggle();
  }
  function cycleTheme() {
    var order = ["system", "light", "dark"];
    var next = order[(order.indexOf(currentTheme()) + 1) % order.length];
    setTheme(next);
  }
  function updateThemeToggle() {
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    var mode = currentTheme();
    var icon = { system: "brightness_auto", light: "light_mode", dark: "dark_mode" }[mode];
    var label = { system: "시스템 설정", light: "라이트 모드", dark: "다크 모드" }[mode];
    btn.querySelector(".material-symbols-outlined").textContent = icon;
    btn.setAttribute("aria-label", "테마: " + label + " (눌러서 전환)");
    btn.setAttribute("title", "테마: " + label);
  }
  function initThemeToggle() {
    var btn = document.getElementById("themeToggle");
    // 테마 토글 버튼이 없는 페이지(관리자 등)는 다크 모드를 쓰지 않는다.
    if (!btn) return;
    btn.addEventListener("click", cycleTheme);
    updateThemeToggle();
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function () {
        if (currentTheme() === "system") applyTheme("system");
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  /* ---- 서비스 워커 --------------------------------------------------- */
  function registerSW(path) {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register(path || "./sw.js").catch(function () {});
    });
  }

  /* ---- 공개 API ----------------------------------------------------- */
  window.HY = {
    supa: supa,
    esc: esc,
    escMultiline: escMultiline,
    fmtDate: fmtDate,
    safeImg: safeImg,
    resizeImage: resizeImage,
    initReveal: initReveal,
    initThemeToggle: initThemeToggle,
    setTheme: setTheme,
    registerSW: registerSW,
  };

  document.addEventListener("DOMContentLoaded", initThemeToggle);

  // 뒤로가기(bfcache) 복귀 시 리빌 상태 복구
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) initReveal();
  });
})();
