(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var items = document.querySelectorAll(".box.highlight .special-item");
    if (!items.length) {
      return;
    }

    for (var i = 0; i < items.length; i++) {
      (function (item) {
        item.addEventListener("mouseenter", function () {
          item.classList.add("is-hot");
        });
        item.addEventListener("mouseleave", function () {
          item.classList.remove("is-hot");
        });
        item.addEventListener("focusin", function () {
          item.classList.add("is-hot");
        });
        item.addEventListener("focusout", function () {
          item.classList.remove("is-hot");
        });
      })(items[i]);
    }
  });
})();
