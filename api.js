// CINXRO API MODULE v2.0
// API: Veriphone | IPinfo | Geoapify
// Fallback: локальная проверка при исчерпании лимита

const API_KEYS = {
    veriphone: '4C179098CAA3400B811E03E6E017D4E9',
    ipinfo:    'b8f6d3c9c652a3',
    geoapify:  '7baae27a4b614f6a8aee64e3552bb215'
};

var apiStatus = {
    veriphone: true,
    ipinfo: true,
    geoapify: true
};

async function checkPhoneVeriphone(phone) {
    if (!apiStatus.veriphone) return null;
    const url = `https://api.veriphone.io/v2/verify?phone=${encodeURIComponent(phone)}&key=${API_KEYS.veriphone}`;
    try {
        const res = await fetch(url);
        if (res.status === 429 || res.status === 403) {
            apiStatus.veriphone = false;
            console.warn('[Veriphone] Лимит исчерпан -> переход на локальный режим');
            return null;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
    } catch (e) {
        console.error('[Veriphone] Ошибка:', e.message);
        apiStatus.veriphone = false;
        return null;
    }
}

async function checkIpInfo(ip) {
    if (!apiStatus.ipinfo) return null;
    const url = `https://ipinfo.io/${ip}/json?token=${API_KEYS.ipinfo}`;
    try {
        const res = await fetch(url);
        if (res.status === 429 || res.status === 403) {
            apiStatus.ipinfo = false;
            console.warn('[IPinfo] Лимит исчерпан -> переход на локальный режим');
            return null;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
    } catch (e) {
        console.error('[IPinfo] Ошибка:', e.message);
        apiStatus.ipinfo = false;
        return null;
    }
}

async function geocodeCity(city, country) {
    if (!apiStatus.geoapify) return null;
    const query = encodeURIComponent(`${city}, ${country}`);
    const url = `https://api.geoapify.com/v1/geocode/search?text=${query}&apiKey=${API_KEYS.geoapify}`;
    try {
        const res = await fetch(url);
        if (res.status === 429 || res.status === 403) {
            apiStatus.geoapify = false;
            console.warn('[Geoapify] Лимит исчерпан');
            return null;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        return data.features?.[0]?.properties || null;
    } catch (e) {
        console.error('[Geoapify] Ошибка:', e.message);
        apiStatus.geoapify = false;
        return null;
    }
}

async function getUserIp() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch (e) {
        return null;
    }
}

function getApiStatus() {
    return {
        veriphone: apiStatus.veriphone,
        ipinfo: apiStatus.ipinfo,
        geoapify: apiStatus.geoapify,
        allOk: apiStatus.veriphone && apiStatus.ipinfo && apiStatus.geoapify
    };
}

function resetApiStatus() {
    apiStatus.veriphone = true;
    apiStatus.ipinfo = true;
    apiStatus.geoapify = true;
    console.log('[API] Статус сброшен');
}
