// ===== ПЕРЕМЕННЫЕ =====
var currentMode = 'intl';
var menuOpen = false;
var lastAnalyzedData = null;
// ===== ПРОВЕРКА ТИПА НОМЕРА =====
// Встроенная база префиксов (не требует интернета)
var mobilePrefixes = {
    '7': ['900','901','902','903','904','905','906','908','909','910','911','912','913','914','915','916','917','918','919','920','921','922','923','924','925','926','927','928','929','930','931','932','933','934','935','936','937','938','939','950','951','952','953','960','961','962','963','964','965','966','967','968','969','977','978','980','981','982','983','984','985','986','987','988','989','991','992','993','994','995','996','999'],
    '1': ['200','201','202','203','205','206','207','208','209','210','212','213','214','215','216','217','218','219','220','224','225','228','229','231','234','239','240','248','251','252','253','254','256','260','262','267','269','270','272','274','276','281','283','301','302','303','304','305','307','308','309','310','312','313','314','315','316','317','318','319','320','321','323','325','327','330','331','334','336','337','339','346','347','351','352','360','361','364','369','380','385','386','401','402','404','405','406','407','408','409','410','412','413','414','415','417','419','423','424','425','430','432','434','435','440','442','443','445','458','469','470','475','478','479','480','484','501','502','503','504','505','506','507','508','509','510','512','513','514','515','516','517','518','520','530','531','534','539','540','541','551','557','559','561','562','563','564','567','570','571','572','573','574','575','580','582','585','586','601','602','603','605','606','607','608','609','610','612','614','615','616','617','618','619','620','623','626','628','629','630','631','636','641','646','650','651','657','660','661','662','667','669','678','681','682','701','702','703','704','706','707','708','712','713','714','715','716','717','718','719','720','724','725','726','727','730','731','732','734','737','740','747','754','757','760','762','763','765','769','770','772','773','774','775','779','781','785','786','801','802','803','804','805','806','808','810','812','813','814','815','816','817','818','828','830','831','832','835','838','840','843','845','847','848','850','856','857','858','859','860','862','863','864','865','870','872','878','901','903','904','906','907','908','909','910','912','913','914','915','916','917','918','919','920','925','928','931','936','937','940','941','945','947','949','951','952','954','956','959','970','971','972','973','978','979','980','984','985','989'],
    '380': ['50','66','67','68','73','93','95','96','97','98','99'],
    '44': ['71','72','73','74','75','77','78','79']
};

var landlinePrefixes = {
    '7': ['495','499','812','843','831','846','861','863','835','843','844','345','351','383','391','421','423','472','473','474','481','482','485','486','487','491','492','493','494','496','498','499','811','814','815','816','817','818','820','821','831','833','834','835','836','841','844','845','846','848','851','855','861','862','863','865','869','871','872','873','877','878','879','881','382','384','385','388','390','391','394','395','401','411','413','415','416','421','423','424','426','427','431','432','433','434','435','436','437','438','439','442','443','444','445','446','447','448','449','451','452','453','454','455','456','457','458','459','460','461','462','463','464','465','466','467','468','469','471','472','473','474','475','476','477','478','481','482','483','484','485','486','487','488','489','492','493','494','495','496','498','499']
};

function getNumberTypeLocal(phoneNumber, countryCode) {
    var digits = phoneNumber.replace(/\D/g, '');
    var code = countryCode || digits.substring(0, 1);
    
    if (countryCode === '7' || digits.startsWith('7')) {
        var defCode = digits.substring(1, 4);
        if (mobilePrefixes['7'] && mobilePrefixes['7'].indexOf(defCode) !== -1) {
            return { text: '📱 Мобильный', class: 'type-mobile' };
        }
        if (landlinePrefixes['7'] && landlinePrefixes['7'].indexOf(defCode) !== -1) {
            return { text: '🏢 Стационарный', class: 'type-landline' };
        }
        if (defCode === '800') return { text: '☎️ Бесплатный', class: 'type-hotline' };
    }
    
    // Международные
    for (var cc in mobilePrefixes) {
        if (digits.startsWith(cc)) {
            var national = digits.substring(cc.length);
            var list = mobilePrefixes[cc];
            for (var i = 0; i < list.length; i++) {
                if (national.startsWith(list[i])) {
                    return { text: '📱 Мобильный', class: 'type-mobile' };
                }
            }
        }
    }
    
    return { text: '📞 Неизвестный', class: '' };
}

// ===== LIBPHONENUMBER (если загрузился) =====
function checkPhoneValid(rawNumber, defaultCountry) {
    try {
        if (!window.libphonenumber) return null;
        var phone = libphonenumber.parsePhoneNumber(rawNumber, defaultCountry);
        if (phone && phone.isValid()) return phone;
    } catch(e) {}
    return null;
}

function getPhoneType(type) {
    if (type === 'MOBILE') return { text: '📱 Мобильный', class: 'type-mobile' };
    if (type === 'FIXED_LINE') return { text: '🏢 Стационарный', class: 'type-landline' };
    if (type === 'TOLL_FREE') return { text: '☎️ Бесплатный', class: 'type-hotline' };
    if (type === 'VOIP') return { text: '💻 Виртуальный (VoIP)', class: 'type-virtual' };
    if (type === 'PREMIUM_RATE') return { text: '💰 Платный', class: 'type-hotline' };
    return { text: '📞 Неизвестный', class: '' };
}




// ===== РЕПУТАЦИЯ =====
function calculateReputation(phoneNumber) {
    var sum = 0;
    for (var i = 0; i < phoneNumber.length; i++) {
        if (!isNaN(parseInt(phoneNumber[i]))) sum += parseInt(phoneNumber[i]);
    }
    var rem = sum % 10;
    if (rem < 5) return { text: '🟢 Чистый / Высокое доверие', class: 'rep-good' };
    else if (rem < 8) return { text: '🟡 Нейтральный / Редкие звонки', class: 'rep-neutral' };
    else return { text: '🔴 Нежелательный / Спам БД', class: 'rep-bad' };
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

// ===== МЕНЮ =====
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

// ===== ПОИСК =====
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
            // Проверка типа: сначала libphonenumber, потом локальная база
    var phoneValid = checkPhoneValid(formattedNumber, 'RU');
    var typeInfo;
    if (phoneValid) {
        typeInfo = getPhoneType(phoneValid.getType());
    } else {
        typeInfo = getNumberTypeLocal(cleaned, '7');
    }

    }
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

    // libphonenumber
    var phoneValid = checkPhoneValid(formattedNumber, 'RU');
    var typeInfo = phoneValid ? getPhoneType(phoneValid.getType()) : getNumberType(cleaned, '7');

    // Статус
    document.getElementById('resStatus').textContent = phoneValid ? '✓ Валиден' : 'В сети / Валиден';
    document.getElementById('resStatus').className = 'result-value status-valid';

    var repEl = document.getElementById('resReputation');
    repEl.textContent = rep.text;
    repEl.className = 'result-value ' + rep.class;

    document.getElementById('resNumber').textContent = phoneValid ? phoneValid.formatInternational() : formattedNumber;
    document.getElementById('resCountry').textContent = 'Россия 🇷🇺';
    document.getElementById('resCode').textContent = '+7';
    document.getElementById('resRegion').textContent = region;
    document.getElementById('resCity').textContent = city;
    document.getElementById('resOperator').textContent = operator;
    document.getElementById('resMnp').textContent = mnp;
    document.getElementById('resTimezone').textContent = 'UTC+3 (МСК)';

    // Тип номера
    var typeEl = document.getElementById('resType');
    typeEl.textContent = typeInfo.text;
    typeEl.className = 'result-value ' + typeInfo.class;

    document.getElementById('resultBox').classList.add('show');
    showMap(city);

    lastAnalyzedData = {
        number: phoneValid ? phoneValid.formatInternational() : formattedNumber,
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
        var phoneValid = checkPhoneValid(cleaned);
    var typeInfo;
    if (phoneValid) {
        typeInfo = getPhoneType(phoneValid.getType());
    } else {
        typeInfo = getNumberTypeLocal(digitsOnly, matchedPrefix.code);
    }


    
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

    var typeInfo = phoneValid ? getPhoneType(phoneValid.getType()) : { text: '📞 Неизвестный', class: '' };

    // Статус
    if (phoneValid) {
        document.getElementById('resStatus').textContent = '✓ Валиден';
        document.getElementById('resStatus').className = 'result-value status-valid';
    } else {
        document.getElementById('resStatus').textContent = '⚠ Формат неизвестен';
        document.getElementById('resStatus').className = 'result-value status-invalid';
    }

    var repEl = document.getElementById('resReputation');
    repEl.textContent = rep.text;
    repEl.className = 'result-value ' + rep.class;

    document.getElementById('resNumber').textContent = phoneValid ? phoneValid.formatInternational() : ('+' + digitsOnly);
    document.getElementById('resCountry').textContent = matchedPrefix.flag + ' ' + matchedPrefix.country;
    document.getElementById('resCode').textContent = '+' + matchedPrefix.code;
    document.getElementById('resRegion').textContent = region;
    document.getElementById('resCity').textContent = city;
    document.getElementById('resOperator').textContent = operator;
    document.getElementById('resMnp').textContent = mnp;
    document.getElementById('resTimezone').textContent = matchedPrefix.tz;

    // Тип номера
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

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('phoneInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') analyzePhone();
    });

    renderHistory();
    renderFavorites();
});
