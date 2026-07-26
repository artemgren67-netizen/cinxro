// Основная управляющая логика приложения Cinxro

var currentMode = 'intl';
var menuOpen = false;
var lastAnalyzedData = null;

function calculateReputation(phoneNumber) {
    var sum = 0;
    for (var i = 0; i < phoneNumber.length; i++) {
        if (!isNaN(parseInt(phoneNumber[i]))) sum += parseInt(phoneNumber[i]);
    }
    var rem = sum % 10;
    if (rem < 5) {
        return { text: '🟢 Чистый / Высокое доверие', class: 'rep-good' };
    } else if (rem < 8) {
        return { text: '🟡 Нейтральный / Редкие звонки', class: 'rep-neutral' };
    } else {
        return { text: '🔴 Нежелательный / Спам БД', class: 'rep-bad' };
    }
}

function calculateMnpStatus(phoneNumber, currentOperator) {
    var lastDigit = parseInt(phoneNumber.slice(-1)) || 0;
    if (lastDigit % 3 === 0) {
        var previousOperators = ['МТС', 'МегаФон', 'Билайн', 'T2', 'Yota'];
        var prev = previousOperators[(lastDigit * 2) % previousOperators.length];
        if (currentOperator.includes(prev)) prev = 'Билайн';
        return 'Да (Перенесён из ' + prev + ')';
    } else {
        return 'Нет (Родной диапазон оператора)';
    }
}

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
    document.querySelectorAll('.tool-section').forEach(s => s.classList.remove('show'));
}

function setMode(mode) {
    currentMode = mode;
    hideAllSections();

    document.getElementById('searchContainer').style.display = 'block';

    var items = document.querySelectorAll('.sidebar-item');
    for (var i = 0; i < items.length; i++) { items[i].classList.remove('active'); }
    document.getElementById(mode === 'intl' ? 'modeIntl' : 'modeRu').classList.add('active');

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
        icon.innerHTML = '&#127758;';
        text.textContent = 'Международный поиск';
        subtitle.textContent = 'Определение региона и репутации по номеру';
        input.placeholder = '+7 (999) 123-45-67';
        label.textContent = 'Введите международный номер';
        btn.textContent = 'Проверить номер';
        sideText.textContent = 'знай с кем общаешься';
        examples.innerHTML = 'Примеры: <span onclick="setPhone(\'+77011234567\')">+7 701...</span> <span onclick="setPhone(\'+380441234567\')">+380 44...</span> <span onclick="setPhone(\'+12125551234\')">+1 212...</span>';
    } else {
        icon.innerHTML = '&#127479;&#127482;';
        text.textContent = 'Поиск по России';
        subtitle.textContent = 'Детальная проверка российских номеров';
        input.placeholder = '8 (999) 123-45-67';
        label.textContent = 'Введите российский номер';
        btn.textContent = 'Проверить номер';
        sideText.textContent = 'безопасность превыше всего';
        examples.innerHTML = 'Примеры: <span onclick="setPhone(\'89031234567\')">8 903...</span> <span onclick="setPhone(\'+79221234567\')">+7 922...</span> <span onclick="setPhone(\'79111234567\')">+7 911...</span>';
    }

    indicator.style.animation = 'none';
    indicator.offsetHeight;
    indicator.style.animation = 'fadeIn 0.4s ease';

    document.getElementById('errorBox').classList.remove('show');
    document.getElementById('resultBox').classList.remove('show');
    document.getElementById('mapSection').classList.remove('show');

    if (menuOpen) toggleMenu();
}

function showDonatePage() {
    hideAllSections();
    var items = document.querySelectorAll('.sidebar-item');
    for (var i = 0; i < items.length; i++) { items[i].classList.remove('active'); }
    document.getElementById('toolDonate').classList.add('active');

    document.getElementById('donateSection').classList.add('show');

    document.getElementById('modeIcon').innerHTML = '&#128179;';
    document.getElementById('modeText').textContent = 'Пожертвование';
    document.getElementById('pageSubtitle').textContent = 'Поддержка нашего сервиса';
    document.getElementById('sideText').textContent = 'помощь проекту';

    if (menuOpen) toggleMenu();
}

function showTool(tool) {
    hideAllSections();
    var items = document.querySelectorAll('.sidebar-item');
    for (var i = 0; i < items.length; i++) { items[i].classList.remove('active'); }

    if (tool === 'history') {
        document.getElementById('toolHistory').classList.add('active');
        document.getElementById('historySection').classList.add('show');
        renderHistory();
    } else if (tool === 'favorites') {
        document.getElementById('toolFavorites').classList.add('active');
        document.getElementById('favoritesSection').classList.add('show');
        renderFavorites();
    } else if (tool === 'export') {
        document.getElementById('toolExport').classList.add('active');
        document.getElementById('exportSection').classList.add('show');
    }

    if (menuOpen) toggleMenu();
}

function setPhone(phone) {
    document.getElementById('phoneInput').value = phone;
    if (document.getElementById('searchContainer').style.display === 'none') {
        setMode(currentMode);
    }
    analyzePhone();
}

function showError(msg) {
    var err = document.getElementById('errorBox');
    err.textContent = msg;
    err.classList.add('show');
    document.getElementById('resultBox').classList.remove('show');
    document.getElementById('mapSection').classList.remove('show');
}

function hideError() {
    document.getElementById('errorBox').classList.remove('show');
}

function analyzePhone() {
    hideError();
    var rawInput = document.getElementById('phoneInput').value.trim();
    if (!rawInput) {
        showError('Пожалуйста, введите номер телефона.');
        return;
    }

    if (currentMode === 'ru') {
        analyzeRuPhone(rawInput);
    } else {
        analyzeIntlPhone(rawInput);
    }
}

function analyzeRuPhone(rawInput) {
    var cleaned = rawInput.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('8')) {
        cleaned = '7' + cleaned.slice(1);
    }
    if (cleaned.length !== 11 || !cleaned.startsWith('7')) {
        showError('Введен неверный российский номер. Формат: +7 (XXX) XXX-XX-XX или 8XXXXXXXXXX');
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

    document.getElementById('resStatus').textContent = 'В сети / Валиден';
    document.getElementById('resStatus').className = 'result-value status-valid';

    var repEl = document.getElementById('resReputation');
    repEl.textContent = rep.text;
    repEl.className = 'result-value ' + rep.class;

    document.getElementById('resNumber').textContent = formattedNumber;
    document.getElementById('resCountry').textContent = 'Россия 🇷🇺';
    document.getElementById('resCode').textContent = '+7';
    document.getElementById('resRegion').textContent = region;
    document.getElementById('resCity').textContent = city;
    document.getElementById('resOperator').textContent = operator;
    document.getElementById('resMnp').textContent = mnp;
    document.getElementById('resTimezone').textContent = 'UTC+3 (МСК)';

    document.getElementById('resultBox').classList.add('show');

    showMap(city);

    lastAnalyzedData = {
        number: formattedNumber,
        reputationText: rep.text,
        country: 'Россия 🇷🇺',
        region: region,
        city: city,
        operator: operator,
        mnp: mnp
    };

    saveToHistory(lastAnalyzedData);
}

function analyzeIntlPhone(rawInput) {
    var cleaned = rawInput.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    var digitsOnly = cleaned.replace(/\D/g, '');

    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        showError('Некорректная длина международного номера.');
        return;
    }

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

    var nationalPart = digitsOnly.slice(matchedPrefix.code.length);
    var region = matchedPrefix.defaultRegion;
    var city = matchedPrefix.defaultCity;

    if (matchedPrefix.subCodes) {
        for (var sub in matchedPrefix.subCodes) {
            if (nationalPart.startsWith(sub)) {
                region = matchedPrefix.subCodes[sub].region;
                city = matchedPrefix.subCodes[sub].city;
                break;
            }
        }
    }

    var operator = 'Международный оператор связи';
    var rep = calculateReputation(digitsOnly);
    var mnp = calculateMnpStatus(digitsOnly, operator);

    document.getElementById('resStatus').textContent = 'В сети / Валиден';
    document.getElementById('resStatus').className = 'result-value status-valid';

    var repEl = document.getElementById('resReputation');
    repEl.textContent = rep.text;
    repEl.className = 'result-value ' + rep.class;

    document.getElementById('resNumber').textContent = '+' + digitsOnly;
    document.getElementById('resCountry').textContent = matchedPrefix.flag + ' ' + matchedPrefix.country;
    document.getElementById('resCode').textContent = '+' + matchedPrefix.code;
    document.getElementById('resRegion').textContent = region;
    document.getElementById('resCity').textContent = city;
    document.getElementById('resOperator').textContent = operator;
    document.getElementById('resMnp').textContent = mnp;
    document.getElementById('resTimezone').textContent = matchedPrefix.tz;

    document.getElementById('resultBox').classList.add('show');
    document.getElementById('mapSection').classList.remove('show');

    lastAnalyzedData = {
        number: '+' + digitsOnly,
        reputationText: rep.text,
        country: matchedPrefix.country,
        region: region,
        city: city,
        operator: operator,
        mnp: mnp
    };

    saveToHistory(lastAnalyzedData);
}

// Слушатели инициализации
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('phoneInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') analyzePhone();
    });

    renderHistory();
    renderFavorites();
});
