(function () {
  if (window.orsTheme) return;
  var s = document.createElement("script");
  s.src = (function () {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || "";
      if (src.indexOf("theme-toggle.js") !== -1) {
        return src.replace("theme-toggle.js", "theme.js");
      }
    }
    return "assets/js/theme.js";
  })();
  document.head.appendChild(s);
})();
