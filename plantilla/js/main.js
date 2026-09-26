/* =====================================================================
   TORQUE — vanilla JavaScript. No jQuery, no plugins.
   One function per feature. Guard clauses. Respects reduced-motion.
   ===================================================================== */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky navbar shadow ---------- */
  function initStickyNav() {
    var nav = document.querySelector(".tq-nav");
    if (!nav) return;
    var onScroll = function () {
      nav.classList.toggle("scrolled", window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  function initMobileNav() {
    var burger = document.querySelector(".tq-burger");
    var menu = document.querySelector(".tq-mobile");
    var overlay = document.querySelector(".tq-overlay");
    var closeBtn = document.querySelector(".tq-mobile-close");
    if (!burger || !menu) return;

    var open = function () {
      menu.classList.add("open");
      if (overlay) overlay.classList.add("open");
      burger.classList.add("open");
      burger.setAttribute("aria-expanded", "true");
      document.body.classList.add("tq-lock");
    };
    var close = function () {
      menu.classList.remove("open");
      if (overlay) overlay.classList.remove("open");
      burger.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("tq-lock");
    };
    var toggle = function () {
      menu.classList.contains("open") ? close() : open();
    };

    burger.addEventListener("click", toggle);
    if (overlay) overlay.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) close();
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".tq-reveal");
    if (!els.length) return;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Count-up stats ---------- */
  function initCountUp() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;

    var run = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      var decimals = (target % 1 !== 0) ? 1 : 0;
      if (prefersReduced) {
        el.textContent = target.toLocaleString() + suffix;
        return;
      }
      var start = null, dur = 1600;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = target * eased;
        el.textContent = (decimals ? val.toFixed(1) : Math.round(val).toLocaleString()) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString() + suffix;
      };
      requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) {
      nums.forEach(run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Testimonials slider ---------- */
  function initTestimonials() {
    var root = document.querySelector("[data-testi]");
    if (!root) return;
    var track = root.querySelector(".tq-testi-track");
    var slides = root.querySelectorAll(".tq-testi-slide");
    var prev = root.querySelector("[data-testi-prev]");
    var next = root.querySelector("[data-testi-next]");
    if (!track || slides.length < 2) return;

    var index = 0;
    var perView = function () { return window.innerWidth >= 768 ? 2 : 1; };
    var maxIndex = function () { return Math.max(0, slides.length - perView()); };

    var render = function () {
      if (index > maxIndex()) index = maxIndex();
      var shift = (100 / perView()) * index;
      track.style.transform = "translateX(-" + shift + "%)";
      slides.forEach(function (s, i) {
        var visible = i >= index && i < index + perView();
        s.setAttribute("aria-hidden", visible ? "false" : "true");
      });
    };
    var go = function (dir) {
      index += dir;
      if (index < 0) index = maxIndex();
      if (index > maxIndex()) index = 0;
      render();
    };
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });
    window.addEventListener("resize", render);

    // Auto-advance (pause on hover / reduced motion)
    var timer = null;
    var start = function () {
      if (prefersReduced) return;
      stop();
      timer = setInterval(function () { go(1); }, 6000);
    };
    var stop = function () { if (timer) clearInterval(timer); };
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    render();
    start();
  }

  /* ---------- Services filter (services page) ---------- */
  function initFilter() {
    var wrap = document.querySelector("[data-filter]");
    if (!wrap) return;
    var buttons = wrap.querySelectorAll(".tq-filter-btn");
    var items = document.querySelectorAll(".tq-service-item");
    if (!buttons.length || !items.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-cat");
        buttons.forEach(function (b) {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        items.forEach(function (item) {
          var show = cat === "all" || item.getAttribute("data-cat") === cat;
          item.classList.toggle("is-hidden", !show);
        });
      });
    });
  }

  /* ---------- Cost estimator (services page) ---------- */
  function initEstimator() {
    var form = document.querySelector("[data-estimator]");
    if (!form) return;
    var svc = form.querySelector("[name=est_service]");
    var vehicle = form.querySelector("[name=est_vehicle]");
    var out = form.querySelector("[data-estimate-out]");
    if (!svc || !out) return;

    // Base price ranges (USD) keyed by service value
    var prices = {
      oil:        [49, 89],
      brakes:     [149, 320],
      diagnostics:[89, 89],
      tires:      [120, 260],
      ac:         [110, 240],
      transmission:[180, 520],
      battery:    [139, 220],
      inspection: [39, 59]
    };
    // Vehicle multiplier
    var mult = { compact: 1, sedan: 1.08, suv: 1.2, truck: 1.32, luxury: 1.45 };

    var update = function () {
      var key = svc.value;
      if (!key || !prices[key]) {
        out.querySelector(".val").textContent = "$—";
        out.querySelector("small").textContent = "Pick a service to see an estimate";
        return;
      }
      var m = mult[vehicle && vehicle.value ? vehicle.value : "sedan"] || 1;
      var lo = Math.round(prices[key][0] * m);
      var hi = Math.round(prices[key][1] * m);
      var text = lo === hi ? ("$" + lo) : ("$" + lo + "–$" + hi);
      out.querySelector(".val").textContent = text;
      out.querySelector("small").textContent = "Ballpark parts + labor. Final quote confirmed before any work.";
    };
    svc.addEventListener("change", update);
    if (vehicle) vehicle.addEventListener("change", update);
    update();
  }

  /* ---------- Form validation + fake submit ---------- */
  function initForms() {
    var forms = document.querySelectorAll("[data-validate]");
    if (!forms.length) return;

    forms.forEach(function (form) {
      form.setAttribute("novalidate", "novalidate");
      var success = form.querySelector(".tq-form-success");

      var validateField = function (field) {
        var input = field.querySelector("input, select, textarea");
        if (!input) return true;
        var ok = true;
        if (input.hasAttribute("required") && !input.value.trim()) ok = false;
        if (ok && input.type === "tel" && input.value.trim()) {
          ok = /[\d]{7,}/.test(input.value.replace(/[^\d]/g, ""));
        }
        if (ok && input.type === "email" && input.value.trim()) {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
        }
        field.classList.toggle("invalid", !ok);
        return ok;
      };

      form.querySelectorAll(".tq-field").forEach(function (field) {
        var input = field.querySelector("input, select, textarea");
        if (!input) return;
        input.addEventListener("blur", function () { validateField(field); });
        input.addEventListener("input", function () {
          if (field.classList.contains("invalid")) validateField(field);
        });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var valid = true;
        var firstBad = null;
        form.querySelectorAll(".tq-field").forEach(function (field) {
          var ok = validateField(field);
          if (!ok && !firstBad) firstBad = field;
          if (!ok) valid = false;
        });
        if (!valid) {
          if (firstBad) {
            var input = firstBad.querySelector("input, select, textarea");
            if (input) input.focus();
          }
          return;
        }
        if (success) {
          success.classList.add("show");
          success.setAttribute("role", "status");
        }
        form.reset();
        if (success) success.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
      });
    });
  }

  /* ---------- Copy coupon code ---------- */
  function initCoupons() {
    var codes = document.querySelectorAll("[data-copy]");
    if (!codes.length) return;
    codes.forEach(function (el) {
      el.style.cursor = "pointer";
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("title", "Click to copy code");
      var copy = function () {
        var code = el.getAttribute("data-copy");
        var done = function () {
          var b = el.querySelector("b");
          if (!b) return;
          var old = b.textContent;
          b.textContent = "Copied!";
          setTimeout(function () { b.textContent = old; }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(done).catch(done);
        } else { done(); }
      };
      el.addEventListener("click", copy);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); copy(); }
      });
    });
  }

  /* ---------- Highlight today's hours ---------- */
  function initHoursToday() {
    var rows = document.querySelectorAll("[data-day]");
    if (!rows.length) return;
    var today = new Date().getDay(); // 0=Sun
    rows.forEach(function (row) {
      if (parseInt(row.getAttribute("data-day"), 10) === today) {
        row.classList.add("today");
      }
    });
  }

  /* ---------- Init all ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initStickyNav();
    initMobileNav();
    initReveal();
    initCountUp();
    initTestimonials();
    initFilter();
    initEstimator();
    initForms();
    initCoupons();
    initHoursToday();
  });
})();
