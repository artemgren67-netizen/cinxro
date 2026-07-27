// CINXRO APP v2.0
// API + Fallback + IP search

var currentMode = 'phone';
var menuOpen = false;
var lastAnalyzedData = null;

var mobilePrefixes = {
    '7': ['900','901','902','903','904','905','906','908','909','910','911','912','913','914','915','916','917','918','919','920','921','922','923','924','925','926','927','928','929','930','931','932','933','934','935','936','937','938','939','950','951','952','953','960','961','962','963','964','965','966','967','968','969','977','978','980','981','982','983','984','985','986','987','988','989','991','992','993','994','995','996','999'],
    '1': ['200','201','202','203','205','206','207','208','209','210','212','213','214','215','216','217','218','219','220','224','225','228','229','231','234','239','240','248','251','252','253','254','256','260','262','267','269','270','272','274','276','281','283','301','302','303','304','305','307','308','309','310','312','313','314','315','316','317','318','319','320','321','323','325','327','330','331','334','336','337','339','346','347','351','352','360','361','364','369','380','385','386','401','402','404','405','406','407','408','409','410','412','413','414','415','417','419','423','424','425','430','432','434','435','440','442','443','445','458','469','470','475','478','479','480','484','501','502','503','504','505','506','507','508','509','510','512','513','514','515','516','517','518','520','530','531','534','539','540','541','551','557','559','561','562','563','564','567','570','571','572','573','574','575','580','582','585','586','601','602','603','605','606','607','608','609','610','612','614','615','616','617','618','619','620','623','626','628','629','630','631','636','641','646','650','651','657','660','661','662','667','669','678','681','682','701','702','703','704','706','707','708','712','713','714','715','716','717','718','719','720','724','725','726','727','730','731','732','734','737','740','747','754','757','760','762','763','765','769','770','772','773','774','775','779','781','785','786','801','802','803','804','805','806','808','810','812','813','814','815','816','817','818','828','830','831','832','835','838','840','843','845','847','848','850','856','857','858','859','860','862','863','864','865','870','872','878','901','903','904','906','907','908','909','910','912','913','914','915','916','917','918','919','920','925','928','931','936','937','940','941','945','947','949','951','952','954','956','959','970','971','972','973','978','979','980','984','985','989'],
    '380': ['50','66','67','68','73','93','95','96','97','98','99'],
    '44': ['71','72','73','74','75','77','78','79']
};

var landlinePrefixes = {
    '7': ['495','499','812','843','831','846','861','863','835','844','345','351','383','391','421','423','472','473','474','481','482','485','486','487','491','492','493','494','496','498','499','811','814','815','816','817','818','820','821','833','834','836','841','845','848','851','855','862','865','869','871','872','873','877','878','879','881','382','384','385','388','390','394','395','401','411','413','415','416','424','426','427','431','432','433','434','435','436','437','438','439','442','443','444','445','446','447','448','449','451','452','453','454','455','456','457','458','459','460','461','462','463','464','465','466','467','468','469','471','475','476','477','478','483','488','489']
};

var ruPhoneDatabase = {
    '495': { operator: 'MTS / MGTS', region: 'Moskva', city: 'Moskva' },
    '499': { operator: 'Beeline / MGTS', region: 'Moskva', city: 'Moskva' },
    '812': { operator: 'Rostelecom / MTS', region: 'Sankt-Peterburg', city: 'Sankt-Peterburg' },
    '843': { operator: 'Tattelecom', region: 'Tatarstan', city: 'Kazan' },
    '831': { operator: 'Rostelecom', region: 'Nizhegorodskaya obl.', city: 'Nizhniy Novgorod' },
    '846': { operator: 'Er-Telecom', region: 'Samarskaya obl.', city: 'Samara' },
    '861': { operator: 'Beeline / MTS', region: 'Krasnodarskiy kray', city: 'Krasnodar' },
    '863': { operator: 'MTS / MegaFon', region: 'Rostovskaya obl.', city: 'Rostov-na-Donu' },
    '900': { operator: 'MTS', region: 'Rossiya', city: 'Moskva' },
    '901': { operator: 'MTS', region: 'Rossiya', city: 'Moskva' },
    '903': { operator: 'Beeline', region: 'Rossiya', city: 'Moskva' },
    '905': { operator: 'MTS', region: 'Rossiya', city: 'Moskva' },
    '906': { operator: 'Beeline', region: 'Rossiya', city: 'Moskva' },
    '909': { operator: 'Beeline', region: 'Rossiya', city: 'Moskva' },
    '910': { operator: 'MTS', region: 'Rossiya', city: 'Moskva' },
    '915': { operator: 'MTS', region: 'Rossiya', city: 'Moskva' },
    '916': { operator: 'MTS', region: 'Rossiya', city: 'Moskva' },
    '917': { operator: 'Beeline', region: 'Rossiya', city: 'Moskva' },
    '925': { operator: 'MTS', region: 'Rossiya', city: 'Moskva' },
    '929': { operator: 'MTS', region: 'Rossiya', city: 'Moskva' }
};

var internationalPrefixes = [
    { code: '1', country: 'SShA / Kanada', flag: '', defaultRegion: 'SShA', defaultCity: 'Nyu-York', tz: 'UTC-5' },
    { code: '7', country: 'Rossiya / Kazakhstan', flag: '', defaultRegion: 'Rossiya', defaultCity: 'Moskva', tz: 'UTC+3' },
    { code: '33', country: 'Frantsiya', flag: '', defaultRegion: 'Il-de-Frans', defaultCity: 'Parizh', tz: 'UTC+1' },
    { code: '34', country: 'Ispaniya', flag: '', defaultRegion: 'Madrid', defaultCity: 'Madrid', tz: 'UTC+1' },
    { code: '39', country: 'Italiya', flag: '', defaultRegion: 'Lombardiya', defaultCity: 'Milan', tz: 'UTC+1' },
    { code: '44', country: 'Velikobritaniya', flag: '', defaultRegion: 'Angliya', defaultCity: 'London', tz: 'UTC+0' },
    { code: '49', country: 'Germaniya', flag: '', defaultRegion: 'Bavariya', defaultCity: 'Myunkhen', tz: 'UTC+1' },
    { code: '81', country: 'Yaponiya', flag: '', defaultRegion: 'Tokio', defaultCity: 'Tokio', tz: 'UTC+9' },
    { code: '86', country: 'Kitay', flag: '', defaultRegion: 'Pekin', defaultCity: 'Pekin', tz: 'UTC+8' },
    { code: '91', country: 'Indiya', flag: '', defaultRegion: 'Makharashtra', defaultCity: 'Mumbay', tz: 'UTC+5:30' },
    { code: '380', country: 'Ukraina', flag: '', defaultRegion: 'Kiev', defaultCity: 'Kiev', tz: 'UTC+2' },
    { code: '375', country: 'Belarus', flag: '', defaultRegion: 'Minsk', defaultCity: 'Minsk', tz: 'UTC+3' }
];

function getNumberTypeLocal(phoneNumber, countryCode) {
    var digits = phoneNumber.replace(/\D/g, '');
    if (countryCode === '7' || digits.startsWith('7')) {
        var defCode = digits.substring(1, 4);
        if (mobilePrefixes['7'] && mobilePrefixes['7'].indexOf(defCode) !== -1) {
            return { text: 'Mobile', class: 'type-mobile' };
        }
        if (landlinePrefixes['7'] && landlinePrefixes['7'].indexOf(defCode) !== -1) {
            return { text: 'Stacionarnyy', class: 'type-landline' };
        }
        if (defCode === '800') return { text: 'Besplatnyy', class: 'type-hotline' };
    }
    for (var cc in mobilePrefixes) {
        if (digits.startsWith(cc)) {
            var national = digits.substring(cc.length);
            var list = mobilePrefixes[cc];
            for (var i = 0; i < list.length; i++) {
                if (national.startsWith(list[i])) {
                    return { text: 'Mobile', class: 'type-mobile' };
                }
            }
        }
    }
    return { text: 'Neizvestnyy', class: '' };
}

function checkPhoneValid(rawNumber, defaultCountry) {
    try {
        if (!window.libphonenumber) return null;
        var phone = libphonenumber.parsePhoneNumber(rawNumber, defaultCountry);
        if (phone && phone.isValid()) return phone;
    } catch(e) {}
    return null;
}

function getPhoneType(type) {
    if (type === 'MOBILE') return { text: 'Mobile', class: 'type-mobile' };
    if (type === 'FIXED_LINE') return { text: 'Stacionarnyy', class: 'type-landline' };
    if (type === 'TOLL_FREE') return { text: 'Besplatnyy', class: 'type-hotline' };
    if (type === 'VOIP') return { text: 'Virtualnyy (VoIP)', class: 'type-virtual' };
    return { text: 'Neizvestnyy', class: '' };
}

function calculateReputation(phoneNumber) {
    var sum = 0;
    for (var i = 0; i < phoneNumber.length; i++) {
        if (!isNaN(parseInt(phoneNumber[i]))) sum += parseInt(phoneNumber[i]);
    }
    var rem = sum % 10;
    if (rem < 5) return { text: 'Chistyy / Vysokoe doverie', class: 'rep-good' };
    else if (rem < 8) return { text: 'Neytralnyy / Redkie zvonki', class: 'rep-neutral' };
    else return { text: 'Nezhelatelnyy / Spam', class: 'rep-bad' };
}

function calculateMnpStatus(phoneNumber, currentOperator) {
    var lastDigit = parseInt(phoneNumber.slice(-1)) || 0;
    if (lastDigit % 3 === 0) {
        var previousOperators = ['MTS', 'MegaFon', 'Beeline', 'T2', 'Yota'];
        var prev = previousOperators[(lastDigit * 2) % previousOperators.length];
        if (currentOperator.includes(prev)) prev = 'Beeline';
        return 'Da (Perenesen iz ' + prev + ')';
    } else {
        return 'Net (Rodnoy diapazon operatora)';
    }
}

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

// ===== API + FALLBACK: ANALIZ NOMERA =====

async function analyzePhone() {
    hideError();
    var rawInput = document.getElementById('phoneInput').value.trim();
    if (!rawInput) {
        showError('Pozhaluysta, vvedite nomer telefona.');
        return;
    }

    var btn = document.getElementById('searchBtn');
    btn.textContent = 'Skanirovanie...';
    btn.disabled = true;

    var apiResult = await checkPhoneVeriphone(rawInput);

    if (apiResult && apiResult.status === 'success') {
        displayApiResult(apiResult, rawInput);
    } else {
        console.log('[Fallback] Ispolzuetsya lokalnaya baza');
        if (currentMode === 'ru') {
            analyzeRuPhoneFallback(rawInput);
        } else {
            analyzeIntlPhoneFallback(rawInput);
        }
    }

    btn.textContent = 'Proverit nomer';
    btn.disabled = false;
}

function displayApiResult(data, rawInput) {
    var status = data.phone_valid ? 'Validen' : 'Nevaliden';
    var statusClass = data.phone_valid ? 'status-valid' : 'status-invalid';
    var rep = calculateReputation(data.phone);
    var mnp = calculateMnpStatus(data.phone, data.carrier || 'Neizvestno');

    document.getElementById('resStatus').textContent = status;
    document.getElementById('resStatus').className = 'result-value ' + statusClass;

    var repEl = document.getElementById('resReputation');
    repEl.textContent = rep.text;
    repEl.className = 'result-value ' + rep.class;

    document.getElementById('resNumber').textContent = data.international_format || data.phone;
    document.getElementById('resCountry').textContent = (data.country_name || 'Neizvestno');
    document.getElementById('resCode').textContent = data.country_prefix || '+' + (data.country_code || '');
    document.getElementById('resRegion').textContent = data.location || 'Neizvestno';
    document.getElementById('resCity').textContent = data.location || 'Neizvestno';
    document.getElementById('resOperator').textContent = data.carrier || 'Neizvestno';
    document.getElementById('resMnp').textContent = mnp;
    document.getElementById('resTimezone').textContent = data.timezone || 'UTC';

    var typeText = 'Neizvestnyy';
    var typeClass = '';
    if (data.phone_type === 'mobile') { typeText = 'Mobile'; typeClass = 'type-mobile'; }
    else if (data.phone_type === 'fixed_line') { typeText = 'Stacionarnyy'; typeClass = 'type-landline'; }
    else if (data.phone_type === 'toll_free') { typeText = 'Besplatnyy'; typeClass = 'type-hotline'; }
    else if (data.phone_type === 'voip') { typeText = 'Virtualnyy (VoIP)'; typeClass = 'type-virtual'; }

    var typeEl = document.getElementById('resType');
    typeEl.textContent = typeText;
    typeEl.className = 'result-value ' + typeClass;

    document.getElementById('resultBox').classList.add('show');
    document.getElementById('mapSection').classList.remove('show');

    lastAnalyzedData = {
        number: data.international_format || data.phone,
        reputationText: rep.text,
        country: data.country_name || 'Neizvestno',
        region: data.location || 'Neizvestno',
        city: data.location || 'Neizvestno',
        operator: data.carrier || 'Neizvestno',
        mnp: mnp
    };

    saveToHistory(lastAnalyzedData);
}

// ===== FALLBACK: LOKALNYY ANALIZ ROSSII =====

function analyzeRuPhoneFallback(rawInput) {
    var cleaned = rawInput.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('8')) {
        cleaned = '7' + cleaned.slice(1);
    }
    if (cleaned.length !== 11 || !cleaned.startsWith('7')) {
        showError('Vveden nevernyy rossiyskiy nomer. Format: +7 (XXX) XXX-XX-XX');
        return;
    }

    var defCode = cleaned.substring(1, 4);
    var dbEntry = ruPhoneDatabase[defCode];

    var operator = dbEntry ? dbEntry.operator : 'Regionalnyy / Neizvestnyy operator';
    var region = dbEntry ? dbEntry.region : 'Rossiyskaya Federatsiya';
    var city = dbEntry ? dbEntry.city : 'Moskva';

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

    document.getElementById('resStatus').textContent = phoneValid ? 'Validen' : 'V seti / Validen';
    document.getElementById('resStatus').className = 'result-value status-valid';

    var repEl = document.getElementById('resReputation');
    repEl.textContent = rep.text;
    repEl.className = 'result-value ' + rep.class;

    document.getElementById('resNumber').textContent = phoneValid ? phoneValid.formatInternational() : formattedNumber;
    document.getElementById('resCountry').textContent = 'Rossiya';
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
        country: 'Rossiya',
        region: region,
        city: city,
        operator: operator,
        mnp: mnp
    };

    saveToHistory(lastAnalyzedData);
}

// ===== FALLBACK: LOKALNYY MEZHDUNARODNYY ANALIZ =====

function analyzeIntlPhoneFallback(rawInput) {
    var cleaned = rawInput.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    var digitsOnly = cleaned.replace(/\D/g, '');

    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        showError('Nekorrektnaya dlina mezhdunarodnogo nomera.');
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
        showError('Kod strany ne nayden v baze dannykh.');
        return;
    }

    var region = matchedPrefix.defaultRegion;
    var city = matchedPrefix.defaultCity;
    var operator = 'Mezhdunarodnyy operator svyazi';
    var rep = calculateReputation(digitsOnly);
    var mnp = calculateMnpStatus(digitsOnly, operator);

    var typeInfo;
    if (phoneValid) {
        typeInfo = getPhoneType(phoneValid.getType());
    } else {
        typeInfo = getNumberTypeLocal(digitsOnly, matchedPrefix.code);
    }

    if (phoneValid) {
        document.getElementById('resStatus').textContent = 'Validen';
        document.getElementById('resStatus').className = 'result-value status-valid';
    } else {
        document.getElementById('resStatus').textContent = 'Format neizvesten';
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

// ===== POISK PO IP (NOVYY FUNKTSIONAL) =====

async function analyzeIp() {
    hideError();
    var rawInput = document.getElementById('phoneInput').value.trim();
    if (!rawInput) {
        showError('Pozhaluysta, vvedite IP-adres.');
        return;
    }

    var btn = document.getElementById('searchBtn');
    btn.textContent = 'Skanirovanie IP...';
    btn.disabled = true;

    var apiResult = await checkIpInfo(rawInput);

    if (apiResult && apiResult.ip) {
        displayIpResult(apiResult);
    } else {
        displayIpFallback(rawInput);
    }

    btn.textContent = 'Proverit IP';
    btn.disabled = false;
}

function displayIpResult(data) {
    document.getElementById('resStatus').textContent = 'Aktiven';
    document.getElementById('resStatus').className = 'result-value status-valid';

    document.getElementById('resReputation').textContent = 'Neytralnyy';
    document.getElementById('resReputation').className = 'result-value rep-neutral';

    document.getElementById('resNumber').textContent = data.ip;
    document.getElementById('resCountry').textContent = (data.country_name || data.country || 'Neizvestno');
    document.getElementById('resCode').textContent = data.country || 'N/A';
    document.getElementById('resRegion').textContent = data.region || 'Neizvestno';
    document.getElementById('resCity').textContent = data.city || 'Neizvestno';
    document.getElementById('resOperator').textContent = data.org || data.asn?.name || 'Neizvestno';
    document.getElementById('resMnp').textContent = 'N/A (IP-adres)';
    document.getElementById('resTimezone').textContent = data.timezone || 'UTC';

    var typeEl = document.getElementById('resType');
    typeEl.textContent = 'IP-adres';
    typeEl.className = 'result-value type-virtual';

    document.getElementById('resultBox').classList.add('show');
    document.getElementById('mapSection').classList.remove('show');

    lastAnalyzedData = {
        number: data.ip,
        reputationText: 'Neytralnyy',
        country: data.country_name || data.country || 'Neizvestno',
        region: data.region || 'Neizvestno',
        city: data.city || 'Neizvestno',
        operator: data.org || data.asn?.name || 'Neizvestno',
        mnp: 'N/A'
    };

    saveToHistory(lastAnalyzedData);
}

function displayIpFallback(ip) {
    var isValid = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);

    document.getElementById('resStatus').textContent = isValid ? 'Format veren' : 'Nevaliden';
    document.getElementById('resStatus').className = 'result-value ' + (isValid ? 'status-valid' : 'status-invalid');

    document.getElementById('resReputation').textContent = 'Net dannykh';
    document.getElementById('resReputation').className = 'result-value rep-neutral';

    document.getElementById('resNumber').textContent = ip;
    document.getElementById('resCountry').textContent = 'Neizvestno';
    document.getElementById('resCode').textContent = 'N/A';
    document.getElementById('resRegion').textContent = 'Net dannykh (API limit)';
    document.getElementById('resCity').textContent = 'Net dannykh (API limit)';
    document.getElementById('resOperator').textContent = 'Net dannykh (API limit)';
    document.getElementById('resMnp').textContent = 'N/A (IP-adres)';
    document.getElementById('resTimezone').textContent = 'UTC';

    var typeEl = document.getElementById('resType');
    typeEl.textContent = 'IP-adres';
    typeEl.className = 'result-value type-virtual';

    document.getElementById('resultBox').classList.add('show');
    document.getElementById('mapSection').classList.remove('show');

    lastAnalyzedData = {
        number: ip,
        reputationText: 'Net dannykh',
        country: 'Neizvestno',
        region: 'Net dannykh',
        city: 'Net dannykh',
        operator: 'Net dannykh',
        mnp: 'N/A'
    };

    saveToHistory(lastAnalyzedData);
}

// ===== MENU I NAVIGATSIYA =====

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

    if (mode === 'phone') {
        document.getElementById('modeIntl').classList.add('active');
        icon.innerHTML = '&#127758;';
        text.textContent = 'Mezhdunarodnyy poisk';
        subtitle.textContent = 'Opredelenie regiona i reputatsii po nomeru';
        input.placeholder = '+7 (999) 123-45-67';
        label.textContent = 'Vvedite mezhdunarodnyy nomer';
        btn.textContent = 'Proverit nomer';
        sideText.textContent = 'znay s kem obshchaeshsya';
        examples.innerHTML = 'Primery: <span onclick="setPhone(\'+77011234567\')">+7 701...</span> <span onclick="setPhone(\'+380441234567\')">+380 44...</span> <span onclick="setPhone(\'+12125551234\')">+1 212...</span>';
        btn.onclick = analyzePhone;
    } else if (mode === 'ru') {
        document.getElementById('modeRu').classList.add('active');
        icon.innerHTML = '&#127479;&#127482;';
        text.textContent = 'Poisk po Rossii';
        subtitle.textContent = 'Detalnaya proverka rossiyskikh nomerov';
        input.placeholder = '8 (999) 123-45-67';
        label.textContent = 'Vvedite rossiyskiy nomer';
        btn.textContent = 'Proverit nomer';
        sideText.textContent = 'bezopasnost prevyshe vsego';
        examples.innerHTML = 'Primery: <span onclick="setPhone(\'89031234567\')">8 903...</span> <span onclick="setPhone(\'+79221234567\')">+7 922...</span>';
        btn.onclick = analyzePhone;
    } else if (mode === 'ip') {
        document.getElementById('modeIp').classList.add('active');
        icon.innerHTML = '&#127760;';
        text.textContent = 'Poisk po IP';
        subtitle.textContent = 'Geolokatsiya i dannye ob IP-adrese';
        input.placeholder = '8.8.8.8';
        label.textContent = 'Vvedite IP-adres';
        btn.textContent = 'Proverit IP';
        sideText.textContent = 'kto tam za ekranom';
        examples.innerHTML = 'Primery: <span onclick="setPhone(\'8.8.8.8\')">8.8.8.8</span> <span onclick="setPhone(\'1.1.1.1\')">1.1.1.1</span>';
        btn.onclick = analyzeIp;
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
    document.getElementById('modeText').textContent = 'Pozhertvovanie';
    document.getElementById('pageSubtitle').textContent = 'Podderzhka nashego proekta';

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
        document.getElementById('modeText').textContent = 'Istoriya proverok';
        document.getElementById('pageSubtitle').textContent = 'Poslednie zaprosy';
        renderHistory();
    } else if (id === 'favoritesSection') {
        document.getElementById('toolFavorites').classList.add('active');
        document.getElementById('modeIcon').innerHTML = '&#11088;';
        document.getElementById('modeText').textContent = 'Izbrannoe';
        document.getElementById('pageSubtitle').textContent = 'Sokhranennye nomera';
        renderFavorites();
    } else if (id === 'exportSection') {
        document.getElementById('toolExport').classList.add('active');
        document.getElementById('modeIcon').innerHTML = '&#128229;';
        document.getElementById('modeText').textContent = 'Eksport dannykh';
        document.getElementById('pageSubtitle').textContent = 'Sokhranenie rezultatov';
    }

    if (menuOpen) toggleMenu();
}

// ===== INITSIALIZATSIYA =====

document.addEventListener('DOMContentLoaded', function() {
    setMode('phone');

    document.getElementById('hamburger').addEventListener('click', toggleMenu);
    document.getElementById('sidebarOverlay').addEventListener('click', toggleMenu);

    document.getElementById('phoneInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (currentMode === 'ip') analyzeIp();
            else analyzePhone();
        }
    });
});
