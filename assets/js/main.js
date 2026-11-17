/* ARZANO concept site v2 — interactions (vanilla JS, no dependencies, no trackers) */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const AR = document.documentElement.lang === 'ar';
  const ROOT = document.body.dataset.root || '';
  const LOCALE = AR ? 'ar-AE' : 'en-GB';
  const WA_NUMBER = ''; /* Arzano's WhatsApp Business number, digits only, e.g. 9715XXXXXXXX */
  const waLink = text => 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);

  const T = AR ? {
    menuOpen: 'فتح القائمة', menuClose: 'إغلاق القائمة',
    newsOk: 'شكرًا لكم، ستصلكم دعوات المعاينات الخاصة.',
    errName: 'يرجى إدخال الاسم.', errPhone: 'يرجى إدخال رقم هاتف صحيح.', errDate: 'يرجى اختيار اليوم.', errTime: 'يرجى اختيار الوقت.',
    okTitle: name => 'شكرًا لكم' + (name ? '، ' + name : '') + '.',
    okText: 'تم استلام طلبكم. سيتواصل معكم مستشاركم الخاص لتأكيد الموعد خلال ساعات.',
    city: 'المدينة', day: 'اليوم', time: 'الوقت', interest: 'الاهتمام', piece: 'القطعة',
    ics: 'إضافة إلى التقويم', waConfirm: 'التأكيد عبر واتساب', another: 'طلب آخر',
    waBooking: s => 'مرحبًا أرزانو، أودّ تأكيد معاينة خاصة: ' + s,
    icsTitle: 'معاينة خاصة مع أرزانو'
  } : {
    menuOpen: 'Open menu', menuClose: 'Close menu',
    newsOk: 'Thank you. You are on the list for private previews.',
    errName: 'Please add your name.', errPhone: 'Please add a phone number we can reach.', errDate: 'Please choose a day.', errTime: 'Please choose a time.',
    okTitle: name => 'Thank you' + (name ? ', ' + name : '') + '.',
    okText: 'Your request is with us. Your client advisor will confirm your private viewing within a few hours.',
    city: 'City', day: 'Day', time: 'Time', interest: 'Interested in', piece: 'Piece',
    ics: 'Add to calendar', waConfirm: 'Confirm on WhatsApp', another: 'Make another request',
    waBooking: s => 'Hello Arzano, I would like to confirm a private viewing: ' + s,
    icsTitle: 'Arzano private viewing'
  };

  /* Header becomes solid after scrolling */
  const header = $('.header');
  const onScroll = () => header && header.classList.toggle('is-solid', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Current section in the nav */
  const page = location.pathname.split('/').pop();
  $$('[data-nav]').forEach(a => { if (page.startsWith(a.dataset.nav)) { a.classList.add('is-active'); a.setAttribute('aria-current', 'page'); } });

  /* Mobile drawer */
  const burger = $('.burger');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    if (!burger) return;
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? T.menuClose : T.menuOpen);
  };
  if (burger) {
    burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    $$('.drawer a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  }

  /* WhatsApp links carry their own pre-filled message */
  $$('[data-wa]').forEach(a => { a.href = waLink(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });

  /* Reveal on scroll */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('in'));
  }

  /* Newsletter */
  $$('form[data-news]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const p = document.createElement('p'); p.className = 'small'; p.setAttribute('role', 'status'); p.textContent = T.newsOk;
    f.replaceWith(p);
  }));

  /* ---------------- Collection filters (state lives in the URL, so filtered views can be shared) ---------------- */
  const grid = $('#grid');
  if (grid && $('.filters')) {
    const params = new URLSearchParams(location.search);
    const sel = $('#col-select');
    const state = { f: params.get('f') || 'all', c: params.get('c') || (location.hash === '#melange' ? 'melange' : '') };
    const apply = (push = true) => {
      let n = 0;
      $$('.card', grid).forEach(card => {
        const show = (state.f === 'all' || card.dataset.cat.split(' ').includes(state.f)) && (!state.c || card.dataset.col === state.c);
        card.classList.toggle('hide', !show);
        if (show) { n++; card.classList.add('in'); }
      });
      $$('.filter').forEach(b => { const on = b.dataset.f === state.f; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
      if (sel) sel.value = state.c;
      $('#count').textContent = n;
      $('.empty').hidden = n > 0;
      if (push) {
        const q = new URLSearchParams();
        if (state.f !== 'all') q.set('f', state.f);
        if (state.c) q.set('c', state.c);
        history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
      }
    };
    const toTools = () => $('.toolbar').scrollIntoView({ behavior: 'smooth' });
    $$('.filter').forEach(b => b.addEventListener('click', () => { state.f = b.dataset.f; apply(); }));
    if (sel) sel.addEventListener('change', () => { state.c = sel.value; apply(); });
    $$('[data-col-jump]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); state.c = b.dataset.colJump; state.f = 'all'; apply(); toTools(); }));
    $$('[data-reset]').forEach(b => b.addEventListener('click', () => { state.f = 'all'; state.c = ''; apply(); }));
    apply(false);
    if (state.f !== 'all' || state.c) setTimeout(() => $('.toolbar').scrollIntoView(), 60);
  }

  /* ---------------- Piece page: hover / tap to look closer ---------------- */
  $$('[data-zoom]').forEach(z => {
    const img = $('img', z);
    const move = e => { const r = z.getBoundingClientRect(); img.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%'; };
    z.addEventListener('mousemove', move);
    z.addEventListener('mouseenter', e => { if (matchMedia('(hover:hover)').matches) { move(e); z.classList.add('is-zoom'); } });
    z.addEventListener('mouseleave', () => z.classList.remove('is-zoom'));
    z.addEventListener('click', e => { move(e); z.classList.toggle('is-zoom'); });
    z.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); img.style.transformOrigin = '50% 50%'; z.classList.toggle('is-zoom'); } });
  });

  /* ---------------- Booking: pick a day and a time ---------------- */
  const form = $('#booking');
  if (form) {
    const params = new URLSearchParams(location.search);
    const daypick = $('[data-daypick]', form), timepick = $('[data-timepick]', form);
    const err = $('.form-err', form), ok = form.parentElement.querySelector('.form-ok');
    const F = form.elements; /* form.name would be the form's own name attribute */
    const picked = { date: null, time: null };
    const fmt = (opts, d) => new Intl.DateTimeFormat(LOCALE, opts).format(d);

    /* prefill from links such as ?city=Doha or ?piece=cascade-drop-earrings */
    const city = params.get('city');
    if (city) { const o = [...F.city.options].find(o => (o.value || o.text) === city); if (o) F.city.value = o.value || o.text; }
    const piece = params.get('piece');
    const pieceName = piece ? piece.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : '';
    if (piece) F.piece.value = pieceName;

    /* 14 days starting tomorrow */
    daypick.innerHTML = '';
    const today = new Date(); today.setHours(12, 0, 0, 0);
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'day'; b.setAttribute('aria-pressed', 'false');
      b.dataset.iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      b.setAttribute('aria-label', fmt({ weekday: 'long', day: 'numeric', month: 'long' }, d));
      b.innerHTML = '<small></small><b></b><small></small>';
      b.children[0].textContent = fmt({ weekday: 'short' }, d);
      b.children[1].textContent = d.getDate();
      b.children[2].textContent = fmt({ month: 'short' }, d);
      b.addEventListener('click', () => { $$('.day', daypick).forEach(x => x.setAttribute('aria-pressed', x === b)); picked.date = d; err.textContent = ''; });
      daypick.appendChild(b);
    }
    timepick.innerHTML = '';
    ['11:00', '13:00', '15:00', '17:00', '19:00', '21:00'].forEach(t => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'slot'; b.textContent = t; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { $$('.slot', timepick).forEach(x => x.setAttribute('aria-pressed', x === b)); picked.time = t; err.textContent = ''; });
      timepick.appendChild(b);
    });

    const ics = (d, t, summary) => {
      const [h, m] = t.split(':');
      const p = n => String(n).padStart(2, '0');
      const start = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + h + m + '00';
      const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Arzano//Concierge//EN', 'BEGIN:VEVENT',
        'UID:' + Date.now() + '@arzano.com', 'DTSTAMP:' + stamp, 'DTSTART:' + start, 'DURATION:PT1H',
        'SUMMARY:' + T.icsTitle, 'DESCRIPTION:' + summary.replace(/[,;]/g, ' '), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    };

    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = F.name.value.trim(), phone = F.phone.value.trim();
      F.name.setAttribute('aria-invalid', !name);
      F.phone.setAttribute('aria-invalid', phone.replace(/\D/g, '').length < 7);
      const problem = !picked.date ? T.errDate : !picked.time ? T.errTime : !name ? T.errName : phone.replace(/\D/g, '').length < 7 ? T.errPhone : '';
      if (problem) { err.textContent = problem; return; }

      const cityLabel = F.city.options[F.city.selectedIndex].text;
      const dayLabel = fmt({ weekday: 'long', day: 'numeric', month: 'long' }, picked.date);
      const rows = [[T.city, cityLabel], [T.day, dayLabel], [T.time, picked.time], [T.interest, F.interest.value]];
      if (F.piece.value) rows.push([T.piece, F.piece.value]);
      const summary = rows.map(r => r[0] + ': ' + r[1]).join(' · ');

      ok.innerHTML = '<h4></h4><p></p><dl></dl><div class="btn-row"><a class="btn btn--gold" download="arzano-viewing.ics"></a><a class="btn" target="_blank" rel="noopener"></a><button type="button" class="btn btn--ghost"></button></div>';
      $('h4', ok).textContent = T.okTitle(name.split(' ')[0]);
      $('p', ok).textContent = T.okText;
      $('dl', ok).append(...rows.map(([k, v]) => { const d = document.createElement('div'); d.innerHTML = '<dt></dt><dd></dd>'; d.children[0].textContent = k; d.children[1].textContent = v; return d; }));
      const [icsBtn, waBtn, again] = $$('.btn', ok);
      icsBtn.textContent = T.ics;
      icsBtn.href = URL.createObjectURL(new Blob([ics(picked.date, picked.time, summary)], { type: 'text/calendar' }));
      waBtn.textContent = T.waConfirm; waBtn.href = waLink(T.waBooking(summary));
      again.textContent = T.another;
      again.addEventListener('click', () => { ok.classList.remove('show'); form.hidden = false; form.reset(); picked.date = picked.time = null; $$('[aria-pressed="true"]', form).forEach(b => b.setAttribute('aria-pressed', 'false')); });
      form.hidden = true;
      ok.classList.add('show');
      ok.focus();
    });
  }

  /* ---------------- Concierge (scripted demo of an AI assistant) ---------------- */
  const IMG = ROOT + 'assets/img/r/';
  const P = ROOT + 'pieces/';
  const EN = {
    hello: h => (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') + ' and welcome to Arzano. I am your private concierge. Are you looking for something for yourself, a gift or a bride?',
    start: ['Show earrings', 'Bridal', 'Price guidance', 'I am a retailer'],
    replies: [
      { k: ['earring', 'drop', 'cascade', 'chandelier'],
        t: 'Our cascades are the house signature: pear, marquise and brilliant-cut diamonds set to move with you. Ana de Armas wore a pair to the Oscars in 2017.',
        img: 'rc-ana-de-armas-480.webp', link: [P + 'cascade-drop-earrings.html', 'View the Cascade Drop'], chips: ['Book a private viewing', 'Show necklaces'] },
      { k: ['necklace', 'riviera', 'neck'],
        t: 'For necklaces, I would start with the Pear Riviera, a crown-like collar of graduated pear diamonds. For something lighter, the Mélange necklace layers beautifully.',
        img: 'riviera-necklace-480.webp', link: [P + 'pear-riviera-necklace.html', 'View the Pear Riviera'], chips: ['Book a private viewing', 'What makes Mélange special?'] },
      { k: ['melange', 'mélange', 'special', 'everyday', 'stack'],
        t: 'Mélange brings together diamonds of different shapes (marquise, pear and brilliant) in a single piece. It is made for everyday wear and stacks beautifully.',
        img: 'melange-ribbon-480.webp', link: [ROOT + 'collection.html?c=melange', 'See every Mélange piece'], chips: ['Price guidance', 'Book a private viewing'] },
      { k: ['bridal', 'wedding', 'bride', 'engagement'],
        t: 'For brides, we prepare a full bridal suite: necklace, earrings, bracelet and ring, designed around you. Most clients begin about six months before the wedding. Shall I arrange a bridal consultation?',
        img: 'gulf-muse-480.webp', link: [ROOT + 'collection.html?c=hailey', "Hailey's Bridal"], chips: ['Book a private viewing', 'Where can I see Arzano?'] },
      { k: ['price', 'cost', 'how much', 'budget', 'guidance'], pri: true,
        t: 'High jewellery is priced on request, because each piece is unique. As a guide, Mélange everyday pieces begin at around US$1,800. Share a budget range and I will suggest pieces; a client advisor confirms the details.',
        chips: ['Under $25k', '$25k – $100k', '$100k+'] },
      { k: ['$', 'under', '100k', '25k'], pri: true,
        t: 'Thank you. I have noted your range for your client advisor. They will prepare a private selection with photographs and certificates and send it to you on WhatsApp.',
        chips: ['Book a private viewing'] },
      { k: ['where', 'store', 'city', 'dubai', 'doha', 'riyadh', 'see arzano', 'boutique', 'shop'],
        t: 'You can see Arzano through retail partners such as Kooheji in Bahrain and The 1916 Company in the United States, or at a private appointment in Dubai, Doha, Riyadh, Jeddah, Istanbul, New York and beyond.',
        link: [ROOT + 'boutiques.html', 'Find Arzano'], chips: ['Book a private viewing', 'I am a retailer'] },
      { k: ['certif', 'gia', 'grs', 'genuine', 'authentic', 'real'],
        t: 'Every diamond is GIA-certified and every coloured gemstone is GRS-certified. You can check any GIA report yourself on gia.edu, and each piece also comes with an Arzano certificate of guarantee.',
        link: ['https://www.gia.edu/report-check-landing', 'Check a GIA report'], chips: ['Show necklaces', 'Book a private viewing'] },
      { k: ['retail', 'stock', 'wholesale', 'partner', 'trade', 'buyer'],
        t: 'Welcome. Trade partners get the full line sheet with live stock and certificates, memo terms and our trade-show calendar.',
        link: [ROOT + 'boutiques.html#trade', 'Trade enquiries'], chips: ['Book a private viewing'] },
      { k: ['book', 'appointment', 'viewing', 'visit', 'consult'], pri: true,
        t: 'With pleasure. Choose your city, a day and a time, and your advisor will confirm within a few hours. I will take you to the booking form now.',
        action: () => { const f = document.getElementById('appointment'); if (f) f.scrollIntoView({ behavior: 'smooth' }); else setTimeout(() => { location.href = ROOT + 'index.html#appointment'; }, 1400); } },
      { k: ['hello', 'hi', 'salam', 'hey'], whole: true,
        t: 'Welcome to Arzano. How may I help you today?', chips: ['Show earrings', 'Bridal', 'Book a private viewing'] }
    ],
    fallback: { t: 'Happy to help. I can show you collections, give price guidance, explain our certification or arrange a private viewing. (In the live version, this concierge answers in English and Arabic, 24/7, and hands over to a human advisor.)', chips: ['Show earrings', 'Show necklaces', 'Bridal'] },
    piece: (name, desc) => ({ t: 'The ' + name + ': ' + desc + ' Would you like to see it in person, or shall I send photographs and the certificate on WhatsApp?', chips: ['Book a private viewing', 'Price guidance'] })
  };
  const ARC = {
    hello: h => (h < 12 ? 'صباح الخير' : 'مساء الخير') + '، أهلًا بكم في أرزانو. أنا الكونسيرج الخاص بكم. هل تبحثون عن قطعة لكم، أو هدية، أو للعروس؟',
    start: ['أقراط', 'للعروس', 'الأسعار', 'أنا تاجر تجزئة'],
    replies: [
      { k: ['قرط', 'أقراط', 'حلق', 'شلال'],
        t: 'أقراط الشلال هي توقيع الدار: ألماس كمثري وماركيز وبريليانت يتحرّك مع كل خطوة. ارتدت آنا دي أرماس زوجًا منها في حفل الأوسكار 2017.',
        img: 'rc-ana-de-armas-480.webp', link: [P + 'cascade-drop-earrings.html', 'عرض أقراط الشلال'], chips: ['حجز معاينة خاصة', 'قلائد'] },
      { k: ['قلادة', 'قلائد', 'عقد'],
        t: 'أقترح قلادة ريفييرا الكمثرية، طوقًا يشبه التاج من ألماسات كمثرية متدرجة. ولإطلالة أخف، تُنسَّق قلادة ميلانج بجمال.',
        img: 'riviera-necklace-480.webp', link: [P + 'pear-riviera-necklace.html', 'عرض القطعة'], chips: ['حجز معاينة خاصة', 'ما الذي يميّز ميلانج؟'] },
      { k: ['ميلانج', 'يومي', 'يميّز', 'يميز'],
        t: 'تجمع ميلانج ألماسات بأشكال مختلفة (ماركيز وكمثري وبريليانت) في قطعة واحدة، وهي مصمَّمة للاستخدام اليومي وتُنسَّق بسهولة.',
        img: 'melange-ribbon-480.webp', link: [ROOT + 'collection.html?c=melange', 'جميع قطع ميلانج'], chips: ['الأسعار', 'حجز معاينة خاصة'] },
      { k: ['عروس', 'للعروس', 'زفاف', 'زواج', 'خطوبة'],
        t: 'نُعدّ للعروس طقمًا كاملًا: قلادة وأقراط وسوار وخاتم، مصمَّمة حولها. تبدأ معظم عميلاتنا قبل الزفاف بنحو ستة أشهر. هل أرتّب لكم استشارة خاصة؟',
        img: 'gulf-muse-480.webp', link: [ROOT + 'collection.html?c=hailey', 'هايلي للعرائس'], chips: ['حجز معاينة خاصة', 'أين أجد أرزانو؟'] },
      { k: ['سعر', 'الأسعار', '=كم', 'ميزانية', 'تكلفة'], pri: true,
        t: 'أسعار المجوهرات الراقية عند الطلب لأن كل قطعة فريدة. وللاسترشاد، تبدأ قطع ميلانج اليومية من نحو 1,800 دولار أمريكي. شاركونا الميزانية وسأقترح قطعًا مناسبة.',
        chips: ['أقل من 25 ألف دولار', '25 – 100 ألف دولار', 'أكثر من 100 ألف دولار'] },
      { k: ['ألف', 'دولار'], pri: true,
        t: 'شكرًا لكم. سجّلت الميزانية لمستشاركم الخاص، وسيُعدّ لكم مجموعة مختارة مع الصور والشهادات ويرسلها عبر واتساب.',
        chips: ['حجز معاينة خاصة'] },
      { k: ['أين', 'متجر', 'فرع', 'دبي', 'الدوحة', 'الرياض', 'أجد'],
        t: 'يمكنكم مشاهدة أرزانو لدى شركائنا مثل كوهجي في البحرين، أو في موعد خاص في دبي والدوحة والرياض وجدة وإسطنبول ونيويورك وغيرها.',
        link: [ROOT + 'boutiques.html', 'أين تجدون أرزانو'], chips: ['حجز معاينة خاصة'] },
      { k: ['شهادة', 'معتمد', 'gia', 'grs', 'أصلي'],
        t: 'كل ألماسة معتمدة من GIA وكل حجر كريم معتمد من GRS، ويمكنكم التحقق من أي تقرير بأنفسكم عبر gia.edu. وترافق كل قطعة شهادة ضمان من أرزانو.',
        link: ['https://www.gia.edu/report-check-landing', 'التحقق من تقرير GIA'], chips: ['حجز معاينة خاصة'] },
      { k: ['تاجر', 'تجزئة', 'جملة', 'شريك'],
        t: 'أهلًا بكم. يحصل شركاؤنا على الكتالوج الكامل بالمخزون المباشر والشهادات، وبرامج الأمانة، وجدول المعارض.',
        link: [ROOT + 'boutiques.html#trade', 'استفسارات التجارة'], chips: ['حجز معاينة خاصة'] },
      { k: ['موعد', 'حجز', 'معاينة', 'زيارة'], pri: true,
        t: 'بكل سرور. اختاروا المدينة واليوم والوقت، وسيؤكد مستشاركم الموعد خلال ساعات. سأنقلكم إلى نموذج الحجز الآن.',
        action: () => { const f = document.getElementById('appointment'); if (f) f.scrollIntoView({ behavior: 'smooth' }); } },
      { k: ['مرحب', 'السلام', 'أهلا', 'أهلًا', 'هلا'],
        t: 'أهلًا بكم في أرزانو. كيف يمكنني مساعدتكم اليوم؟', chips: ['أقراط', 'للعروس', 'حجز معاينة خاصة'] }
    ],
    fallback: { t: 'يسعدني مساعدتكم. يمكنني عرض المجموعات، وتقديم إرشادات الأسعار، وشرح الشهادات، أو ترتيب معاينة خاصة. (في النسخة الكاملة، يجيب الكونسيرج بالعربية والإنجليزية على مدار الساعة، ويحوّل المحادثة إلى مستشار بشري عند الحاجة.)', chips: ['أقراط', 'قلائد', 'للعروس'] }
  };
  const C = AR ? ARC : EN;

  const btn = $('.concierge-btn'), chat = $('.chat');
  if (btn && chat) {
    const body = $('.chat__body', chat), chipsEl = $('.chips', chat), input = $('.chat__foot input', chat);
    let greeted = false;
    const add = (txt, who, img, link) => {
      const m = document.createElement('div');
      m.className = 'msg msg--' + who;
      m.textContent = txt;
      if (img) { const i = document.createElement('img'); i.src = IMG + img; i.alt = ''; i.loading = 'lazy'; m.appendChild(i); }
      if (link) { const a = document.createElement('a'); a.href = link[0]; a.textContent = link[1]; if (/^https?:/.test(link[0])) { a.target = '_blank'; a.rel = 'noopener'; } m.appendChild(document.createElement('br')); m.appendChild(a); }
      body.appendChild(m); body.scrollTop = body.scrollHeight;
    };
    const setChips = list => {
      chipsEl.innerHTML = '';
      (list || []).forEach(c => { const b = document.createElement('button'); b.className = 'chip'; b.type = 'button'; b.textContent = c; b.onclick = () => send(c); chipsEl.appendChild(b); });
    };
    const match = q => {
      const s = q.toLowerCase();
      /* Latin keywords must start a word (so 'hi' doesn't fire on "this"); whole-word entries must also end one */
      /* Arabic keywords match the start of a word, after an optional و/ف/ب/ل and ال prefix; '=' marks a whole word */
      const words = s.split(/[\s،؟?.!,]+/);
      const hit = (k, whole) => {
        if (/^[a-z]/.test(k)) return new RegExp('(^|[^a-z])' + k + (whole ? '($|[^a-z])' : '')).test(s);
        if (/^[؀-ۿ=]/.test(k)) {
          if (k[0] === '=') return words.includes(k.slice(1));
          const base = k.replace(/^ال/, '');
          return words.some(x => x.startsWith(k) || x.replace(/^[وفبل]?(ال)?/, '').startsWith(base));
        }
        return s.includes(k);
      };
      const test = x => x.k.some(k => hit(k, x.whole));
      /* intents (price, budget, booking) win over product words, so "how much are the earrings?" gets price guidance */
      return C.replies.find(x => x.pri && test(x)) || C.replies.find(x => !x.pri && test(x)) || C.fallback;
    };
    const reply = r => {
      const typing = document.createElement('div'); typing.className = 'msg msg--bot typing'; typing.innerHTML = '<i></i><i></i><i></i>';
      body.appendChild(typing); body.scrollTop = body.scrollHeight;
      setTimeout(() => { typing.remove(); add(r.t, 'bot', r.img, r.link); setChips(r.chips); if (r.action) r.action(); }, 900);
    };
    const send = (q, r) => { if (!q.trim()) return; add(q, 'me'); setChips([]); reply(r || match(q)); };
    const greet = () => {
      if (greeted) return;
      greeted = true;
      add(C.hello(new Date().getHours()), 'bot'); setChips(C.start);
    };
    const setOpen = open => {
      chat.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
      if (open) { greet(); input.focus(); }
    };
    btn.addEventListener('click', () => setOpen(!chat.classList.contains('open')));
    $('.chat__close', chat).addEventListener('click', () => { setOpen(false); btn.focus(); });
    $('.chat__foot', chat).addEventListener('submit', e => { e.preventDefault(); send(input.value); input.value = ''; });

    /* "Ask the concierge" on a piece page answers about that piece */
    $$('[data-ask]').forEach(b => b.addEventListener('click', () => {
      setOpen(true);
      const name = ($('.pdp__name') || {}).textContent || '';
      const desc = ($('.pdp__info .lede') || {}).textContent || '';
      send(b.dataset.ask, EN.piece ? EN.piece(name, desc) : null);
    }));
  }

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (chat && chat.classList.contains('open')) { chat.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    if (document.body.classList.contains('menu-open')) { setMenu(false); burger.focus(); }
  });
})();
