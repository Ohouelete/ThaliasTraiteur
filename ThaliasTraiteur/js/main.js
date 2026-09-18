AOS.init({
    duration: 680,
    once: true,
    offset: 55
});

/* NAVBAR SCROLL  (active link is page-based, set in the HTML — no scroll-spy,
   which would clear it since nav links now point to pages, not #sections) */
window.addEventListener('scroll', function() {
    document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 60);
    var btt = document.getElementById('btt');
    if (btt) btt.classList.toggle('show', window.scrollY > 300);
});

/*  SMOOTH SCROLL + MOBILE NAV CLOSE  */
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        if (href === '#') return;
        var t = document.querySelector(href);
        if (t) {
            e.preventDefault();
            // Close Bootstrap mobile navbar if open
            var navCollapse = document.getElementById('navmenu');
            if (navCollapse && navCollapse.classList.contains('show')) {
                var bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
                if (bsCollapse) {
                    bsCollapse.hide();
                } else {
                    navCollapse.classList.remove('show');
                }
            }
            // Scroll after slight delay to let navbar close
            setTimeout(function() {
                window.scrollTo({
                    top: t.offsetTop - 78,
                    behavior: 'smooth'
                });
            }, 50);
        }
    });
});


var searchOv = document.getElementById('searchOv');
var navSearchBtn = document.getElementById('navSearchBtn');

function closeSearch() {
    if (searchOv) searchOv.classList.remove('open');
    document.body.style.overflow = '';
}

// The nav search feature is optional (button removed from the header) — guard it
if (navSearchBtn && searchOv) {
    navSearchBtn.addEventListener('click', function() {
        searchOv.classList.add('open');
        document.body.style.overflow = 'hidden';
        setTimeout(function() {
            var si = document.getElementById('searchInput');
            if (si) si.focus();
        }, 220);
    });
    var searchCloseBtn = document.getElementById('searchClose');
    if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearch);
    searchOv.addEventListener('click', function(e) {
        if (e.target === searchOv) closeSearch();
    });
}

// Category buttons inside search box
document.querySelectorAll('.sovcat').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.sovcat').forEach(function(b) {
            b.classList.remove('active');
        });
        this.classList.add('active');
        var f = this.getAttribute('data-cat');
        closeSearch();
        setTimeout(function() {
            filterMenu(f);
            document.getElementById('menu').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 300);
    });
});

// Trending tags fill the search input
document.querySelectorAll('.sovtrend .ttag').forEach(function(t) {
    t.addEventListener('click', function() {
        document.getElementById('searchInput').value = this.textContent.trim();
        document.getElementById('searchInput').focus();
    });
});


$(document).ready(function() {
	$('.magnific_popup').magnificPopup({
	  disableOn: 700,
	  type: 'iframe',
	  mainClass: 'mfp-fade',
	  removalDelay: 160,
	  preloader: false,
	  fixedContentPos: false,
	  disableOn: 300
	});	
});


function filterMenu(cat) {
    // sync filter buttons
    document.querySelectorAll('.filtbtn').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-f') === cat);
    });
    // sync category cards
    document.querySelectorAll('.catcard').forEach(function(c) {
        c.classList.toggle('active', c.getAttribute('data-filter') === cat);
    });
    // show/hide menu cards
    document.querySelectorAll('.mwrap').forEach(function(w) {
        var c = w.getAttribute('data-c');
        if (cat === 'all' || c === cat) {
            w.classList.remove('gone');
            w.style.opacity = '0';
            w.style.transform = 'translateY(16px)';
            setTimeout(function() {
                w.style.transition = 'opacity .38s,transform .38s';
                w.style.opacity = '1';
                w.style.transform = 'translateY(0)';
            }, 60);
        } else {
            w.classList.add('gone');
        }
    });
}

// Filter buttons
document.querySelectorAll('.filtbtn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        filterMenu(this.getAttribute('data-f'));
    });
});

// Category section cards â†’ scroll + filter
document.querySelectorAll('.catcard').forEach(function(card) {
    card.addEventListener('click', function() {
        var f = this.getAttribute('data-filter');
        window.scrollTo({
            top: document.getElementById('menu').offsetTop - 80,
            behavior: 'smooth'
        });
        setTimeout(function() {
            filterMenu(f);
        }, 480);
    });
});


var menuPop = document.getElementById('menuPop');
var mpQty = 1;
var mpQInput = document.getElementById('mpQnum');
function mpSetQty(n) {
    mpQty = Math.max(1, Math.floor(n) || 1);
    if (mpQInput) mpQInput.value = mpQty;
}
if (mpQInput) {
    mpQInput.addEventListener('input', function() {
        var n = parseInt(this.value, 10);
        mpQty = (n && n > 0) ? n : 1;
    });
    mpQInput.addEventListener('blur', function() { mpSetQty(mpQty); });
}

function openMenuPop(card) {
    var img = card.getAttribute('data-img');
    var title = card.getAttribute('data-title');
    var cat = card.getAttribute('data-cat');
    var price = card.getAttribute('data-price');
    var old = card.getAttribute('data-old');
    var rating = parseFloat(card.getAttribute('data-rating'));
    var reviews = card.getAttribute('data-reviews');
    var cal = card.getAttribute('data-cal');
    var time = card.getAttribute('data-time');
    var desc = card.getAttribute('data-desc');
    var tags = card.getAttribute('data-tags') || '';

    window.__ttDish = { name: title, price: price };

    if (window.TTCarousel) window.TTCarousel.load(card.getAttribute('data-imgs') || img, title);
    document.getElementById('mpCat').textContent = cat;
    document.getElementById('mpTitle').textContent = title;

    var full = Math.round(rating),
        empty = 5 - full;
    document.getElementById('mpStars').innerHTML =
        '<i class="fas fa-star"></i>'.repeat(full) + 'â˜†'.repeat(empty) +
        ' <span style="color:#bbb;font-size:.78rem;">' + rating + ' (' + reviews + ' avis)</span>';

    document.getElementById('mpDesc').textContent = desc;

    document.getElementById('mpPrice').innerHTML =
        price + (old ? '<small style="color:#ccc;text-decoration:line-through;margin-left:8px;font-size:1rem;">' + old + '</small>' : '');

    document.getElementById('mpMeta').innerHTML =
        '<div class="mpm"><div class="mpmv">' + cal + '</div><div class="mpml">Portion</div></div>' +
        '<div class="mpm"><div class="mpmv">' + time + '</div><div class="mpml">Délai</div></div>' +
        '<div class="mpm"><div class="mpmv">' + rating + '/5</div><div class="mpml">Note</div></div>';

    document.getElementById('mpTags').innerHTML =
        tags.split(',').filter(Boolean).map(function(t) {
            return '<span class="mptag">' + t.trim() + '</span>';
        }).join('');

    mpSetQty(1);
    document.getElementById('mpAddCart').innerHTML = '<i class="fas fa-shopping-cart"></i> Ajouter à ma commande';
    document.getElementById('mpAddCart').style.background = '';

    menuPop.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (window.TTOrder) window.TTOrder.ensureView();
}

// Card click open popup
document.querySelectorAll('.mcard').forEach(function(card) {
    card.addEventListener('click', function() {
        openMenuPop(this);
    });
});

// + button  open popup (stop propagation to avoid double firing)
document.querySelectorAll('.madd').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        openMenuPop(this.closest('.mcard'));
    });
});

// Heart toggle (no popup)
document.querySelectorAll('.mhrt').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var ico = this.querySelector('i');
        ico.classList.toggle('far');
        ico.classList.toggle('fas');
        this.style.color = ico.classList.contains('fas') ? 'var(--primary)' : '#ccc';
    });
});

// Close popup
document.getElementById('mpClose').addEventListener('click', closeMenuPop);
menuPop.addEventListener('click', function(e) {
    if (e.target === this) closeMenuPop();
});

function closeMenuPop() {
    menuPop.classList.remove('open');
    document.body.style.overflow = '';
}

// Qty +/-
document.getElementById('mpPlus').addEventListener('click', function() {
    mpSetQty(mpQty + 1);
});
document.getElementById('mpMinus').addEventListener('click', function() {
    mpSetQty(mpQty - 1);
});

// Add to cart button
document.getElementById('mpAddCart').addEventListener('click', function() {
    mpSetQty(mpQty);
    if (window.TTCart && window.__ttDish) window.TTCart.add(window.__ttDish.name, window.__ttDish.price, mpQty);
    this.innerHTML = '<i class="fas fa-check"></i> Ajouté !';
    this.style.background = 'linear-gradient(135deg,var(--green),var(--green-dark))';
    var self = this;
    setTimeout(function() {
        closeMenuPop();
        self.innerHTML = '<i class="fas fa-shopping-cart"></i> Ajouter à ma commande';
        self.style.background = '';
    }, 1000);
});


var ctcBtnEl = document.getElementById('ctcBtn');
if (ctcBtnEl) ctcBtnEl.addEventListener('click', function() {
    var btn = this;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
    btn.disabled = true;
    setTimeout(function() {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer le message';
        btn.disabled = false;
        var ok = document.getElementById('ctcOk');
        ok.style.display = 'block';
        ok.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }, 1500);
});


var galPop = document.getElementById('galPop');
var galData = [];
var galIdx = 0;

document.querySelectorAll('.gitem').forEach(function(item) {
    galData.push({
        img: item.getAttribute('data-gimg'),
        title: item.getAttribute('data-gtitle'),
        desc: item.getAttribute('data-gdesc')
    });
    item.addEventListener('click', function() {
        openGal(parseInt(this.getAttribute('data-gi')));
    });
});

function openGal(i) {
    galIdx = i;
    var g = galData[i];
    document.getElementById('gpImg').setAttribute('src', g.img);
    document.getElementById('gpTitle').textContent = g.title;
    document.getElementById('gpDesc').innerHTML = g.desc;
    galPop.classList.add('open');
    document.body.style.overflow = 'hidden';
}

document.getElementById('gpClose').addEventListener('click', closeGal);
galPop.addEventListener('click', function(e) {
    if (e.target === this) closeGal();
});

function closeGal() {
    galPop.classList.remove('open');
    document.body.style.overflow = '';
}

document.getElementById('gpPrev').addEventListener('click', function() {
    openGal((galIdx - 1 + galData.length) % galData.length);
});
document.getElementById('gpNext').addEventListener('click', function() {
    openGal((galIdx + 1) % galData.length);
});

/*  ESC key closes everything */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSearch();
        closeMenuPop();
        closeGal();
        if (typeof $.magnificPopup !== 'undefined') $.magnificPopup.close();
    }
});


new Swiper('.tesSwiper', {
    slidesPerView: 1,
    spaceBetween: 22,
    loop: true,
    autoplay: {
        delay: 4000,
        disableOnInteraction: false
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true
    },
    breakpoints: {
        640: {
            slidesPerView: 2
        },
        1024: {
            slidesPerView: 3
        }
    }
});


/* Real weekly countdown — the offer runs until Sunday 23:59, then resets. */
(function () {
    var H = document.getElementById('cdH'), M = document.getElementById('cdM'), S = document.getElementById('cdS');
    if (!H || !M || !S) return;
    function endOfWeek() {
        var d = new Date(), add = (7 - d.getDay()) % 7;
        var e = new Date(d.getFullYear(), d.getMonth(), d.getDate() + add, 23, 59, 59, 0);
        if (e.getTime() <= Date.now()) e = new Date(e.getTime() + 7 * 86400000);
        return e;
    }
    var target = endOfWeek();
    function pad(n) { return String(n).padStart(2, '0'); }
    function tick() {
        var diff = Math.floor((target - Date.now()) / 1000);
        if (diff <= 0) { target = endOfWeek(); diff = Math.floor((target - Date.now()) / 1000); }
        H.textContent = pad(Math.floor(diff / 3600));
        M.textContent = pad(Math.floor((diff % 3600) / 60));
        S.textContent = pad(diff % 60);
    }
    tick();
    setInterval(tick, 1000);
})();

/* â”€â”€ NEWSLETTER â”€â”€ */
document.getElementById('nlBtn').addEventListener('click', function() {
    var email = document.getElementById('nlEmail').value;
    if (email && email.includes('@')) {
        var btn = this;
        btn.textContent = '✓ Abonné !';
        btn.style.background = '#4ade80';
        btn.style.color = '#222';
        document.getElementById('nlEmail').value = '';
        setTimeout(function() {
            btn.textContent = "S'abonner";
            btn.style.background = '';
            btn.style.color = '';
        }, 3000);
    }
});

/*  NUMBER COUNTER ANIMATION*/
var numAnimated = false;
window.addEventListener('scroll', function() {
    var hero = document.getElementById('hero');
    if (!numAnimated && hero && window.scrollY > hero.offsetHeight - 300) {
        numAnimated = true;
        document.querySelectorAll('.snum').forEach(function(el) {
            var txt = el.textContent;
            var num = parseInt(txt);
            var suf = txt.replace(/[0-9]/g, '');
            if (isNaN(num)) return;
            var start = 0;
            var step = Math.ceil(num / 55);
            var iv = setInterval(function() {
                start += step;
                if (start >= num) {
                    start = num;
                    clearInterval(iv);
                }
                el.textContent = start + suf;
            }, 1400 / 55);
        });
    }
});