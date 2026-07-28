// Работа с локальным хранилищем (LocalStorage), история и избранное

function getStorage(key) {
    try { return JSON.parse(localStorage.getItem('cinxro_' + key)) || []; }
    catch(e) { return []; }
}

function setStorage(key, val) {
    localStorage.setItem('cinxro_' + key, JSON.stringify(val));
}

function saveToHistory(item) {
    var history = getStorage('history');
    history = history.filter(h => h.number !== item.number);
    history.unshift(item);
    if (history.length > 20) history.pop();
    setStorage('history', history);
}

function toggleFavorite(item) {
    var favs = getStorage('favorites');
    var exists = favs.some(f => f.number === item.number);
    if (exists) {
        favs = favs.filter(f => f.number !== item.number);
    } else {
        favs.unshift(item);
    }
    setStorage('favorites', favs);
    renderFavorites();
}

function addCurrentToFavorites() {
    if (!lastAnalyzedData) return;
    toggleFavorite(lastAnalyzedData);
    alert('Номер добавлен в избранное!');
}

function clearHistory() {
    setStorage('history', []);
    renderHistory();
}

function renderHistory() {
    var list = document.getElementById('historyList');
    var history = getStorage('history');
    if (history.length === 0) {
        list.innerHTML = '<div class="empty-msg">История запросов пуста.</div>';
        return;
    }
    list.innerHTML = history.map(item => `
        <div class="item-card">
            <div class="item-info">
                <div class="phone">${item.number}</div>
                <div class="meta">${item.country || ''} | ${item.region || ''} | ${item.city || ''}</div>
            </div>
            <div class="item-actions">
                <button class="icon-btn" data-phone="${item.number}">📋</button>
            </div>
        </div>
    `).join('');

    // Bind copy buttons
    list.querySelectorAll('.icon-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            setPhone(this.getAttribute('data-phone'));
        });
    });
}

function renderFavorites() {
    var list = document.getElementById('favoritesList');
    var favs = getStorage('favorites');
    if (favs.length === 0) {
        list.innerHTML = '<div class="empty-msg">В избранном пока ничего нет.</div>';
        return;
    }
    list.innerHTML = favs.map((item, idx) => `
        <div class="item-card">
            <div class="item-info">
                <div class="phone">${item.number}</div>
                <div class="meta">${item.country || ''} | ${item.region || ''} | ${item.city || ''}</div>
            </div>
            <div class="item-actions">
                <button class="icon-btn" data-copy-phone="${item.number}">📋</button>
                <button class="icon-btn" data-remove-idx="${idx}">🗑</button>
            </div>
        </div>
    `).join('');

    // Bind copy buttons
    list.querySelectorAll('[data-copy-phone]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            setPhone(this.getAttribute('data-copy-phone'));
        });
    });

    // Bind delete buttons (по индексу в массиве избранного,
    // а не через JSON в HTML-атрибуте — так апостроф/кавычки
    // в данных больше не сломают верстку)
    list.querySelectorAll('[data-remove-idx]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var idx = parseInt(this.getAttribute('data-remove-idx'), 10);
            var current = getStorage('favorites');
            var item = current[idx];
            if (item) toggleFavorite(item);
        });
    });
}

function downloadFile(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

function exportJSON() {
    var history = getStorage('history');
    if (!history.length) return alert('История запросов пуста!');
    downloadFile(JSON.stringify(history, null, 2), 'cinxro_history.json', 'application/json');
}

function exportCSV() {
    var history = getStorage('history');
    if (!history.length) return alert('История запросов пуста!');
    var csv = 'Номер,Репутация,Страна,Регион,Город,Оператор,MNP\n' + 
        history.map(h => `"${h.number}","${h.reputationText}","${h.country}","${h.region}","${h.city}","${h.operator}","${h.mnp}"`).join('\n');
    downloadFile(csv, 'cinxro_history.csv', 'text/csv;charset=utf-8;');
}

function exportPDF() {
    if (!lastAnalyzedData) return alert('Сначала выполните проверку номера.');
    window.print();
}
