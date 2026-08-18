// 이벤트 팝업 / 옵션 시트처럼 화면 전체를 덮는 오버레이는 모바일에서는 position:fixed만으로
// 충분하지만, 데스크탑 폰 프레임 미리보기에서는 .preview-scroll이 자체적으로 스크롤되는
// 컨테이너라 CSS만으로는 "프레임 안에서만, 스크롤 위치와 무관하게 고정" 두 조건을 동시에
// 만족시키기 까다롭다. 그래서 열릴 때마다 프레임의 실제 화면 좌표(getBoundingClientRect)를
// 읽어 position:fixed 오버레이에 인라인으로 지정해준다.
function positionOverlayToFrame(el) {
  if (!el) return;
  var frame = document.querySelector('.preview-scroll');
  if (!frame || window.innerWidth <= 480) {
    el.style.top = '';
    el.style.left = '';
    el.style.width = '';
    el.style.height = '';
    return;
  }
  var rect = frame.getBoundingClientRect();
  el.style.top = rect.top + 'px';
  el.style.left = rect.left + 'px';
  el.style.width = rect.width + 'px';
  el.style.height = rect.height + 'px';
}

window.addEventListener('resize', function () {
  ['eventPopupOverlay', 'optionSheetOverlay'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el && el.classList.contains('is-active')) positionOverlayToFrame(el);
  });
});

(function () {
  var overlay = document.getElementById('eventPopupOverlay');
  var closeBtn = document.getElementById('eventPopupClose');
  var hideTodayCheckbox = document.getElementById('eventPopupHideToday');
  var previewScroll = document.querySelector('.preview-scroll');
  var STORAGE_KEY = 'hcts_hideEventPopupUntil';

  if (!overlay) return;

  function getTodayEndTimestamp() {
    var now = new Date();
    var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return end.getTime();
  }

  function readHideUntil() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null; // localStorage 접근 불가(예: file:// 보안 제약) 시 항상 노출
    }
  }

  function writeHideUntil(value) {
    try {
      if (value === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      // 저장 불가 환경에서는 조용히 무시 (팝업 닫힘 동작 자체는 계속 진행)
    }
  }

  function shouldShowPopup() {
    var storedUntil = readHideUntil();
    if (!storedUntil) return true;
    return Date.now() > Number(storedUntil);
  }

  function openPopup() {
    positionOverlayToFrame(overlay);
    overlay.classList.add('is-active');
    document.body.classList.add('event-popup-lock');
    if (previewScroll) previewScroll.style.overflowY = 'hidden';
  }

  function closePopup() {
    overlay.classList.remove('is-active');
    document.body.classList.remove('event-popup-lock');
    if (previewScroll) previewScroll.style.overflowY = '';
  }

  if (shouldShowPopup()) {
    openPopup();
  }

  closeBtn.addEventListener('click', closePopup);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closePopup();
  });

  hideTodayCheckbox.addEventListener('change', function () {
    if (hideTodayCheckbox.checked) {
      writeHideUntil(String(getTodayEndTimestamp()));
      closePopup();
    } else {
      writeHideUntil(null);
    }
  });
})();

(function () {
  var screenMap = {
    'main': document.getElementById('mainScreen'),
    'product-list': document.getElementById('listScreen'),
    'detail': document.getElementById('detailScreen'),
    'search': document.getElementById('searchScreen'),
    'cart': document.getElementById('cartScreen'),
    'wishlist': document.getElementById('wishlistScreen'),
    'mypage': document.getElementById('mypageScreen'),
    'brand': document.getElementById('brandScreen'),
    'checkout': document.getElementById('checkoutScreen'),
    'category': document.getElementById('categoryScreen')
  };
  var screens = Object.keys(screenMap).map(function (key) { return screenMap[key]; });
  var previewScroll = document.querySelector('.preview-scroll');
  var searchBarOverlay = document.getElementById('searchBarOverlay');
  var searchScreenInput = document.getElementById('searchScreenInput');

  function showScreen(target) {
    if (!target) return;
    screens.forEach(function (screen) {
      if (screen) screen.classList.toggle('is-active', screen === target);
    });
    if (previewScroll) previewScroll.scrollTop = 0;
    // 모바일 기본 레이아웃은 preview-scroll이 아니라 브라우저 창 자체가 스크롤되므로
    // (overflow: visible) 창 스크롤도 함께 최상단으로 되돌려야 짧은 화면(찜/마이페이지 등)
    // 전환 시 이전 스크롤 위치만큼 빈 여백이 보이는 문제가 생기지 않는다.
    window.scrollTo(0, 0);
    if (searchBarOverlay) searchBarOverlay.classList.remove('is-active');
    if (target === screenMap.search && searchScreenInput) {
      window.setTimeout(function () { searchScreenInput.focus(); }, 200);
    }
  }

  document.querySelectorAll('[data-nav]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      // 카드 안에 찜 버튼처럼 중첩된 data-nav 요소가 있을 수 있어, 클릭이 상위
      // 카드(예: 상세페이지 이동)로 버블링되어 의도치 않게 다른 화면으로 전환되는 것을 막는다.
      e.stopPropagation();
      showScreen(screenMap[el.getAttribute('data-nav')]);
    });

    // 로고처럼 div에 role="button"을 붙인 요소는 네이티브 키보드 조작이 없으므로 보완한다.
    if (el.getAttribute('role') === 'button') {
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
    }
  });
})();

(function () {
  var overlay = document.getElementById('searchBarOverlay');
  var input = document.getElementById('searchBarInput');
  var closeBtn = document.getElementById('searchBarClose');

  if (!overlay) return;

  function openSearch() {
    overlay.classList.add('is-active');
    if (input) window.setTimeout(function () { input.focus(); }, 200);
  }

  function closeSearch() {
    overlay.classList.remove('is-active');
  }

  document.querySelectorAll('[data-action="open-search"]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openSearch();
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeSearch);
})();

(function () {
  var popup = document.getElementById('welcomePopup');
  var closeBtn = document.getElementById('welcomePopupClose');

  if (!popup || !closeBtn) return;

  closeBtn.addEventListener('click', function () {
    popup.style.display = 'none';
  });
})();

(function () {
  var overlay = document.getElementById('optionSheetOverlay');
  var openBtn = document.getElementById('detailBuyBtn');
  var closeBtn = document.getElementById('optionSheetClose');
  var checkoutScreen = document.getElementById('checkoutScreen');
  var qtyMinus = document.getElementById('optionQtyMinus');
  var qtyPlus = document.getElementById('optionQtyPlus');
  var qtyValue = document.getElementById('optionQtyValue');
  var qtyLabel = document.getElementById('optionQtyLabel');
  var totalPrice = document.getElementById('optionTotalPrice');
  var UNIT_PRICE = 35900;
  var qty = 1;

  if (!overlay) return;

  function renderTotal() {
    if (qtyValue) qtyValue.textContent = String(qty);
    if (qtyLabel) qtyLabel.textContent = String(qty);
    if (totalPrice) totalPrice.textContent = (UNIT_PRICE * qty).toLocaleString('ko-KR') + '원';
  }

  function openSheet() {
    qty = 1;
    renderTotal();
    positionOverlayToFrame(overlay);
    overlay.classList.add('is-active');
  }

  function closeSheet() {
    overlay.classList.remove('is-active');
  }

  function goToCheckout() {
    if (!checkoutScreen) return;
    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.toggle('is-active', s === checkoutScreen);
    });
    window.scrollTo(0, 0);
  }

  // 하단 구매바의 구매하기 버튼은 두 단계로 동작한다:
  // 처음 누르면 옵션 시트를 열고, 시트가 열려있는 상태에서 다시 누르면(=옵션 확인 완료)
  // 시트를 닫고 주문결제 화면으로 이동한다. 시트 안에 별도의 구매하기 버튼을 또 두면
  // 버튼이 중복돼 보이므로, 하나의 버튼을 재사용한다.
  if (openBtn) {
    openBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (overlay.classList.contains('is-active')) {
        closeSheet();
        goToCheckout();
      } else {
        openSheet();
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeSheet);

  if (qtyMinus) {
    qtyMinus.addEventListener('click', function () {
      if (qty > 1) { qty--; renderTotal(); }
    });
  }
  if (qtyPlus) {
    qtyPlus.addEventListener('click', function () {
      qty++;
      renderTotal();
    });
  }

  // 맛 선택 커스텀 드롭다운 (네이티브 select 대신 — OS 테마 색이 섞이지 않도록)
  var flavorSelect = document.getElementById('optionFlavorSelect');
  var flavorTrigger = document.getElementById('optionFlavorTrigger');
  var flavorLabel = document.getElementById('optionFlavorLabel');
  var flavorList = document.getElementById('optionFlavorList');

  if (flavorSelect && flavorTrigger && flavorLabel && flavorList) {
    var flavorOptions = flavorList.querySelectorAll('li');

    function closeFlavorList() {
      flavorSelect.classList.remove('is-open');
      flavorTrigger.setAttribute('aria-expanded', 'false');
    }

    flavorTrigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = flavorSelect.classList.toggle('is-open');
      flavorTrigger.setAttribute('aria-expanded', String(isOpen));
    });

    flavorOptions.forEach(function (li) {
      li.addEventListener('click', function () {
        flavorOptions.forEach(function (o) { o.classList.remove('is-selected'); });
        li.classList.add('is-selected');
        flavorLabel.textContent = li.getAttribute('data-value');
        closeFlavorList();
      });
    });

    document.addEventListener('click', function (e) {
      if (!flavorSelect.contains(e.target)) closeFlavorList();
    });
  }

})();

(function () {
  var tabs = document.querySelectorAll('.category-tabs__item');
  var shopBody = document.querySelector('.category-body:not(.category-body--service)');
  var serviceBody = document.querySelector('.category-body--service');
  var sidebarItems = document.querySelectorAll('.category-sidebar__item');
  var panels = document.querySelectorAll('.category-content__panel');

  if (!tabs.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-active'); });
      tab.classList.add('is-active');
      var isService = tab.getAttribute('data-tab') === 'service';
      if (shopBody) shopBody.hidden = isService;
      if (serviceBody) serviceBody.hidden = !isService;
    });
  });

  sidebarItems.forEach(function (item) {
    item.addEventListener('click', function () {
      sidebarItems.forEach(function (i) { i.classList.remove('is-active'); });
      item.classList.add('is-active');
      var cat = item.getAttribute('data-cat');
      panels.forEach(function (panel) {
        panel.classList.toggle('is-active', panel.getAttribute('data-panel') === cat);
      });
    });
  });
})();
