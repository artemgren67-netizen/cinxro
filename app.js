// CINXRO APP v2.1
// API + Fallback + IP search
// Исправленная версия с русским языком

var currentMode = 'intl';
var menuOpen = false;
var lastAnalyzedData = null;

// ===== УТИЛИТЫ =====

function hideError() {
    document.getElementById('errorBox').classList.remove('show');
}

function showError(msg) {
    var box = document.getElementById('errorBox');
    box.textContent = msg;
    box.classList.add('show');
}

function setPhone(val) {
    document.getElementById('phoneInput').value = val;
}

// Единая точка входа для поиска — выбирает нужный анализ
// в зависимости от текущего режима (intl / ru / ip)
function runSearch() {
    if (currentMode === 'ip') {
        analyzeIp();
    } else {
        analyzePhone();
    }
}

// ===== API + FALLBACK: АНАЛИЗ НОМЕРА =====

async function analyzePhone() {
    hideError();
    var rawInput = document.getElementById('phoneInput').value.trim();
    if (!rawInput) {
        showError('Пожалуйста, введите номер телефона.');
        return;
    }

    var btn = document.getElementById('searchBtn');
    btn.textContent = 'Сканирование...';
    btn.disabled = true;

    if (currentMode === 'ru') {
        // Для российских номеров локальная база (db.js) даёт более точные
        // и полные данные (оператор / регион / город), чем бесплатный тариф
        // внешнего API — который для многих номеров возвращает пустые поля.
        // Поэтому в режиме "Поиск по России" используем её напрямую,
        // это же гарантирует, что карта всегда будет показана.
        analyzeRuPhoneFallback(rawInput);
    } else {
        var apiResult = await checkPhoneVeriphone(rawInput);

        if (apiResult && apiResult.status === 'success' && hasUsefulApiData(apiResult)) {
            displayApiResult(apiResult, rawInput);
        } else {
            console.log('[Fallback] Используется локальная база');
            analyzeIntlPhoneFallback(rawInput);
        }
    }

    btn.textContent = 'Проверить номер';
    btn.disabled = false;
}

// Проверяет, вернул ли API реально полезные данные,
// а не просто "success" с пустыми полями (страна/город/оператор неизвестны)
function hasUsefulApiData(data) {
    return !!(data.country_name || data.location || data.carrier);
}

function displayApiResult(data, rawInput) {
    var status = data.phone_valid ? 'Валиден' : 'Невалиден';
    var statusClass = data.phone_valid ? 'status-valid' : 'status-invalid';
    var rep = calculateReputation(data.phone);
    var mnp = calculateMnpStatus(data.phone, data.carrier || 'Неизвестно');

    document.getElementById('resStatus').textContent = status;
    document.getElementById('resStatus').className = 'result-value ' + statusClass;

    var repEl = document.getElementById('resReputation');
    repEl.textContent = rep.text;
    repEl.className = 'result-value ' + rep.class;

    document.getElementById('resNumber').textContent = data.international_format || data.phone;
    document.getElementById('resCountry').textContent = (data.country_name || 'Неизвестно');
    document.getElementById('resCode').textContent = data.country_prefix || '+' + (data.country_code || '');
    document.getElementById('resRegion').textContent = data.location || 'Неизвестно';
    document.getElementById('resCity').textContent = data.location || 'Неизвестно';
    document.getElementById('resOperator').textContent = data.carrier || 'Неизвестно';
    document.getElementById('resMnp').textContent = mnp;
    document.getElementById('resTimezone').textContent = data.timezone || 'UTC';

    var typeText = 'Неизвестный';
    var typeClass = '';
    if (data.phone_type === 'mobile') { typeText = 'Мобильный'; typeClass = 'type-mobile'; }
    else if (data.phone_type === 'fixed_line') { typeText = 'Стационарный'; typeClass = 'type-landline'; }
    else if (data.phone_type === 'toll_free') { typeText = 'Бесплатный'; typeClass = 'type-hotline'; }
    else if (data.phone_type === 'voip') { typeText = 'Виртуальный (VoIP)'; typeClass = 'type-virtual'; }

    var typeEl = document.getElementById('resType');
    typeEl.textContent = typeText;
    typeEl.className = 'result-value ' + typeClass;

    document.getElementById('resultBox').classList.add('show');
    document.getElementById('mapSection').classList.remove('show');

    lastAnalyzedData = {
        number: data.international_format || data.phone,
        reputationText: rep.text,
        country: data.country_name || 'Неизвестно',
        region: data.location || 'Неизвестно',
        city: data.location || 'Неизвестно',
        operator: data.carrier || 'Неизвестно',
        mnp: mnp
    };

    saveToHistory(lastAnalyzedData);
}

// ===== FALLBACK: ЛОКАЛЬНЫЙ АНАЛИЗ РОССИИ =====

function analyzeRuPhoneFallback(rawInput) {
    var cleaned = rawInput.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('8')) {
        cleaned = '7' + cleaned.slice(1);
    }
    if (cleaned.length !== 11 || !cleaned.startsWith('7')) {
        showError('Введён неверный российский номер. Формат: +7 (XXX) XXX-XX-XX');
        return;
    }

    var defCode = cleaned.substring(1, 4);
    var dbEntry = ruPhoneDatabase[defCode];

    var operator = dbEntry ? dbEntry.operator : 'Региональный / Неизвестный оператор';
    var region = dbEntry ? dbEntry.region : 'Российская Федерация';
    var city = dbEntry ? dbEntry.city : 'Москва';

    var rep = calculateReputation(cleaned);
    var mnp = calculateMnpStatus(cleaned, operator);

    var formattedNumber = '+7 (' + defCode + ') ' + cleaned.substring(4, 7) + '-' + cleaned.substring(7, 9) + '-' + cleaned.substring(9, 11);

    var phoneValid = checkPhoneValid(formattedNumber, 'RU');
    var typeInfo;
    if (phoneValid) {
        typeInfo = getPhoneType(phoneValid.getType());
    } else {
        typeInfo = getNumberTypeLocal(cleaned, '7');
    }

    document.getElementById('resStatus').textContent = phoneValid ? 'Валиден' : 'В сети / Валиден';
    document.getElementById('resStatus').className = 'result-value status-valid';

    var repEl = document.getElementById('resReputation');
    repEl.textContent = rep.text;
    repEl.className = 'result-value ' + rep.class;

    document.getElementById('resNumber').textContent = phoneValid ? phoneValid.formatInternational() : formattedNumber;
    document.getElementById('resCountry').textContent = 'Россия';
    document.getElementById('resCode').textContent = '+7';
    document.getElementById('resRegion').textContent = region;
    document.getElementById('resCity').textContent = city;
    document.getElementById('resOperator').textContent = operator;
    document.getElementById('resMnp').textContent = mnp;
    document.getElementById('resTimezone').textContent = 'UTC+3 (MSK)';

    var typeEl = document.getElementById('resType');
    typeEl.textContent = typeInfo.text;
    typeEl.className = 'result-value ' + typeInfo.class;

    document.getElementById('resultBox').classList.add('show');
    if (typeof showMap === 'function') showMap(city);

    lastAnalyzedData = {
        number: phoneValid ? phoneValid.formatInternational() : formattedNumber,
        reputationText: rep.text,
        country: 'Россия',
        region: region,
        city: city,
        operator: operator,
        mnp: mnp
    };

    saveToHistory(lastAnalyzedData);
}

// ===== FALLBACK: ЛОКАЛЬНЫЙ МЕЖДУНАРОДНЫЙ АНАЛИЗ =====

function analyzeIntlPhoneFallback(rawInput) {
    var cleaned = rawInput.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    var digitsOnly = cleaned.replace(/\D/g, '');

    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        showError('Некорректная длина международного номера.');
        return;
    }

    var phoneValid = checkPhoneValid(cleaned);

    var matchedPrefix = null;
    for (var i = 0; i < internationalPrefixes.length; i++) {
        var p = internationalPrefixes[i];
        if (digitsOnly.startsWith(p.code)) {
            if (!matchedPrefix || p.code.length > matchedPrefix.code.length) {
                matchedPrefix = p;
            }
        }
    }

    if (!matchedPrefix) {
        showError('Код страны не найден в базе данных.');
        return;
    }

    var region = matchedPrefix.defaultRegion;
    var city = matchedPrefix.defaultCity;
    var operator = 'Международный оператор связи';
    var rep = calculateReputation(digitsOnly);
    var mnp = calculateMnpStatus(digitsOnly, operator);

    var typeInfo;
    if (phoneValid) {
        typeInfo = getPhoneType(phoneValid.getType());
    } else {
        typeInfo = getNumberTypeLocal(digitsOnly, matchedPrefix.code);
    }

    if (phoneValid) {
        document.getElementById('resStatus').textContent = 'Валиден';
        document.getElementById('resStatus').className = 'result-value status-valid';
    } else {
        document.getElementById('resStatus').textContent = 'Формат неизвестен';
        document.getElementById('resStatus').className = 'result-value status-invalid';
    }

    var repEl = document.getElementById('resReputation');
    repEl.textContent = rep.text;
    repEl.className = 'result-value ' + rep.class;

    document.getElementById('resNumber').textContent = phoneValid ? phoneValid.formatInternational() : ('+' + digitsOnly);
    document.getElementById('resCountry').textContent = matchedPrefix.country;
    document.getElementById('resCode').textContent = '+' + matchedPrefix.code;
    document.getElementById('resRegion').textContent = region;
    document.getElementById('resCity').textContent = city;
    document.getElementById('resOperator').textContent = operator;
    document.getElementById('resMnp').textContent = mnp;
    document.getElementById('resTimezone').textContent = matchedPrefix.tz;

    var typeEl = document.getElementById('resType');
    typeEl.textContent = typeInfo.text;
    typeEl.className = 'result-value ' + typeInfo.class;

    document.getElementById('resultBox').classList.add('show');
    document.getElementById('mapSection').classList.remove('show');

    lastAnalyzedData = {
        number: phoneValid ? phoneValid.formatInternational() : ('+' + digitsOnly),
        reputationText: rep.text,
        country: matchedPrefix.country,
        region: region,
        city: city,
        operator: operator,
        mnp: mnp
    };

    saveToHistory(lastAnalyzedData);
}

// ===== ПОИСК ПО IP =====

async function analyzeIp() {
    hideError();
    var rawInput = document.getElementById('phoneInput').value.trim();
    if (!rawInput) {
        showError('Пожалуйста, введите IP-адрес.');
        return;
    }

    var btn = document.getElementById('searchBtn');
    btn.textContent = 'Сканирование IP...';
    btn.disabled = true;

    var apiResult = await checkIpInfo(rawInput);

    if (apiResult && apiResult.ip) {
        displayIpResult(apiResult);
    } else {
        displayIpFallback(rawInput);
    }

    btn.textContent = 'Проверить IP';
    btn.disabled = false;
}

function displayIpResult(data) {
    document.getElementById('resStatus').textContent = 'Активен';
    document.getElementById('resStatus').className = 'result-value status-valid';

    document.getElementById('resReputation').textContent = 'Нейтральный';
    document.getElementById('resReputation').className = 'result-value rep-neutral';

    document.getElementById('resNumber').textContent = data.ip;
    document.getElementById('resCountry').textContent = (data.country_name || data.country || 'Неизвестно');
    document.getElementById('resCode').textContent = data.country || 'N/A';
    document.getElementById('resRegion').textContent = data.region || 'Неизвестно';
    document.getElementById('resCity').textContent = data.city || 'Неизвестно';
    document.getElementById('resOperator').textContent = data.org || (data.asn && data.asn.name) || 'Неизвестно';
    document.getElementById('resMnp').textContent = 'N/A (IP-адрес)';
    document.getElementById('resTimezone').textContent = data.timezone || 'UTC';

    var typeEl = document.getElementById('resType');
    typeEl.textContent = 'IP-адрес';
    typeEl.className = 'result-value type-virtual';

    document.getElementById('resultBox').classList.add('show');
    document.getElementById('mapSection').classList.remove('show');

    lastAnalyzedData = {
        number: data.ip,
        reputationText: 'Нейтральный',
        country: data.country_name || data.country || 'Неизвестно',
        region: data.region || 'Неизвестно',
        city: data.city || 'Неизвестно',
        operator: data.org || (data.asn && data.asn.name) || 'Неизвестно',
        mnp: 'N/A'
    };

    saveToHistory(lastAnalyzedData);
}

function displayIpFallback(ip) {
    var isValid = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);

    document.getElementById('resStatus').textContent = isValid ? 'Формат верен' : 'Невалиден';
    document.getElementById('resStatus').className = 'result-value ' + (isValid ? 'status-valid' : 'status-invalid');

    document.getElementById('resReputation').textContent = 'Нет данных';
    document.getElementById('resReputation').className = 'result-value rep-neutral';

    document.getElementById('resNumber').textContent = ip;
    document.getElementById('resCountry').textContent = 'Неизвестно';
    document.getElementById('resCode').textContent = 'N/A';
    document.getElementById('resRegion').textContent = 'Нет данных (лимит API)';
    document.getElementById('resCity').textContent = 'Нет данных (лимит API)';
    document.getElementById('resOperator').textContent = 'Нет данных (лимит API)';
    document.getElementById('resMnp').textContent = 'N/A (IP-адрес)';
    document.getElementById('resTimezone').textContent = 'UTC';

    var typeEl = document.getElementById('resType');
    typeEl.textContent = 'IP-адрес';
    typeEl.className = 'result-value type-virtual';

    document.getElementById('resultBox').classList.add('show');
    document.getElementById('mapSection').classList.remove('show');

    lastAnalyzedData = {
        number: ip,
        reputationText: 'Нет данных',
        country: 'Неизвестно',
        region: 'Нет данных',
        city: 'Нет данных',
        operator: 'Нет данных',
        mnp: 'N/A'
    };

    saveToHistory(lastAnalyzedData);
}

// ===== МЕНЮ И НАВИГАЦИЯ =====

function toggleMenu() {
    menuOpen = !menuOpen;
    document.getElementById('hamburger').classList.toggle('active', menuOpen);
    document.getElementById('sidebar').classList.toggle('active', menuOpen);
    document.getElementById('sidebarOverlay').classList.toggle('active', menuOpen);
    document.body.style.overflow = menuOpen ? 'hidden' : '';
}

function hideAllSections() {
    document.getElementById('searchContainer').style.display = 'none';
    document.getElementById('donateSection').classList.remove('show');
    document.querySelectorAll('.tool-section').forEach(function(s) { s.classList.remove('show'); });
}

function setMode(mode) {
    currentMode = mode;
    hideAllSections();
    document.getElementById('searchContainer').style.display = 'block';

    var items = document.querySelectorAll('.sidebar-item');
    for (var i = 0; i < items.length; i++) { items[i].classList.remove('active'); }

    var indicator = document.getElementById('modeIndicator');
    var icon = document.getElementById('modeIcon');
    var text = document.getElementById('modeText');
    var subtitle = document.getElementById('pageSubtitle');
    var input = document.getElementById('phoneInput');
    var label = document.getElementById('inputLabel');
    var btn = document.getElementById('searchBtn');
    var examples = document.getElementById('examplesBox');
    var sideText = document.getElementById('sideText');

    if (mode === 'intl') {
        document.getElementById('modeIntl').classList.add('active');
        icon.innerHTML = '&#127758;';
        text.textContent = 'Международный поиск';
        subtitle.textContent = 'Определение региона и репутации по номеру';
        input.placeholder = '+7 (999) 123-45-67';
        label.textContent = 'Введите международный номер';
        btn.textContent = 'Проверить номер';
        sideText.textContent = 'знай с кем общаешься';
        examples.innerHTML = 'Примеры: <span data-phone="+79031234567">+7 903...</span><span data-phone="+380441234567">+380 44...</span><span data-phone="+12125551234">+1 212...</span>';
        bindExampleClicks();
    } else if (mode === 'ru') {
        document.getElementById('modeRu').classList.add('active');
        icon.innerHTML = '&#127479;&#127482;';
        text.textContent = 'Поиск по России';
        subtitle.textContent = 'Детальная проверка российских номеров';
        input.placeholder = '8 (999) 123-45-67';
        label.textContent = 'Введите российский номер';
        btn.textContent = 'Проверить номер';
        sideText.textContent = 'безопасность превыше всего';
        examples.innerHTML = 'Примеры: <span data-phone="89031234567">8 903...</span><span data-phone="+79221234567">+7 922...</span>';
        bindExampleClicks();
    } else if (mode === 'ip') {
        document.getElementById('modeIp').classList.add('active');
        icon.innerHTML = '&#127760;';
        text.textContent = 'Поиск по IP';
        subtitle.textContent = 'Геолокация и данные об IP-адресе';
        input.placeholder = '8.8.8.8';
        label.textContent = 'Введите IP-адрес';
        btn.textContent = 'Проверить IP';
        sideText.textContent = 'кто там за экраном';
        examples.innerHTML = 'Примеры: <span data-phone="8.8.8.8">8.8.8.8</span><span data-phone="1.1.1.1">1.1.1.1</span>';
        bindExampleClicks();
    }

    indicator.style.animation = 'none';
    indicator.offsetHeight;
    indicator.style.animation = 'fadeIn 0.4s ease';

    document.getElementById('errorBox').classList.remove('show');
    document.getElementById('resultBox').classList.remove('show');
    document.getElementById('mapSection').classList.remove('show');

    if (menuOpen) toggleMenu();
}

function bindExampleClicks() {
    document.querySelectorAll('#examplesBox span').forEach(function(span) {
        span.addEventListener('click', function() {
            setPhone(this.getAttribute('data-phone'));
        });
    });
}

function showDonatePage() {
    hideAllSections();
    var items = document.querySelectorAll('.sidebar-item');
    for (var i = 0; i < items.length; i++) { items[i].classList.remove('active'); }
    document.getElementById('toolDonate').classList.add('active');
    document.getElementById('donateSection').classList.add('show');

    document.getElementById('modeIcon').innerHTML = '&#128179;';
    document.getElementById('modeText').textContent = 'Пожертвование';
    document.getElementById('pageSubtitle').textContent = 'Поддержка нашего проекта';

    if (menuOpen) toggleMenu();
}

function showToolSection(id) {
    hideAllSections();
    document.getElementById('searchContainer').style.display = 'block';
    document.querySelectorAll('.tool-section').forEach(function(s) { s.classList.remove('show'); });
    document.getElementById(id).classList.add('show');

    var items = document.querySelectorAll('.sidebar-item');
    for (var i = 0; i < items.length; i++) { items[i].classList.remove('active'); }

    if (id === 'historySection') {
        document.getElementById('toolHistory').classList.add('active');
        document.getElementById('modeIcon').innerHTML = '&#128220;';
        document.getElementById('modeText').textContent = 'История проверок';
        document.getElementById('pageSubtitle').textContent = 'Последние запросы';
        renderHistory();
    } else if (id === 'favoritesSection') {
        document.getElementById('toolFavorites').classList.add('active');
        document.getElementById('modeIcon').innerHTML = '&#11088;';
        document.getElementById('modeText').textContent = 'Избранное';
        document.getElementById('pageSubtitle').textContent = 'Сохранённые номера';
        renderFavorites();
    } else if (id === 'exportSection') {
        document.getElementById('toolExport').classList.add('active');
        document.getElementById('modeIcon').innerHTML = '&#128229;';
        document.getElementById('modeText').textContent = 'Экспорт данных';
        document.getElementById('pageSubtitle').textContent = 'Сохранение результатов';
    }

    if (menuOpen) toggleMenu();
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

document.addEventListener('DOMContentLoaded', function() {
    setMode('intl');

    // Гамбургер
    document.getElementById('hamburger').addEventListener('click', toggleMenu);
    document.getElementById('sidebarOverlay').addEventListener('click', toggleMenu);

    // Режимы
    document.getElementById('modeIntl').addEventListener('click', function() { setMode('intl'); });
    document.getElementById('modeRu').addEventListener('click', function() { setMode('ru'); });
    document.getElementById('modeIp').addEventListener('click', function() { setMode('ip'); });

    // Инструменты
    document.getElementById('toolHistory').addEventListener('click', function() { showToolSection('historySection'); });
    document.getElementById('toolFavorites').addEventListener('click', function() { showToolSection('favoritesSection'); });
    document.getElementById('toolExport').addEventListener('click', function() { showToolSection('exportSection'); });
    document.getElementById('toolDonate').addEventListener('click', showDonatePage);

    // Кнопки
    document.getElementById('searchBtn').addEventListener('click', runSearch);
    document.getElementById('favBtn').addEventListener('click', addCurrentToFavorites);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
    document.getElementById('exportJsonBtn').addEventListener('click', exportJSON);
    document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
    document.getElementById('exportPdfBtn').addEventListener('click', exportPDF);
    document.getElementById('backToSearchBtn').addEventListener('click', function() { setMode('intl'); });

    // Карта
    document.getElementById('mapExpandBtn').addEventListener('click', openMapModal);
    document.getElementById('mapModalClose').addEventListener('click', closeMapModal);
    document.getElementById('mapModalOverlay').addEventListener('click', function(e) {
        if (e.target.id === 'mapModalOverlay') closeMapModal();
    });
    document.getElementById('zoomInBtn').addEventListener('click', function() { zoomMap(1.25); });
    document.getElementById('zoomOutBtn').addEventListener('click', function() { zoomMap(0.8); });
    document.getElementById('zoomResetBtn').addEventListener('click', resetZoom);

    // Слои карты
    document.querySelectorAll('.layer-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            changeMapLayer(this.getAttribute('data-layer'), this);
        });
    });

    // Enter в поле ввода
    document.getElementById('phoneInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            runSearch();
        }
    });
});
