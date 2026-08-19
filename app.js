// 브랜드 패널 인트로 릴 — ① 키워드 말풍선이 위→아래로 쌓였다가 ② chicken.gif 상품 컷으로
// 전환되고 ③ 실제 후기가 한 줄씩 타이핑되는 3단계를 순서대로 재생한 뒤, 전부 초기화하고
// 처음부터 다시 반복한다(중첩 setTimeout으로 각 단계가 끝나야 다음 단계가 시작됨).
(function () {
  var bubbles = document.querySelectorAll('.brand-reel__bubble');
  var product = document.querySelector('.brand-reel__product');
  var reviewLines = document.querySelectorAll('.brand-reel__line');

  if (!bubbles.length && !product && !reviewLines.length) return;

  var BUBBLE_FIRST_DELAY = 300;
  var BUBBLE_STAGGER = 700;
  var BUBBLE_HOLD = 1800;
  var FADE_OUT_WAIT = 400;
  var PRODUCT_HOLD = 2600;
  var TYPE_SPEED = 32;
  var LINE_PAUSE = 500;
  var REVIEWS_HOLD = 1200;
  var CYCLE_GAP = 900;

  function showBubbles(onDone) {
    if (!bubbles.length) { onDone(); return; }
    bubbles.forEach(function (b, i) {
      window.setTimeout(function () {
        b.classList.add('is-visible');
      }, BUBBLE_FIRST_DELAY + i * BUBBLE_STAGGER);
    });
    var totalIn = BUBBLE_FIRST_DELAY + (bubbles.length - 1) * BUBBLE_STAGGER;
    window.setTimeout(function () {
      bubbles.forEach(function (b) { b.classList.remove('is-visible'); });
      window.setTimeout(onDone, FADE_OUT_WAIT);
    }, totalIn + BUBBLE_HOLD);
  }

  function showProduct(onDone) {
    if (!product) { onDone(); return; }
    product.classList.add('is-visible');
    window.setTimeout(function () {
      product.classList.remove('is-visible');
      window.setTimeout(onDone, FADE_OUT_WAIT);
    }, PRODUCT_HOLD);
  }

  function typeLine(index, onAllDone) {
    if (index >= reviewLines.length) { onAllDone(); return; }
    var el = reviewLines[index];
    var text = el.getAttribute('data-text') || '';
    var i = 0;
    el.classList.add('is-typing');
    (function step() {
      el.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) {
        window.setTimeout(step, TYPE_SPEED);
      } else {
        el.classList.remove('is-typing');
        el.classList.add('is-done');
        window.setTimeout(function () { typeLine(index + 1, onAllDone); }, LINE_PAUSE);
      }
    })();
  }

  function showReviews(onDone) {
    if (!reviewLines.length) { onDone(); return; }
    typeLine(0, function () {
      window.setTimeout(onDone, REVIEWS_HOLD);
    });
  }

  function resetAll() {
    bubbles.forEach(function (b) { b.classList.remove('is-visible'); });
    if (product) product.classList.remove('is-visible');
    reviewLines.forEach(function (el) {
      el.textContent = '';
      el.classList.remove('is-typing', 'is-done');
    });
  }

  function runCycle() {
    showBubbles(function () {
      showProduct(function () {
        showReviews(function () {
          resetAll();
          window.setTimeout(runCycle, CYCLE_GAP);
        });
      });
    });
  }

  runCycle();
})();

// 메인 화면 프로모션 배너 캐러셀 — scroll-snap 트랙이라 스와이프는 브라우저가 알아서
// 처리해주고, 여기서는 점(dot) 클릭 시 해당 슬라이드로 이동, 스크롤 위치에 따라
// 활성 점 동기화, 그리고 몇 초마다 자동으로 다음 슬라이드로 넘어가는 것만 담당한다.
(function () {
  var track = document.getElementById('promoCarouselTrack');
  var dotsWrap = document.getElementById('promoCarouselDots');
  if (!track || !dotsWrap) return;

  var slides = track.querySelectorAll('.promo-carousel__slide');
  var dots = dotsWrap.querySelectorAll('span');
  var AUTO_INTERVAL = 4000;
  var autoTimer = null;

  function goToSlide(index) {
    track.scrollTo({ left: track.clientWidth * index, behavior: 'smooth' });
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      goToSlide(i);
    });
  });

  track.addEventListener('scroll', function () {
    var index = Math.round(track.scrollLeft / track.clientWidth);
    dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === index);
    });
  });

  function startAuto() {
    stopAuto();
    autoTimer = window.setInterval(function () {
      var current = Math.round(track.scrollLeft / track.clientWidth);
      goToSlide((current + 1) % slides.length);
    }, AUTO_INTERVAL);
  }

  function stopAuto() {
    if (autoTimer) window.clearInterval(autoTimer);
  }

  if (slides.length > 1) {
    startAuto();
    // 사용자가 직접 스와이프/클릭하는 동안에는 자동 넘김이 끼어들어 방해하지 않도록 멈췄다가,
    // 손을 뗀 뒤 잠시 후 다시 시작한다.
    track.addEventListener('pointerdown', stopAuto);
    track.addEventListener('pointerup', function () { window.setTimeout(startAuto, AUTO_INTERVAL); });
  }
})();

// 커스텀 커서 글로우 — 마우스를 살짝의 지연(lerp)을 두고 따라다니다가, 버튼/링크/
// 카드/탭 위에서는 커지면서 반응한다. 터치 기기에는 마우스가 없으므로 건너뛴다.
(function () {
  var glow = document.getElementById('cursorGlow');
  if (!glow || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var targetX = 0;
  var targetY = 0;
  var currentX = 0;
  var currentY = 0;
  var started = false;

  document.addEventListener('mousemove', function (e) {
    targetX = e.clientX;
    targetY = e.clientY;
    if (!started) {
      currentX = targetX;
      currentY = targetY;
      started = true;
      glow.classList.add('is-visible');
    }
  });

  document.addEventListener('mouseleave', function () {
    glow.classList.remove('is-visible');
  });

  function tick() {
    currentX += (targetX - currentX) * 0.15;
    currentY += (targetY - currentY) * 0.15;
    glow.style.transform = 'translate(' + currentX + 'px, ' + currentY + 'px) translate(-50%, -50%)';
    window.requestAnimationFrame(tick);
  }
  window.requestAnimationFrame(tick);

  var interactiveSelector = 'a, button, input, li[role="button"], [data-nav], [role="button"], ' +
    '.product-card, .ranking__card, .time-deal__card, .sub-nav__item, .category-tabs__item';
  document.addEventListener('mouseover', function (e) {
    if (e.target.closest(interactiveSelector)) glow.classList.add('is-active');
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest(interactiveSelector)) glow.classList.remove('is-active');
  });
})();

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
    'category': document.getElementById('categoryScreen'),
    'customer-center': document.getElementById('customerCenterScreen'),
    'notice': document.getElementById('noticeScreen'),
    'store': document.getElementById('storeScreen'),
    'settings': document.getElementById('settingsScreen'),
    'notification': document.getElementById('notificationScreen'),
    'points': document.getElementById('pointsScreen'),
    'coupon': document.getElementById('couponScreen'),
    'order': document.getElementById('orderScreen')
  };
  var screens = Object.keys(screenMap).map(function (key) { return screenMap[key]; });
  // 뒤로가기 버튼이 화면마다 고정된 목적지가 아니라 실제로 "직전에 있던 화면"으로
  // 돌아가야 해서(예: 마이페이지 목록에서 들어간 고객센터는 마이페이지로, 카테고리
  // 퀵메뉴에서 들어간 쿠폰함은 카테고리로) 방문 순서를 스택으로 기록해둔다.
  var navHistory = ['main'];
  var previewScroll = document.querySelector('.preview-scroll');
  var searchBarOverlay = document.getElementById('searchBarOverlay');
  var searchScreenInput = document.getElementById('searchScreenInput');
  var tabbarItems = document.querySelectorAll('.bottom-tabbar__item');

  function keyForScreen(target) {
    var found = null;
    Object.keys(screenMap).forEach(function (key) {
      if (screenMap[key] === target) found = key;
    });
    return found;
  }

  // 하단 탭바는 5개 항목(카테고리/검색/홈/찜/마이페이지)만 있고 상세·장바구니 등
  // 나머지 화면은 대응되는 탭이 없으므로, 그런 화면에서는 탭바가 전부 비활성 상태가 된다.
  function setActiveTab(target) {
    var activeKey = keyForScreen(target);
    tabbarItems.forEach(function (item) {
      item.classList.toggle('is-active', item.getAttribute('data-nav') === activeKey);
    });
  }

  function showScreen(target, isBack) {
    if (!target) return;
    screens.forEach(function (screen) {
      if (screen) screen.classList.toggle('is-active', screen === target);
    });
    setActiveTab(target);
    if (previewScroll) previewScroll.scrollTop = 0;
    // 모바일 기본 레이아웃은 preview-scroll이 아니라 브라우저 창 자체가 스크롤되므로
    // (overflow: visible) 창 스크롤도 함께 최상단으로 되돌려야 짧은 화면(찜/마이페이지 등)
    // 전환 시 이전 스크롤 위치만큼 빈 여백이 보이는 문제가 생기지 않는다.
    window.scrollTo(0, 0);
    if (searchBarOverlay) searchBarOverlay.classList.remove('is-active');
    if (target === screenMap.search && searchScreenInput) {
      window.setTimeout(function () { searchScreenInput.focus(); }, 200);
    }

    var key = keyForScreen(target);
    if (isBack) {
      // 뒤로가기로 도착한 화면이면 스택 맨 위를 이 화면으로 맞춰두기만 하고 새로 쌓지 않는다.
      if (key) navHistory[navHistory.length - 1] = key;
    } else if (key && navHistory[navHistory.length - 1] !== key) {
      navHistory.push(key);
    }
  }

  // 뒤로가기 버튼 전용: 스택에서 현재 화면을 걷어내고 그 직전 화면을 보여준다.
  function goBack() {
    if (navHistory.length > 1) navHistory.pop();
    showScreen(screenMap[navHistory[navHistory.length - 1]], true);
  }

  setActiveTab(screenMap.main);

  document.querySelectorAll('[data-nav]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      // 카드 안에 찜 버튼처럼 중첩된 data-nav 요소가 있을 수 있어, 클릭이 상위
      // 카드(예: 상세페이지 이동)로 버블링되어 의도치 않게 다른 화면으로 전환되는 것을 막는다.
      e.stopPropagation();
      var key = el.getAttribute('data-nav');
      if (key === 'back') {
        goBack();
      } else {
        showScreen(screenMap[key]);
      }
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

// 서브 내비게이션(한끼픽 / 60% 할인 / 베스트 등) — 클릭한 탭으로 활성 표시(밑줄)가
// 옮겨가도록 같은 <nav> 안의 형제 탭들끼리 is-active를 토글한다. 화면 이동은
// data-nav의 몫이고, 여기서는 순수하게 시각적 선택 상태만 관리한다.
document.querySelectorAll('.sub-nav').forEach(function (nav) {
  nav.querySelectorAll('.sub-nav__item').forEach(function (tab) {
    tab.addEventListener('click', function () {
      nav.querySelectorAll('.sub-nav__item').forEach(function (t) {
        t.classList.toggle('is-active', t === tab);
      });
    });
  });
});

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

// 검색 화면 자체의 검색 버튼 — 실제 검색 결과 목록이 없는 프로토타입이라
// 클릭/Enter 시 토스트로 "검색이 실행됐다"는 피드백만 준다.
(function () {
  var searchScreenInput = document.getElementById('searchScreenInput');
  var searchScreenSubmitBtn = document.getElementById('searchScreenSubmitBtn');

  if (!searchScreenSubmitBtn) return;

  function submitSearch() {
    var query = searchScreenInput ? searchScreenInput.value.trim() : '';
    showToast(query ? '"' + query + '" 검색 결과예요' : '검색어를 입력해주세요');
  }

  searchScreenSubmitBtn.addEventListener('click', submitSearch);

  if (searchScreenInput) {
    searchScreenInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitSearch();
    });
  }
})();

// 검색창 공통 — 메인 화면 상단 검색창, 데스크탑 브랜드 패널 검색창/태그 모두
// 우측 폰 프레임의 검색 화면으로 이동시키고 입력값(또는 클릭한 태그)을 검색어로 채워준다.
(function () {
  var mainSearchInput = document.getElementById('mainSearchInput');
  var mainSearchBtn = document.getElementById('mainSearchBtn');
  var brandSearchInput = document.getElementById('brandSearchInput');
  var brandSearchBtn = document.getElementById('brandSearchBtn');
  var brandTags = document.querySelectorAll('.brand-tags li');
  var searchScreenInput = document.getElementById('searchScreenInput');
  var searchNavTrigger = document.querySelector('[data-nav="search"]');

  function goToSearch(query) {
    if (searchScreenInput && query) searchScreenInput.value = query;
    if (searchNavTrigger) searchNavTrigger.click();
  }

  function wireSearchField(input, btn) {
    if (btn) {
      btn.addEventListener('click', function () {
        goToSearch(input ? input.value.trim() : '');
      });
    }
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') goToSearch(input.value.trim());
      });
    }
  }

  wireSearchField(mainSearchInput, mainSearchBtn);
  wireSearchField(brandSearchInput, brandSearchBtn);

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
  document.dispatchEvent(new CustomEvent('hcts:logout'));
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

var categoryPromoLogin = document.getElementById('categoryPromoLogin');
if (categoryPromoLogin) {
  categoryPromoLogin.addEventListener('click', openLogin);
  categoryPromoLogin.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLogin();
    }
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

  document.addEventListener('hcts:logout', function () {
    cartItems = [];
    renderCart();
  });

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

  // 담기 버튼에서 현재 화면에 보이는 장바구니 아이콘(또는 메인 화면의 "장바구니" 필)까지
  // 닭 이모지가 슝 날아가는 연출. 화면에 마땅한 목표 지점이 없으면(예: 검색 결과 화면)
  // 조용히 건너뛴다 — 배지 자체는 어차피 renderBadges()로 이미 갱신돼 있다.
  function flyToCart(fromEl) {
    var target = document.querySelector('.screen.is-active .cart-icon-btn') ||
      document.querySelector('.utility-bar__item[data-nav="cart"]');
    if (!target || !fromEl) return;

    var fromRect = fromEl.getBoundingClientRect();
    var toRect = target.getBoundingClientRect();
    var dx = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
    var dy = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);

    var flyEl = document.createElement('span');
    flyEl.className = 'fly-to-cart';
    flyEl.textContent = '🐔';
    flyEl.style.left = (fromRect.left + fromRect.width / 2) + 'px';
    flyEl.style.top = (fromRect.top + fromRect.height / 2) + 'px';
    flyEl.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(flyEl);

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        flyEl.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(0.25) rotate(20deg)';
        flyEl.style.opacity = '0.2';
      });
    });

    var cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      if (flyEl.parentNode) flyEl.parentNode.removeChild(flyEl);
      target.classList.add('is-popping');
      window.setTimeout(function () { target.classList.remove('is-popping'); }, 260);
    }
    flyEl.addEventListener('transitionend', cleanup);
    window.setTimeout(cleanup, 700); // 안전장치 — transitionend가 안 붙는 예외 상황 대비
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
    btn.addEventListener('click', function (e) {
      // product-card__add는 카드(data-nav="detail") 안에 중첩돼 있으므로, 클릭이 카드로
      // 버블링되어 상세 화면으로 튕겨나가지 않도록 막는다.
      e.preventDefault();
      e.stopPropagation();
      var card = btn.closest('.product-card');
      var product = card ? getProductFromCard(card) : getProductFromDetail();
      if (product) {
        addToCart(product);
        flyToCart(btn);
      }
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

// 찜한 상품 화면 — 하트(찜 해제) 버튼을 다시 누르면 그 카드를 목록에서 제거하고
// 개수/빈 상태를 갱신한다. "전체삭제"도 같은 방식으로 전부 비운다.
(function () {
  var grid = document.getElementById('wishlistGrid');
  var countEl = document.getElementById('wishlistCount');
  var toolbarEl = document.getElementById('wishlistToolbar');
  var emptyEl = document.getElementById('wishlistEmptyState');
  var clearBtn = document.getElementById('wishlistClearBtn');
  var mypageCountEl = document.getElementById('mypageWishlistCount');

  if (!grid) return;

  function updateWishlistUI() {
    var count = grid.querySelectorAll('.product-card').length;
    if (countEl) countEl.textContent = '총 ' + count + '개';
    // 마이페이지 요약의 "찜" 개수도 실제 찜 목록과 항상 같은 값을 보여줘야 하므로 함께 갱신한다.
    if (mypageCountEl) mypageCountEl.textContent = count + '개';
    var isEmpty = count === 0;
    if (emptyEl) emptyEl.hidden = !isEmpty;
    if (toolbarEl) toolbarEl.hidden = isEmpty;
    grid.hidden = isEmpty;
  }

  grid.querySelectorAll('.product-card__like').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var card = btn.closest('.product-card');
      if (card) card.remove();
      updateWishlistUI();
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      grid.querySelectorAll('.product-card').forEach(function (card) { card.remove(); });
      updateWishlistUI();
    });
  }

  updateWishlistUI();
})();
