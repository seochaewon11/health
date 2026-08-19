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
  ['eventPopupOverlay', 'optionSheetOverlay', 'loginOverlay'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el && el.classList.contains('is-active')) positionOverlayToFrame(el);
  });
});

// 공용 토스트 — 장바구니 담기, 로그인 성공 등 짧은 안내 메시지에 재사용한다.
var appToastEl = document.getElementById('appToast');
var appToastHideTimer = null;

function positionToastToFrame() {
  if (!appToastEl) return;
  var frame = document.querySelector('.preview-scroll');
  if (!frame || window.innerWidth <= 480) {
    appToastEl.style.left = '';
    appToastEl.style.bottom = '';
    return;
  }
  var rect = frame.getBoundingClientRect();
  appToastEl.style.left = (rect.left + rect.width / 2) + 'px';
  appToastEl.style.bottom = (window.innerHeight - rect.bottom + 90) + 'px';
}

function showToast(message) {
  if (!appToastEl) return;
  appToastEl.textContent = message;
  positionToastToFrame();
  appToastEl.classList.add('is-active');
  if (appToastHideTimer) window.clearTimeout(appToastHideTimer);
  appToastHideTimer = window.setTimeout(function () {
    appToastEl.classList.remove('is-active');
  }, 1800);
}

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

// 데스크탑 브랜드 패널 검색창/태그 — 우측 폰 프레임의 검색 화면으로 이동시키고
// 입력값(또는 클릭한 태그)을 그대로 검색어로 채워준다.
(function () {
  var brandSearchInput = document.getElementById('brandSearchInput');
  var brandSearchBtn = document.getElementById('brandSearchBtn');
  var brandTags = document.querySelectorAll('.brand-tags li');
  var searchScreenInput = document.getElementById('searchScreenInput');
  var searchNavTrigger = document.querySelector('[data-nav="search"]');

  if (!brandSearchInput && !brandTags.length) return;

  function goToSearch(query) {
    if (searchScreenInput && query) searchScreenInput.value = query;
    if (searchNavTrigger) searchNavTrigger.click();
  }

  if (brandSearchBtn) {
    brandSearchBtn.addEventListener('click', function () {
      goToSearch(brandSearchInput ? brandSearchInput.value.trim() : '');
    });
  }

  if (brandSearchInput) {
    brandSearchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') goToSearch(brandSearchInput.value.trim());
    });
  }

  brandTags.forEach(function (tag) {
    tag.addEventListener('click', function () {
      goToSearch(tag.textContent.trim());
    });
    tag.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goToSearch(tag.textContent.trim());
      }
    });
  });
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

// Firebase 초기화 — Google 로그인에 사용
var firebaseConfig = {
  apiKey: "AIzaSyDM0_phA5C4d9xq_cwvifbjFwGi78h770c",
  authDomain: "health-26912.firebaseapp.com",
  projectId: "health-26912",
  storageBucket: "health-26912.firebasestorage.app",
  messagingSenderId: "573463078289",
  appId: "1:573463078289:web:155e9e8b515fc262f4e630"
};
firebase.initializeApp(firebaseConfig);
var googleProvider = new firebase.auth.GoogleAuthProvider();

// 로그인 상태 관리 — 장바구니의 주문하기 버튼처럼 로그인 후에만 진행 가능한
// 동작에서 재사용할 수 있도록 전역(파일 스코프)에 둔다. 상태는 새로고침해도
// 유지되도록 localStorage에 저장한다.
var loginOverlay = document.getElementById('loginOverlay');
var loginModalCloseBtn = document.getElementById('loginModalClose');
var mypageLogoutBtn = document.getElementById('mypageLogoutBtn');
var mypageAuthLabel = document.getElementById('mypageAuthLabel');
var utilityAuthBtn = document.getElementById('utilityAuthBtn');
var headerProfileView = document.getElementById('headerProfileView');
var LOGIN_STORAGE_KEY = 'hcts_isLoggedIn';

function loadLoginState() {
  try {
    return localStorage.getItem(LOGIN_STORAGE_KEY) === '1';
  } catch (e) {
    return false; // localStorage 접근 불가(예: file:// 보안 제약) 시 로그아웃 상태로 시작
  }
}

function saveLoginState() {
  try {
    localStorage.setItem(LOGIN_STORAGE_KEY, isLoggedIn ? '1' : '0');
  } catch (e) {
    // 저장 불가 환경에서는 조용히 무시
  }
}

var isLoggedIn = loadLoginState();

function renderHeaderAuth() {
  if (utilityAuthBtn) utilityAuthBtn.textContent = isLoggedIn ? '로그아웃' : '로그인';
  if (headerProfileView) headerProfileView.hidden = !isLoggedIn;
  if (mypageAuthLabel) mypageAuthLabel.textContent = isLoggedIn ? '로그아웃' : '로그인';
}

function openLogin() {
  if (!loginOverlay) return;
  positionOverlayToFrame(loginOverlay);
  loginOverlay.classList.add('is-active');
}

function closeLogin() {
  if (loginOverlay) loginOverlay.classList.remove('is-active');
}

function login() {
  isLoggedIn = true;
  saveLoginState();
  renderHeaderAuth();
  showToast('로그인 성공');
}

function loginWithGoogle() {
  firebase.auth().signInWithPopup(googleProvider)
    .then(function () {
      closeLogin();
      login();
    })
    .catch(function (error) {
      console.error('Google 로그인 실패:', error);
      showToast('구글 로그인에 실패했습니다');
    });
}

function logout() {
  isLoggedIn = false;
  saveLoginState();
  renderHeaderAuth();
  showToast('로그아웃 되었습니다');
}

renderHeaderAuth();

if (loginOverlay) {
  if (loginModalCloseBtn) loginModalCloseBtn.addEventListener('click', closeLogin);

  loginOverlay.addEventListener('click', function (e) {
    if (e.target === loginOverlay) closeLogin();
  });

  loginOverlay.querySelectorAll('.login-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.classList.contains('login-btn--google')) {
        loginWithGoogle();
        return;
      }
      closeLogin();
      login();
    });
  });
}

if (utilityAuthBtn) {
  utilityAuthBtn.addEventListener('click', function () {
    if (isLoggedIn) logout();
    else openLogin();
  });
}

if (mypageLogoutBtn) {
  mypageLogoutBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (isLoggedIn) logout();
    else openLogin();
  });
}

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

(function () {
  var badges = document.querySelectorAll('[data-cart-badge]');
  var addButtons = document.querySelectorAll('.product-card__add, .detail-buybar__cart');
  var listEl = document.getElementById('cartItemList');
  var selectAllLabel = document.getElementById('cartSelectAllLabel');
  var selectAllRow = document.getElementById('cartSelectAllRow');
  var emptyStateEl = document.getElementById('cartEmptyState');
  var summaryEl = document.getElementById('cartSummary');
  var productTotalEl = document.getElementById('cartSummaryProductTotal');
  var shippingEl = document.getElementById('cartSummaryShipping');
  var grandTotalEl = document.getElementById('cartSummaryGrandTotal');
  var FREE_SHIPPING_THRESHOLD = 50000;
  var SHIPPING_FEE = 3000;

  if (!badges.length) return;

  var CART_STORAGE_KEY = 'hcts_cartItems';

  // 장바구니 화면에 이미 담겨있는 상품 2개(핵불닭맛, 그릴드 닭가슴살)를 초기값으로 반영
  var defaultCartItems = [
    { id: '핵불닭맛 100g x 10팩', name: '핵불닭맛 100g x 10팩', tag: '매운맛', price: 25900, image: 'img/list004.png', qty: 1 },
    { id: '그릴드 닭가슴살 100g x 5팩', name: '그릴드 닭가슴살 100g x 5팩', tag: '오리지널', price: 13500, image: 'img/list001.png', qty: 2 }
  ];

  function loadCartItems() {
    try {
      var raw = localStorage.getItem(CART_STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) {
      return null; // localStorage 접근 불가(예: file:// 보안 제약) 시 초기값 사용
    }
  }

  function saveCartItems() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      // 저장 불가 환경에서는 조용히 무시 (화면 표시 동작 자체는 계속 진행)
    }
  }

  var cartItems = loadCartItems() || defaultCartItems;

  function formatWon(n) {
    return n.toLocaleString('ko-KR') + '원';
  }

  function renderBadges() {
    var totalQty = cartItems.reduce(function (sum, item) { return sum + item.qty; }, 0);
    badges.forEach(function (badge) {
      badge.textContent = totalQty > 99 ? '99+' : String(totalQty);
      badge.hidden = totalQty <= 0;
    });
  }

  function renderSummary() {
    var productTotal = cartItems.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
    var shipping = productTotal > 0 && productTotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
    if (productTotalEl) productTotalEl.textContent = formatWon(productTotal);
    if (shippingEl) shippingEl.textContent = shipping > 0 ? formatWon(shipping) : '무료';
    if (grandTotalEl) grandTotalEl.textContent = formatWon(productTotal + shipping);
    if (selectAllLabel) {
      selectAllLabel.textContent = '전체선택 (' + cartItems.length + '/' + cartItems.length + ')';
    }
  }

  function renderCartItems() {
    if (!listEl) return;
    listEl.innerHTML = '';
    cartItems.forEach(function (item) {
      var el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML =
        '<button type="button" class="cart-item__remove" aria-label="상품 삭제">✕</button>' +
        '<div class="cart-item__row">' +
          '<img class="cart-item__image" src="' + item.image + '" alt="' + item.name + '" />' +
          '<div class="cart-item__info">' +
            '<h4>' + item.name + '</h4>' +
            (item.tag ? '<span class="cart-item__tag">' + item.tag + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="cart-item__bottom">' +
          '<p class="cart-item__price">' + formatWon(item.price) + '</p>' +
          '<div class="cart-item__qty">' +
            '<button type="button" class="cart-item__qty-minus" aria-label="수량 감소">−</button>' +
            '<span>' + item.qty + '</span>' +
            '<button type="button" class="cart-item__qty-plus" aria-label="수량 증가">+</button>' +
          '</div>' +
        '</div>';

      el.querySelector('.cart-item__remove').addEventListener('click', function () {
        cartItems = cartItems.filter(function (i) { return i !== item; });
        renderCart();
      });
      el.querySelector('.cart-item__qty-minus').addEventListener('click', function () {
        if (item.qty > 1) {
          item.qty -= 1;
          renderCart();
        }
      });
      el.querySelector('.cart-item__qty-plus').addEventListener('click', function () {
        item.qty += 1;
        renderCart();
      });

      listEl.appendChild(el);
    });
  }

  function renderEmptyState() {
    var isEmpty = cartItems.length === 0;
    if (emptyStateEl) emptyStateEl.hidden = !isEmpty;
    if (selectAllRow) selectAllRow.hidden = isEmpty;
    if (summaryEl) summaryEl.hidden = isEmpty;
  }

  function renderCart() {
    renderCartItems();
    renderSummary();
    renderBadges();
    renderEmptyState();
    saveCartItems();
  }

  function parsePrice(text) {
    var match = text.match(/([\d,]+)\s*원/);
    return match ? Number(match[1].replace(/,/g, '')) : 0;
  }

  function getProductFromCard(card) {
    var nameEl = card.querySelector('.product-card__info h4');
    var priceEl = card.querySelector('.product-card__price');
    var imgEl = card.querySelector('.product-card__thumb img');
    if (!nameEl || !priceEl || !imgEl) return null;
    var name = nameEl.textContent.trim();
    return { id: name, name: name, tag: '', price: parsePrice(priceEl.textContent), image: imgEl.getAttribute('src') };
  }

  function getProductFromDetail() {
    var hero = document.querySelector('.detail-hero');
    if (!hero) return null;
    var nameEl = hero.querySelector('.detail-hero__title');
    var priceEl = hero.querySelector('.detail-hero__price strong');
    var imgEl = hero.querySelector('img');
    if (!nameEl || !priceEl || !imgEl) return null;
    var name = nameEl.textContent.trim();
    return { id: name, name: name, tag: '', price: parsePrice(priceEl.textContent), image: imgEl.getAttribute('src') };
  }

  function addToCart(product) {
    var existing = cartItems.filter(function (i) { return i.id === product.id; })[0];
    if (existing) {
      existing.qty += 1;
    } else {
      cartItems.push({ id: product.id, name: product.name, tag: product.tag, price: product.price, image: product.image, qty: 1 });
    }
    renderCart();
    showToast('장바구니에 담겼습니다');
  }

  addButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.product-card');
      var product = card ? getProductFromCard(card) : getProductFromDetail();
      if (product) addToCart(product);
    });
  });

  var checkoutBtn = document.getElementById('cartCheckoutBtn');
  var checkoutScreen = document.getElementById('checkoutScreen');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function () {
      if (!isLoggedIn) {
        openLogin();
        return;
      }
      document.querySelectorAll('.screen').forEach(function (s) {
        s.classList.toggle('is-active', s === checkoutScreen);
      });
      var previewScroll = document.querySelector('.preview-scroll');
      if (previewScroll) previewScroll.scrollTop = 0;
      window.scrollTo(0, 0);
    });
  }

  renderCart();
})();
