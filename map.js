// Логика векторной SVG карты и интерактивного модального окна

var currentLayer = 'layer-cyber';
var currentCity = 'Москва';

var zoomScale = 1;
var panX = 0;
var panY = 0;
var isDragging = false;
var startX = 0;
var startY = 0;

function renderSvgInto(containerId) {
    var container = document.getElementById(containerId);
    var template = document.getElementById('mapSvgTemplate');
    container.innerHTML = '';
    var clone = template.content.cloneNode(true);
    container.appendChild(clone);

    var svgNS = 'http://www.w3.org/2000/svg';
    var activeSvg = container.querySelector('svg');
    activeSvg.setAttribute('class', 'map-svg ' + currentLayer);

    var gridGroup = container.querySelector('.map-grid-group');
    for (var i = 0; i <= 400; i += 25) {
        var line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', i); line.setAttribute('y1', 0);
        line.setAttribute('x2', i); line.setAttribute('y2', 230);
        line.setAttribute('class', 'map-grid-line');
        gridGroup.appendChild(line);
    }
    for (var j = 0; j <= 230; j += 25) {
        var line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', 0); line.setAttribute('y1', j);
        line.setAttribute('x2', 400); line.setAttribute('y2', j);
        line.setAttribute('class', 'map-grid-line');
        gridGroup.appendChild(line);
    }

    var netGroup = container.querySelector('.network-lines-group');
    networkConnections.forEach(function(conn) {
        var cityA = mainNodes[conn[0]];
        var cityB = mainNodes[conn[1]];
        if (cityA && cityB) {
            var line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', cityA.x); line.setAttribute('y1', cityA.y);
            line.setAttribute('x2', cityB.x); line.setAttribute('y2', cityB.y);
            line.setAttribute('class', 'net-line');
            line.setAttribute('data-city1', conn[0]);
            line.setAttribute('data-city2', conn[1]);
            netGroup.appendChild(line);
        }
    });

    var nodesGroup = container.querySelector('.city-nodes-group');
    for (var name in mainNodes) {
        var node = mainNodes[name];
        var circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', node.x); circle.setAttribute('cy', node.y);
        circle.setAttribute('r', 1.8);
        circle.setAttribute('class', 'city-node');
        circle.setAttribute('data-city', name);

        var text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', node.x + 2.5); text.setAttribute('y', node.y + 1.5);
        text.setAttribute('class', 'city-label');
        text.textContent = node.label;

        nodesGroup.appendChild(circle);
        nodesGroup.appendChild(text);
    }
}

function changeMapLayer(layerClass, btnEl) {
    currentLayer = layerClass;
    var btns = document.querySelectorAll('.layer-btn');
    btns.forEach(function(b) { b.classList.remove('active'); });
    if (btnEl) btnEl.classList.add('active');

    var svgs = document.querySelectorAll('.map-svg');
    svgs.forEach(function(svg) {
        svg.setAttribute('class', 'map-svg ' + layerClass);
    });
}

function updateSvgTarget(containerId, cityName) {
    var container = document.getElementById(containerId);
    var baseCity = cityName.split(' (')[0];
    var cityData = cityCoords[baseCity] || cityCoords['Москва'];

    var nodes = container.querySelectorAll('.city-node');
    nodes.forEach(function(n) { n.classList.remove('active'); });

    var lines = container.querySelectorAll('.net-line');
    lines.forEach(function(l) { l.classList.remove('active'); });

    var targetNode = container.querySelector('.city-node[data-city="' + baseCity + '"]');
    if (targetNode) { targetNode.classList.add('active'); }

    var targetLines = container.querySelectorAll('.net-line[data-city1="' + baseCity + '"], .net-line[data-city2="' + baseCity + '"]');
    targetLines.forEach(function(l) { l.classList.add('active'); });

    var targetDot = container.querySelector('.target-dot');
    var targetRing = container.querySelector('.target-ring');
    var targetGroup = container.querySelector('.target-group');
    var arrow = container.querySelector('.target-arrow');
    var labelGroup = container.querySelector('.label-group');
    var labelText = container.querySelector('.label-text');
    var labelBg = container.querySelector('.label-bg');

    if (!targetDot) return;

    targetDot.setAttribute('cx', cityData.x);
    targetDot.setAttribute('cy', cityData.y);
    targetRing.setAttribute('cx', cityData.x);
    targetRing.setAttribute('cy', cityData.y);
    targetGroup.style.display = 'block';

    var startX = cityData.x + 25;
    var startY = cityData.y - 20;
    arrow.setAttribute('x1', startX); arrow.setAttribute('y1', startY);
    arrow.setAttribute('x2', cityData.x + 3); arrow.setAttribute('y2', cityData.y - 3);
    arrow.style.display = 'block';

    var textString = '► НАЙДЕН: ' + baseCity.toUpperCase();
    labelText.textContent = textString;

    var estimatedWidth = textString.length * 5.8 + 12;
    labelBg.setAttribute('width', estimatedWidth);
    labelBg.setAttribute('x', startX - 5); labelBg.setAttribute('y', startY - 13);
    labelText.setAttribute('x', startX); labelText.setAttribute('y', startY - 2);
    labelGroup.style.display = 'block';
}

function showMap(cityName) {
    if (currentMode !== 'ru') return;

    currentCity = cityName;
    document.getElementById('mapSection').classList.add('show');
    
    renderSvgInto('svgContainer');
    renderSvgInto('modalSvgContainer');

    updateSvgTarget('svgContainer', cityName);
    updateSvgTarget('modalSvgContainer', cityName);

    var baseCity = cityName.split(' (')[0];
    var cityData = cityCoords[baseCity] || cityCoords['Москва'];
    var coordText = 'LAT: ' + cityData.lat.toFixed(4) + ' | LNG: ' + cityData.lng.toFixed(4);
    
    document.getElementById('mapCoords').textContent = coordText;
    document.getElementById('modalCoords').textContent = coordText;

    var terminal = document.getElementById('mapTerminal');
    var steps = [
        '&gt; Сканирование каналов РФ...',
        '&gt; Проверка баз MNP и Репутации...',
        '&gt; Объект локализован: ' + cityName.toUpperCase(),
        '&gt; СТАТУС: НАЙДЕН [ОК]'
    ];
    var step = 0;
    terminal.innerHTML = steps[0] + '<span class="cursor"></span>';
    var interval = setInterval(function() {
        step++;
        if (step < steps.length) {
            terminal.innerHTML = steps[step] + '<span class="cursor"></span>';
        } else {
            clearInterval(interval);
        }
    }, 300);
}

function updateModalTransform() {
    var modalContainer = document.getElementById('modalSvgContainer');
    if (modalContainer) {
        modalContainer.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoomScale + ')';
    }
}

function openMapModal() {
    document.getElementById('mapModalOverlay').classList.add('active');
    resetZoom();
}

function closeMapModal(e) {
    if (!e || e.target.id === 'mapModalOverlay' || e.target.classList.contains('map-modal-close')) {
        document.getElementById('mapModalOverlay').classList.remove('active');
    }
}

function zoomMap(factor) {
    zoomScale *= factor;
    if (zoomScale < 0.8) zoomScale = 0.8;
    if (zoomScale > 6) zoomScale = 6;
    updateModalTransform();
}

function resetZoom() {
    zoomScale = 1;
    panX = 0; panY = 0;
    updateModalTransform();
}

// Обработчики событий панорамирования и зума
document.addEventListener('DOMContentLoaded', function() {
    var viewport = document.getElementById('modalMapArea');
    if (!viewport) return;

    viewport.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX - panX; startY = e.clientY - panY;
    });
    window.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        panX = e.clientX - startX; panY = e.clientY - startY;
        updateModalTransform();
    });
    window.addEventListener('mouseup', function() { isDragging = false; });
    viewport.addEventListener('wheel', function(e) {
        e.preventDefault();
        if (e.deltaY < 0) { zoomMap(1.15); } else { zoomMap(0.85); }
    });
});
