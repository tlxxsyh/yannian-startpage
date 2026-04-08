// ================= 全局变量声明 =================
let isCliMode, isFirstRun, customBg, bookmarks, notes, countdowns, searchHistory, showSeconds, yannianQuotes;
let currentFolderPath = '';
let bmSearchQuery = '';
let editingBmIndex = -1;
let editingCdIndex = -1;
let inlineEditingNoteIndex = -1;
let deskEditingNoteIndex = -1;
let cliCurrentBmPath = '';
let cliCurrentViewItems = [];
let customEngines, currentEngineIdx;

const defaultEngines = [
    { name: 'Bing', url: 'https://cn.bing.com/search?q=', icon: 'https://www.bing.com/favicon.ico' },
    { name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: 'https://www.baidu.com/favicon.ico' },
    { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'https://www.google.com/favicon.ico' },
    { name: 'Bilibili', url: 'https://search.bilibili.com/all?keyword=', icon: 'https://www.bilibili.com/favicon.ico' },
    { name: 'GitHub', url: 'https://github.com/search?type=repositories&q=', icon: 'https://github.com/favicon.ico' }
];

const iconDelStr = `<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const iconEditStr = `<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const iconCopyStr = `<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
const iconCheckStr = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const iconCloseStr = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

/* 核心重绘：Win95原汁原味像素点阵黄文件夹 (使用纯正色块拼装) */
const iconFolder = `<svg width="18" height="18" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <g shape-rendering="crispEdges">
    <rect x="1" y="2" width="6" height="1" fill="#000"/>
    <rect x="0" y="3" width="1" height="11" fill="#000"/>
    <rect x="7" y="3" width="1" height="1" fill="#000"/>
    <rect x="8" y="4" width="7" height="1" fill="#000"/>
    <rect x="15" y="5" width="1" height="9" fill="#000"/>
    <rect x="1" y="14" width="14" height="1" fill="#000"/>
    <rect x="1" y="3" width="6" height="1" fill="#d1a84f"/>
    <rect x="1" y="4" width="7" height="1" fill="#d1a84f"/>
    <rect x="1" y="5" width="14" height="9" fill="#fedc7a"/>
    <rect x="1" y="5" width="13" height="1" fill="#fffcf0"/>
    <rect x="1" y="6" width="1" height="8" fill="#fffcf0"/>
  </g>
</svg>`;

const iconHome = `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;

function getFaviconUrl(url, size = 64) {
    try {
        let validUrl = url.startsWith('http') ? url : 'https://' + url;
        const domain = new URL(validUrl).hostname;
        if (domain.includes('xiaohongshu.com')) return 'https://www.xiaohongshu.com/favicon.ico';
        if (domain.includes('bilibili.com')) return 'https://www.bilibili.com/favicon.ico';
        if (domain.includes('zhihu.com')) return 'https://static.zhihu.com/heifetz/favicon.ico';
        if (domain.includes('github.com')) return 'https://github.com/favicon.ico';
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
    } catch (e) { return 'https://www.google.com/favicon.ico'; }
}

function safeParse(str, defaultVal) {
    if (!str) return defaultVal;
    try { return JSON.parse(str); } catch (e) { return defaultVal; }
}

function saveData(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        let obj = {}; obj[key] = value;
        chrome.storage.local.set(obj);
    }
}

async function bootApp() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await new Promise(resolve => {
            chrome.storage.local.get(null, (data) => {
                data = data || {};
                if (Object.keys(data).length === 0) {
                    for (let i = 0; i < localStorage.length; i++) {
                        let key = localStorage.key(i);
                        if (key && key.startsWith('yannian_')) {
                            let obj = {}; obj[key] = localStorage.getItem(key);
                            chrome.storage.local.set(obj);
                        }
                    }
                } else {
                    for (let k in data) { try { localStorage.setItem(k, data[k]); } catch (e) { } }
                }
                resolve();
            });
        });
    }

    isCliMode = localStorage.getItem('yannian_mode') === 'cli';
    isFirstRun = localStorage.getItem('yannian_init') !== '1';
    customBg = localStorage.getItem('yannian_bg');
    bookmarks = safeParse(localStorage.getItem('yannian_bookmarks'), null);

    if (isFirstRun || (!customBg && !bookmarks)) {
        customBg = 'https://gitee.com/shangyuhang/Course/raw/main/%E5%A3%81%E7%BA%B89.jpg';
        saveData('yannian_bg', customBg);
        if (!bookmarks || bookmarks.length === 0) {
            bookmarks = [
                { name: 'DeepSeek', url: 'https://chat.deepseek.com', cat: '', tags: ['AI'] },
                { name: 'Bilibili', url: 'https://www.bilibili.com', cat: '', tags: ['视频'] }
            ];
            saveData('yannian_bookmarks', JSON.stringify(bookmarks));
        }
        saveData('yannian_init', '1');
    } else { bookmarks = bookmarks || []; }

    bookmarks.forEach(bm => { if (!bm.tags) bm.tags = []; });

    notes = safeParse(localStorage.getItem('yannian_notes'), []);
    countdowns = safeParse(localStorage.getItem('yannian_cds'), []);
    searchHistory = safeParse(localStorage.getItem('yannian_history'), []);
    showSeconds = localStorage.getItem('yannian_show_seconds') !== 'false';

    yannianQuotes = safeParse(localStorage.getItem('yannian_quotes'), [
        "总之岁月漫长，然而值得等待。— 村上春树 《如果我们的语言是威士忌》",
        "时来天地皆同力，运去英雄不自由。",
        "最明亮时总是最迷茫，最繁华时也是最悲凉。— 林语堂 《京华烟云》",
        "于群峰之上，更觉长风浩荡。",
        "谁信故人千里，此时却到眉尖。",
        "当你做什么事都拖得太久，做得太晚，你就不能期待还有人待在原处等你。",
        "但行善举，莫问前程。",
        "各出所学，各尽所知，使国家富强不受外侮，足以自立于地球之上。",
        "每一个不曾起舞的日子，都是对生命的辜负。"
    ]);

    customEngines = safeParse(localStorage.getItem('yannian_engines'), [...defaultEngines]);
    currentEngineIdx = parseInt(localStorage.getItem('yannian_engine')) || 0;
    if (currentEngineIdx >= customEngines.length) currentEngineIdx = 0;

    init();
}

function init() {
    updateClock();
    document.getElementById('gui-clock').style.visibility = 'visible';
    setInterval(updateClock, 1000);
    loadThemeColor();
    if (customBg) document.getElementById('app-bg').style.backgroundImage = `url('${customBg}')`;
    document.getElementById('toggle-show-seconds').checked = showSeconds;

    updateEngineView();
    renderBookmarksView();
    renderNotes();
    renderCountdowns();
    renderEngines();
    renderDock();
    initQuotesPanel();
    loadDesktopSettings();
    toggleModeView();
}

bootApp();

function updateClock() {
    const now = new Date();
    const options = { hour: '2-digit', minute: '2-digit' };
    if (showSeconds) options.second = '2-digit';
    document.getElementById('gui-clock').textContent = now.toLocaleTimeString('zh-CN', options);
}

document.getElementById('toggle-show-seconds').addEventListener('change', (e) => {
    showSeconds = e.target.checked; saveData('yannian_show_seconds', showSeconds); updateClock();
});

function setThemeColor(hex) {
    document.documentElement.style.setProperty('--theme-color', hex);
    saveData('yannian_theme', hex);
}
function loadThemeColor() {
    const savedTheme = localStorage.getItem('yannian_theme') || '#E59850';
    setThemeColor(savedTheme);
    document.getElementById('theme-color-input').value = savedTheme;
}
document.getElementById('theme-color-input').addEventListener('input', (e) => setThemeColor(e.target.value));
document.getElementById('btn-reset-theme').addEventListener('click', () => { setThemeColor('#E59850'); document.getElementById('theme-color-input').value = '#E59850'; });

function toggleModeView() {
    document.getElementById('gui-mode').classList.toggle('active', !isCliMode);
    document.getElementById('cli-mode').classList.toggle('active', isCliMode);
    isCliMode ? document.getElementById('cli-input').focus() : document.getElementById('gui-search-input').blur();
    saveData('yannian_mode', isCliMode ? 'cli' : 'gui');
}
document.addEventListener('keydown', (e) => { if (e.ctrlKey && e.key === '/') { isCliMode = !isCliMode; toggleModeView(); } });

// ================= 原地无缝书签态切换及防误触引擎 =================
let isBookmarkViewActive = false;
const centerContent = document.getElementById('main-center-view');
const searchWrapper = document.getElementById('search-wrapper');
const bookmarkWrapper = document.getElementById('bookmark-wrapper');
const btnCloseBmView = document.getElementById('btn-close-bm-view');

const bmModal = document.getElementById('bm-modal');
const cdModal = document.getElementById('cd-modal');

bookmarkWrapper.addEventListener('click', (e) => e.stopPropagation());
bmModal.addEventListener('click', (e) => e.stopPropagation());
cdModal.addEventListener('click', (e) => e.stopPropagation());

function toggleBookmarkView() {
    isBookmarkViewActive = !isBookmarkViewActive;
    if (isBookmarkViewActive) {
        searchWrapper.classList.add('hidden');
        bookmarkWrapper.classList.remove('hidden');
        centerContent.classList.add('bm-active');
        document.getElementById('bm-search-input').focus();
    } else {
        bookmarkWrapper.classList.add('hidden');
        searchWrapper.classList.remove('hidden');
        centerContent.classList.remove('bm-active');
    }
}

window.addEventListener('contextmenu', (e) => {
    if (isCliMode ||
        e.target.closest('.desktop-zone') ||
        e.target.closest('#dock-container') ||
        e.target.closest('.modal') ||
        e.target.closest('#settings-gear') ||
        e.target.closest('#bookmark-wrapper') ||
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA') return;

    e.preventDefault();
    if (!isBookmarkViewActive) {
        toggleBookmarkView();
    }
});

window.addEventListener('click', (e) => {
    if (isBookmarkViewActive &&
        !e.target.closest('.modal') &&
        e.target.id !== 'settings-gear') {
        toggleBookmarkView();
    }
});

btnCloseBmView.addEventListener('click', toggleBookmarkView);

const centralHub = document.getElementById('central-hub');
document.getElementById('settings-gear').addEventListener('click', (e) => {
    e.stopPropagation();
    centralHub.classList.remove('hidden');
});
centralHub.addEventListener('click', (e) => { if (e.target === centralHub) centralHub.classList.add('hidden'); });
document.getElementById('close-hub').addEventListener('click', () => centralHub.classList.add('hidden'));

document.querySelectorAll('.hub-sidebar .nav-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.hub-sidebar .nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-target')).classList.add('active');
    });
});

function renderDock() {
    const dockInner = document.getElementById('dock-inner');
    dockInner.innerHTML = '';
    const rootBookmarks = bookmarks.filter(bm => !bm.cat || bm.cat === '');
    if (rootBookmarks.length === 0) { document.getElementById('dock-container').style.display = 'none'; return; }

    document.getElementById('dock-container').style.display = 'block';
    rootBookmarks.forEach(bm => {
        const iconSrc = bm.icon ? bm.icon : getFaviconUrl(bm.url, 64);
        const div = document.createElement('div');
        div.className = 'dock-item'; div.title = bm.name;
        div.innerHTML = `<img src="${iconSrc}" onerror="this.src='https://www.google.com/favicon.ico'">`;
        div.onclick = () => window.location.href = bm.url;
        dockInner.appendChild(div);
    });
}

const searchInput = document.getElementById('gui-search-input');
const engineToggle = document.getElementById('engine-toggle');
const engineIcon = document.getElementById('engine-icon');
const historyDropdown = document.getElementById('search-history-dropdown');
const historyList = document.getElementById('history-list');
const engineDropdown = document.getElementById('engine-list-dropdown');

function updateEngineView() {
    const engine = customEngines[currentEngineIdx];
    engineIcon.src = engine.icon; engineIcon.alt = engine.name;
    saveData('yannian_engine', currentEngineIdx);
}

function renderEngineDropdown() {
    engineDropdown.innerHTML = '';
    customEngines.forEach((engine, idx) => {
        const div = document.createElement('div');
        div.className = 'engine-dropdown-item';
        div.innerHTML = `<img src="${engine.icon}" onerror="this.src='https://www.google.com/favicon.ico'"><span>${engine.name}</span>`;
        div.onmousedown = (e) => { e.preventDefault(); currentEngineIdx = idx; updateEngineView(); engineDropdown.classList.add('hidden'); searchInput.focus(); };
        engineDropdown.appendChild(div);
    });
}
engineToggle.addEventListener('mousedown', (e) => { e.preventDefault(); });
engineToggle.addEventListener('click', (e) => { e.stopPropagation(); renderEngineDropdown(); engineDropdown.classList.toggle('hidden'); historyDropdown.classList.add('hidden'); });
document.addEventListener('click', (e) => { if (!engineToggle.contains(e.target) && !engineDropdown.contains(e.target)) engineDropdown.classList.add('hidden'); });

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            searchHistory = searchHistory.filter(item => item !== query);
            searchHistory.unshift(query);
            if (searchHistory.length > 15) searchHistory.pop();
            saveData('yannian_history', JSON.stringify(searchHistory));
            window.location.href = customEngines[currentEngineIdx].url + encodeURIComponent(query);
        }
    }
});

function renderSearchHistory() {
    historyList.innerHTML = '';
    if (searchHistory.length === 0) return;
    searchHistory.forEach((query, idx) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<div class="history-text" title="${query}">${query}</div><button class="del-history-btn" title="删除">${iconDelStr}</button>`;
        div.querySelector('.history-text').addEventListener('mousedown', (e) => { e.preventDefault(); searchInput.value = query; window.location.href = customEngines[currentEngineIdx].url + encodeURIComponent(query); });
        div.querySelector('.del-history-btn').addEventListener('mousedown', (e) => { e.preventDefault(); searchHistory.splice(idx, 1); saveData('yannian_history', JSON.stringify(searchHistory)); renderSearchHistory(); });
        historyList.appendChild(div);
    });
}
document.getElementById('clear-history-bar').addEventListener('mousedown', (e) => { e.preventDefault(); searchHistory = []; saveData('yannian_history', JSON.stringify(searchHistory)); renderSearchHistory(); historyDropdown.classList.add('hidden'); });

const appBg = document.getElementById('app-bg');
const hitokotoContainer = document.getElementById('hitokoto-container');
const hitokotoText = document.getElementById('hitokoto-text');

searchInput.addEventListener('focus', () => {
    appBg.classList.add('focus-blur'); searchInput.placeholder = ""; engineDropdown.classList.add('hidden');
    hitokotoText.textContent = yannianQuotes.length > 0 ? yannianQuotes[Math.floor(Math.random() * yannianQuotes.length)] : "一言为空";
    hitokotoContainer.classList.add('visible');
    renderSearchHistory(); if (searchHistory.length > 0) historyDropdown.classList.remove('hidden');
});
searchInput.addEventListener('blur', () => {
    appBg.classList.remove('focus-blur'); searchInput.placeholder = "搜索"; hitokotoContainer.classList.remove('visible');
    setTimeout(() => { historyDropdown.classList.add('hidden'); }, 150);
});

function initQuotesPanel() {
    const qTa = document.getElementById('quotes-textarea');
    const qLn = document.getElementById('quotes-line-numbers');
    const qCount = document.getElementById('quotes-count');
    function updateQuotesLines() {
        const lines = qTa.value.split('\n');
        qLn.innerHTML = Array.from({ length: lines.length }, (_, i) => i + 1).join('<br>');
        qCount.textContent = `共 ${lines.map(q => q.trim()).filter(q => q).length} 句`;
    }
    qTa.value = yannianQuotes.join('\n'); updateQuotesLines();
    qTa.addEventListener('input', updateQuotesLines);
    qTa.addEventListener('scroll', () => { qLn.scrollTop = qTa.scrollTop; });
    const btnSave = document.getElementById('btn-save-quotes');
    const newBtnSave = btnSave.cloneNode(true); btnSave.parentNode.replaceChild(newBtnSave, btnSave);
    newBtnSave.addEventListener('click', () => {
        yannianQuotes = qTa.value.split('\n').map(q => q.trim()).filter(q => q);
        saveData('yannian_quotes', JSON.stringify(yannianQuotes));
        qTa.value = yannianQuotes.join('\n'); updateQuotesLines(); alert('专属一言保存成功！');
    });
}

function renderEngines() {
    const container = document.getElementById('engine-list'); container.innerHTML = '';
    customEngines.forEach((engine, idx) => {
        container.insertAdjacentHTML('beforeend', `
            <div class="item-card">
                <div class="item-info"><img src="${engine.icon}" onerror="this.src='https://www.google.com/favicon.ico'"> <span style="font-weight: bold;">${engine.name}</span> <span style="font-size: 0.8rem; color:#888;">${engine.url}</span></div>
                <div class="item-actions">${customEngines.length > 1 ? `<button class="action-btn del del-engine-btn" data-idx="${idx}" title="删除">${iconDelStr}</button>` : ''}</div>
            </div>
        `);
    });
    container.querySelectorAll('.del-engine-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            customEngines.splice(parseInt(e.currentTarget.getAttribute('data-idx')), 1);
            if (currentEngineIdx >= customEngines.length) currentEngineIdx = 0;
            saveData('yannian_engines', JSON.stringify(customEngines)); updateEngineView(); renderEngines();
        });
    });
}
document.getElementById('btn-add-engine').addEventListener('click', () => {
    const name = document.getElementById('engine-name').value.trim(); const url = document.getElementById('engine-url').value.trim(); let icon = document.getElementById('engine-icon-url').value.trim();
    if (name && url) {
        if (!icon) { try { icon = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; } catch (e) { icon = 'https://www.google.com/favicon.ico'; } }
        customEngines.push({ name, url, icon }); saveData('yannian_engines', JSON.stringify(customEngines)); renderEngines();
        document.getElementById('engine-name').value = ''; document.getElementById('engine-url').value = ''; document.getElementById('engine-icon-url').value = '';
    } else { alert("名称和查询前缀不能为空！"); }
});

// ================= Win95 风格书签管理器 =================
const foldersView = document.getElementById('bm-folders-view');
const itemsView = document.getElementById('bm-items-view');
const breadcrumbsContainer = document.getElementById('bm-breadcrumbs');
const bmSearchInput = document.getElementById('bm-search-input');

bmSearchInput.addEventListener('input', (e) => {
    bmSearchQuery = e.target.value.trim().toLowerCase();
    renderBookmarksView();
});

document.getElementById('btn-bm-home').addEventListener('click', () => {
    currentFolderPath = ''; bmSearchQuery = ''; bmSearchInput.value = '';
    renderBookmarksView();
});

document.getElementById('btn-bm-back').addEventListener('click', () => {
    if (bmSearchQuery) {
        bmSearchQuery = ''; bmSearchInput.value = ''; renderBookmarksView(); return;
    }
    if (currentFolderPath === '') return;
    const parts = currentFolderPath.split('/'); parts.pop(); currentFolderPath = parts.join('/');
    renderBookmarksView();
});

function renderBreadcrumbs() {
    breadcrumbsContainer.innerHTML = '';
    const rootNode = document.createElement('span');
    rootNode.className = `win95-crumb ${currentFolderPath === '' && bmSearchQuery === '' ? 'active' : ''}`;
    rootNode.innerHTML = `C:\\根目录`;
    rootNode.onclick = () => { currentFolderPath = ''; bmSearchQuery = ''; bmSearchInput.value = ''; renderBookmarksView(); };
    breadcrumbsContainer.appendChild(rootNode);

    if (bmSearchQuery) {
        const sep = document.createElement('span'); sep.className = 'win95-crumb-sep'; sep.textContent = '\\'; breadcrumbsContainer.appendChild(sep);
        const searchNode = document.createElement('span'); searchNode.className = 'win95-crumb active'; searchNode.innerHTML = `搜索结果`;
        breadcrumbsContainer.appendChild(searchNode);
        return;
    }

    if (currentFolderPath !== '') {
        const parts = currentFolderPath.split('/'); let buildPath = '';
        parts.forEach((part, index) => {
            if (!part) return;
            const sep = document.createElement('span'); sep.className = 'win95-crumb-sep'; sep.textContent = '\\'; breadcrumbsContainer.appendChild(sep);
            buildPath += (buildPath === '' ? '' : '/') + part; const currentBuildPath = buildPath;
            const node = document.createElement('span'); node.className = `win95-crumb ${index === parts.length - 1 ? 'active' : ''}`; node.textContent = part;
            node.onclick = () => { currentFolderPath = currentBuildPath; renderBookmarksView(); };
            breadcrumbsContainer.appendChild(node);
        });
    }
}

function renderBookmarksView() {
    renderBreadcrumbs();
    foldersView.innerHTML = ''; itemsView.innerHTML = '';

    let currentItems = [];
    let subFolders = new Set();

    if (bmSearchQuery) {
        foldersView.style.display = 'none';
        bookmarks.forEach((bm, idx) => {
            const nameMatch = bm.name.toLowerCase().includes(bmSearchQuery);
            const tagMatch = bm.tags && bm.tags.some(t => t.toLowerCase().includes(bmSearchQuery));
            if (nameMatch || tagMatch) currentItems.push({ ...bm, _idx: idx });
        });
    } else {
        const prefix = currentFolderPath === '' ? '' : currentFolderPath + '/';
        bookmarks.forEach((bm, idx) => {
            const cat = bm.cat || '';
            if (cat === currentFolderPath) { currentItems.push({ ...bm, _idx: idx }); }
            else if (cat.startsWith(prefix)) {
                const rem = prefix === '' ? cat : cat.substring(prefix.length);
                const nextSlashIdx = rem.indexOf('/');
                subFolders.add(nextSlashIdx === -1 ? rem : rem.substring(0, nextSlashIdx));
            }
        });

        if (subFolders.size > 0) {
            foldersView.style.display = 'flex';
            subFolders.forEach(folderName => {
                const targetPath = currentFolderPath === '' ? folderName : currentFolderPath + '/' + folderName;
                const count = bookmarks.filter(b => (b.cat || '') === targetPath || (b.cat || '').startsWith(targetPath + '/')).length;
                const div = document.createElement('div');
                div.className = 'win95-item';
                div.innerHTML = `
                    <div class="win95-item-info">
                        ${iconFolder}
                        <span class="bm-link-text" style="font-weight: bold; cursor: pointer;">${folderName}</span>
                    </div>
                    <div class="win95-item-actions">
                        <span style="font-size: 12px; color: inherit; padding-right: 5px;">${count} 项</span>
                    </div>`;
                div.addEventListener('click', () => { currentFolderPath = targetPath; renderBookmarksView(); });
                foldersView.appendChild(div);
            });
        } else {
            foldersView.style.display = 'none';
        }
    }

    if (currentItems.length > 0) {
        itemsView.style.display = 'flex';
        let htmlContent = '';
        currentItems.forEach((bm) => {
            const iconSrc = bm.icon ? bm.icon : getFaviconUrl(bm.url, 32);
            const tagsHtml = bm.tags && bm.tags.length > 0 ? bm.tags.map(t => `<span class="win95-tag">${t}</span>`).join('') : '';

            htmlContent += `
                <div class="win95-item" data-url="${bm.url}">
                    <div class="win95-item-info">
                        <img src="${iconSrc}" onerror="this.src='https://www.google.com/favicon.ico'">
                        <span class="bm-link-text">${bm.name}</span>
                        ${tagsHtml}
                    </div>
                    <div class="win95-item-actions">
                        <button class="win95-btn edit-btn" data-idx="${bm._idx}">属性</button>
                        <button class="win95-btn del-btn" data-idx="${bm._idx}">删除</button>
                    </div>
                </div>`;
        });
        itemsView.innerHTML = htmlContent;

        // 绑定全行跳转与精确Tag筛选
        itemsView.querySelectorAll('.win95-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.win95-item-actions')) return;
                if (e.target.classList.contains('win95-tag')) {
                    bmSearchQuery = e.target.textContent.trim();
                    bmSearchInput.value = bmSearchQuery;
                    renderBookmarksView();
                    return;
                }
                const url = item.getAttribute('data-url');
                if (url) window.location.href = url;
            });
        });
        itemsView.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => openBmModal(parseInt(e.currentTarget.getAttribute('data-idx')))));
        itemsView.querySelectorAll('.del-btn').forEach(btn => btn.addEventListener('click', (e) => delBookmark(parseInt(e.currentTarget.getAttribute('data-idx')))));
    } else {
        itemsView.style.display = 'flex';
        if (subFolders.size === 0) itemsView.innerHTML = `<div style="text-align: center; color: #808080; padding: 30px; font-size:13px;">无内容。</div>`;
        else itemsView.innerHTML = '';
    }
    renderDock();
}

document.getElementById('btn-add-bm-modal').addEventListener('click', () => openBmModal(-1));
document.getElementById('btn-close-bm-modal').addEventListener('click', () => bmModal.classList.add('hidden'));
document.getElementById('btn-close-bm-modal-x').addEventListener('click', () => bmModal.classList.add('hidden'));

function openBmModal(idx) {
    editingBmIndex = idx;
    if (idx >= 0) {
        const bm = bookmarks[idx]; document.getElementById('bm-modal-title').textContent = '属性';
        document.getElementById('bm-name').value = bm.name; document.getElementById('bm-url').value = bm.url;
        document.getElementById('bm-cat').value = bm.cat || ''; document.getElementById('bm-tags').value = bm.tags ? bm.tags.join(', ') : '';
        document.getElementById('bm-icon').value = bm.icon || '';
    } else {
        document.getElementById('bm-modal-title').textContent = '新建快捷方式';
        document.getElementById('bm-name').value = ''; document.getElementById('bm-url').value = '';
        document.getElementById('bm-cat').value = currentFolderPath; document.getElementById('bm-tags').value = '';
        document.getElementById('bm-icon').value = '';
    }
    bmModal.classList.remove('hidden');
}

document.getElementById('btn-save-bm').addEventListener('click', () => {
    const name = document.getElementById('bm-name').value.trim();
    let url = document.getElementById('bm-url').value.trim();
    if (name && url) {
        if (!url.startsWith('http')) url = 'https://' + url;
        const tags = document.getElementById('bm-tags').value.split(/[,，]/).map(t => t.trim()).filter(t => t);
        const bmData = { name, url, cat: document.getElementById('bm-cat').value.trim(), tags };
        const icon = document.getElementById('bm-icon').value.trim(); if (icon) bmData.icon = icon;

        if (editingBmIndex >= 0) bookmarks[editingBmIndex] = bmData; else bookmarks.push(bmData);
        saveData('yannian_bookmarks', JSON.stringify(bookmarks)); bmModal.classList.add('hidden'); renderBookmarksView();
    }
});

function delBookmark(idx) { bookmarks.splice(idx, 1); saveData('yannian_bookmarks', JSON.stringify(bookmarks)); renderBookmarksView(); }

document.getElementById('btn-export-bm').addEventListener('click', () => {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n`;
    const tree = { name: "Root", children: [], bookmarks: [] };
    bookmarks.forEach(bm => {
        let parts = (bm.cat || "").split('/').filter(p => p);
        let curr = tree;
        parts.forEach(part => {
            let next = curr.children.find(c => c.name === part);
            if (!next) { next = { name: part, children: [], bookmarks: [] }; curr.children.push(next); }
            curr = next;
        });
        curr.bookmarks.push(bm);
    });

    function renderTree(node, indent) {
        let str = "";
        node.children.forEach(c => {
            str += `${indent}<DT><H3>${c.name}</H3>\n${indent}<DL><p>\n` + renderTree(c, indent + "    ") + `${indent}</DL><p>\n`;
        });
        node.bookmarks.forEach(b => {
            let tagsAttr = b.tags && b.tags.length ? ` TAGS="${b.tags.join(',')}"` : '';
            let iconAttr = b.icon ? ` ICON="${b.icon}"` : '';
            str += `${indent}<DT><A HREF="${b.url}"${tagsAttr}${iconAttr}>${b.name}</A>\n`;
        });
        return str;
    }

    html += renderTree(tree, "    ") + `</DL><p>`;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bookmarks.html';
    a.click(); URL.revokeObjectURL(a.href);
});

document.getElementById('btn-import-bm').addEventListener('click', () => document.getElementById('bm-import-input').click());
document.getElementById('bm-import-input').addEventListener('change', function () {
    const file = this.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(e.target.result, 'text/html');
            let newBookmarks = [];

            function parseDl(dlNode, currentPath) {
                for (let child of dlNode.children) {
                    if (child.tagName === 'DT') {
                        const h3 = child.querySelector('H3');
                        const a = child.querySelector('A');
                        if (h3) {
                            const folderName = h3.textContent.trim();
                            const nextPath = currentPath ? currentPath + '/' + folderName : folderName;
                            let nextDl = child.querySelector('DL') || child.nextElementSibling;
                            if (nextDl && nextDl.tagName === 'DL') parseDl(nextDl, nextPath);
                        } else if (a) {
                            const url = a.getAttribute('href'); const name = a.textContent.trim();
                            const icon = a.getAttribute('icon') || '';
                            const tags = (a.getAttribute('tags') || '').split(/[,，]/).map(t => t.trim()).filter(t => t);
                            if (url && !url.startsWith('chrome://')) newBookmarks.push({ name, url, cat: currentPath, icon, tags });
                        }
                    }
                }
            }

            const rootDl = doc.querySelector('DL');
            if (rootDl) {
                parseDl(rootDl, ''); bookmarks = newBookmarks; saveData('yannian_bookmarks', JSON.stringify(bookmarks));
                currentFolderPath = ''; renderBookmarksView(); alert('书签导入成功！');
            } else { alert('未能识别标准的书签 HTML 格式。'); }
        } catch (err) { alert('解析失败。'); }
    };
    reader.readAsText(file); this.value = '';
});

function renderNotes() {
    const hubList = document.getElementById('note-list');
    const dtList = document.getElementById('desktop-left-zone');
    let hubHtml = ''; let dtHtml = '';

    notes.forEach((note, idx) => {
        const safeNote = String(note);
        if (idx === inlineEditingNoteIndex) {
            hubHtml += `
                <div class="item-card" style="padding: 0; border: none; background: transparent;">
                    <div class="inline-edit-wrapper">
                        <textarea class="inline-edit-textarea" id="inline-note-${idx}">${safeNote}</textarea>
                        <div class="inline-edit-actions">
                            <button class="icon-btn-sm cancel cancel-inline-btn" title="取消" style="color:#ff4d4f;">${iconCloseStr}</button>
                            <button class="icon-btn-sm save save-inline-btn" data-idx="${idx}" title="保存" style="color:var(--theme-color);">${iconCheckStr}</button>
                        </div>
                    </div>
                </div>`;
        } else {
            hubHtml += `<div class="item-card"><div style="flex:1; word-break: break-all; padding-right:15px; line-height:1.6; color: #333; white-space: pre-wrap;">${safeNote}</div><div class="item-actions"><button class="action-btn edit-note-btn" data-idx="${idx}" title="编辑">${iconEditStr}</button><button class="action-btn del del-note-btn" data-idx="${idx}" title="删除">${iconDelStr}</button></div></div>`;
        }

        if (idx === deskEditingNoteIndex) {
            dtHtml += `
                <div class="dt-card" style="padding: 10px;">
                    <div class="inline-edit-wrapper" style="flex-direction: column;">
                        <textarea class="desk-note-edit-area" id="desk-inline-note-${idx}">${safeNote}</textarea>
                        <div class="inline-edit-actions" style="position: absolute; bottom: 8px; right: 8px;">
                            <button class="icon-btn-sm cancel cancel-desk-inline" style="background: rgba(255,255,255,0.1); color: #fff;" title="取消">${iconCloseStr}</button>
                            <button class="icon-btn-sm save save-desk-inline" data-idx="${idx}" style="background: var(--theme-color); color: #fff;" title="保存">${iconCheckStr}</button>
                        </div>
                    </div>
                </div>`;
        } else {
            dtHtml += `
                <div class="dt-card">
                    <div class="dt-note-item">${safeNote.replace(/\n/g, '<br>')}</div>
                    <div class="desk-note-actions">
                        <button class="copy-desk-btn" data-idx="${idx}" title="复制">${iconCopyStr}</button>
                        <button class="edit-desk-btn" data-idx="${idx}" title="编辑">${iconEditStr}</button>
                        <button class="del desk-del-btn" data-idx="${idx}" title="删除">${iconDelStr}</button>
                    </div>
                </div>`;
        }
    });

    hubList.innerHTML = hubHtml; dtList.innerHTML = dtHtml;

    dtList.querySelectorAll('.copy-desk-btn').forEach(btn => btn.addEventListener('click', (e) => { navigator.clipboard.writeText(notes[parseInt(e.currentTarget.getAttribute('data-idx'))]); alert("已复制到剪贴板"); }));
    dtList.querySelectorAll('.desk-del-btn').forEach(btn => btn.addEventListener('click', (e) => { notes.splice(parseInt(e.currentTarget.getAttribute('data-idx')), 1); saveData('yannian_notes', JSON.stringify(notes)); renderNotes(); }));
    dtList.querySelectorAll('.edit-desk-btn').forEach(btn => btn.addEventListener('click', (e) => { deskEditingNoteIndex = parseInt(e.currentTarget.getAttribute('data-idx')); renderNotes(); const ta = document.getElementById(`desk-inline-note-${deskEditingNoteIndex}`); if (ta) { ta.focus(); ta.style.height = ta.scrollHeight + 'px'; ta.addEventListener('input', function () { this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'; }); } }));
    dtList.querySelectorAll('.cancel-desk-inline').forEach(btn => btn.addEventListener('click', () => { deskEditingNoteIndex = -1; renderNotes(); }));
    dtList.querySelectorAll('.save-desk-inline').forEach(btn => btn.addEventListener('click', (e) => { const idx = parseInt(e.currentTarget.getAttribute('data-idx')); const txt = document.getElementById(`desk-inline-note-${idx}`).value.trim(); if (txt) notes[idx] = txt; else notes.splice(idx, 1); saveData('yannian_notes', JSON.stringify(notes)); deskEditingNoteIndex = -1; renderNotes(); }));

    hubList.querySelectorAll('.edit-note-btn').forEach(btn => btn.addEventListener('click', (e) => { inlineEditingNoteIndex = parseInt(e.currentTarget.getAttribute('data-idx')); renderNotes(); const ta = document.getElementById(`inline-note-${inlineEditingNoteIndex}`); if (ta) { ta.focus(); ta.style.height = ta.scrollHeight + 'px'; ta.addEventListener('input', function () { this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'; }); } }));
    hubList.querySelectorAll('.del-note-btn').forEach(btn => btn.addEventListener('click', (e) => { notes.splice(parseInt(e.currentTarget.getAttribute('data-idx')), 1); saveData('yannian_notes', JSON.stringify(notes)); renderNotes(); }));
    hubList.querySelectorAll('.cancel-inline-btn').forEach(btn => btn.addEventListener('click', () => { inlineEditingNoteIndex = -1; renderNotes(); }));
    hubList.querySelectorAll('.save-inline-btn').forEach(btn => btn.addEventListener('click', (e) => { const idx = parseInt(e.currentTarget.getAttribute('data-idx')); const txt = document.getElementById(`inline-note-${idx}`).value.trim(); if (txt) notes[idx] = txt; else notes.splice(idx, 1); saveData('yannian_notes', JSON.stringify(notes)); inlineEditingNoteIndex = -1; renderNotes(); }));
}

document.getElementById('btn-add-note').addEventListener('click', () => {
    const text = document.getElementById('hub-note-input').value.trim();
    if (text) { notes.unshift(text); saveData('yannian_notes', JSON.stringify(notes)); renderNotes(); document.getElementById('hub-note-input').value = ''; }
});

function openCdModal(idx) {
    editingCdIndex = idx;
    if (idx >= 0) {
        const cd = countdowns[idx];
        document.getElementById('cd-modal-title').textContent = '编辑倒数日';
        document.getElementById('cd-title').value = cd.title;
        document.getElementById('cd-date').value = cd.date;
    } else {
        document.getElementById('cd-modal-title').textContent = '新增倒数日';
        document.getElementById('cd-title').value = '';
        document.getElementById('cd-date').value = '';
    }
    document.getElementById('cd-modal').classList.remove('hidden');
}

document.getElementById('btn-add-cd').addEventListener('click', () => openCdModal(-1));
document.getElementById('btn-close-cd-modal').addEventListener('click', () => document.getElementById('cd-modal').classList.add('hidden'));

document.getElementById('btn-save-cd').addEventListener('click', () => {
    const title = document.getElementById('cd-title').value.trim();
    const dateStr = document.getElementById('cd-date').value;
    if (title && dateStr && !isNaN(new Date(dateStr).getTime())) {
        if (editingCdIndex >= 0) { countdowns[editingCdIndex] = { title, date: dateStr }; }
        else { countdowns.push({ title, date: dateStr }); }
        saveData('yannian_cds', JSON.stringify(countdowns));
        document.getElementById('cd-modal').classList.add('hidden');
        renderCountdowns();
    } else { alert("信息不完整或日期格式有误"); }
});

function renderCountdowns() {
    const hubList = document.getElementById('hub-cd-list'); const dtList = document.getElementById('desktop-right-zone');
    let hubHtml = ''; let dtHtml = '';
    countdowns.forEach((cd, idx) => {
        const diff = Math.ceil((new Date(cd.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const finalDays = diff > 0 ? diff : 0;
        hubHtml += `<div class="item-card"><div class="item-info" style="flex:1;"><span style="font-weight: bold; color: #333; width: 100px;">${cd.title}</span><span class="highlight-num" style="font-size:1.5rem; margin-right:10px;">${finalDays}</span>天<span style="color:rgba(0,0,0,0.4); font-size:0.8rem; margin-left:10px;">(${cd.date})</span></div><div class="item-actions"><button class="action-btn edit-cd-btn" data-idx="${idx}" title="编辑">${iconEditStr}</button><button class="action-btn del del-cd-btn" data-idx="${idx}" title="删除">${iconDelStr}</button></div></div>`;
        dtHtml += `
            <div class="dt-card">
                <div class="dt-title"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> <span>${cd.title}</span></div>
                <div class="dt-content"><span>${finalDays}</span> <span>天</span></div>
                <div class="desk-cd-actions">
                    <button class="edit-desk-cd-btn" data-idx="${idx}" title="编辑">${iconEditStr}</button>
                    <button class="del desk-del-cd-btn" data-idx="${idx}" title="删除">${iconDelStr}</button>
                </div>
            </div>`;
    });
    hubList.innerHTML = hubHtml; dtList.innerHTML = dtHtml;

    hubList.querySelectorAll('.edit-cd-btn').forEach(btn => btn.addEventListener('click', (e) => openCdModal(parseInt(e.currentTarget.getAttribute('data-idx')))));
    hubList.querySelectorAll('.del-cd-btn').forEach(btn => btn.addEventListener('click', (e) => { countdowns.splice(parseInt(e.currentTarget.getAttribute('data-idx')), 1); saveData('yannian_cds', JSON.stringify(countdowns)); renderCountdowns(); }));
    dtList.querySelectorAll('.edit-desk-cd-btn').forEach(btn => btn.addEventListener('click', (e) => openCdModal(parseInt(e.currentTarget.getAttribute('data-idx')))));
    dtList.querySelectorAll('.desk-del-cd-btn').forEach(btn => btn.addEventListener('click', (e) => { countdowns.splice(parseInt(e.currentTarget.getAttribute('data-idx')), 1); saveData('yannian_cds', JSON.stringify(countdowns)); renderCountdowns(); }));
}

function loadDesktopSettings() {
    const showCd = localStorage.getItem('yannian_show_cd') === 'true'; const showNote = localStorage.getItem('yannian_show_note') === 'true';
    document.getElementById('toggle-dt-cd').checked = showCd; document.getElementById('toggle-dt-note').checked = showNote;
    showCd ? document.getElementById('desktop-right-zone').classList.remove('hidden') : document.getElementById('desktop-right-zone').classList.add('hidden');
    showNote ? document.getElementById('desktop-left-zone').classList.remove('hidden') : document.getElementById('desktop-left-zone').classList.add('hidden');
}
document.getElementById('toggle-dt-cd').addEventListener('change', (e) => { saveData('yannian_show_cd', e.target.checked); loadDesktopSettings(); });
document.getElementById('toggle-dt-note').addEventListener('change', (e) => { saveData('yannian_show_note', e.target.checked); loadDesktopSettings(); });

function applyBackground(url) { appBg.style.backgroundImage = url ? `url('${url}')` : ''; try { saveData('yannian_bg', url); } catch (e) { alert('图片过大。'); appBg.style.backgroundImage = ''; } }
document.getElementById('btn-save-bg').addEventListener('click', () => applyBackground(document.getElementById('bg-url-input').value.trim()));
document.getElementById('btn-clear-bg').addEventListener('click', () => { applyBackground(''); document.getElementById('bg-url-input').value = ''; });
document.getElementById('btn-upload-local').addEventListener('click', () => document.getElementById('bg-file-input').click());
document.getElementById('bg-file-input').addEventListener('change', function () {
    const file = this.files[0]; if (file) { if (file.size > 1.5 * 1024 * 1024) return alert('图片须小于 1.5MB'); const reader = new FileReader(); reader.onload = e => applyBackground(e.target.result); reader.readAsDataURL(file); } this.value = '';
});

const cliInput = document.getElementById('cli-input'); const cliOutput = document.getElementById('cli-output'); const terminalContainer = document.querySelector('.terminal-container');
cliInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = cliInput.value.trim(); if (!cmd) return;
        const div = document.createElement('div'); div.innerHTML = `<span class="cli-prompt">yannian@home:~$</span> ${cmd}`; cliOutput.appendChild(div);
        if (cmd === 'gui') { isCliMode = false; toggleModeView(); }
        else if (cmd === 'clear') { cliOutput.innerHTML = ''; }
        else { const d = document.createElement('div'); d.innerHTML = `<span class="cli-warning">未知命令。</span>`; cliOutput.appendChild(d); }
        cliInput.value = ''; terminalContainer.scrollTop = terminalContainer.scrollHeight;
    }
});

if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.yannian_bookmarks) {
            bookmarks = safeParse(changes.yannian_bookmarks.newValue, []);
            try { localStorage.setItem('yannian_bookmarks', changes.yannian_bookmarks.newValue); } catch (e) { }
            if (typeof renderBookmarksView === 'function') renderBookmarksView();
        }
    });
}