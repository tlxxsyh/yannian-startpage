// ================= 全局状态 =================
let isCliMode = localStorage.getItem('yannian_mode') === 'cli';
let customBg = localStorage.getItem('yannian_bg');
if (customBg === null) {
    customBg = 'https://gitee.com/shangyuhang/Course/raw/main/%E5%A3%81%E7%BA%B89.jpg';
}
let bookmarks = JSON.parse(localStorage.getItem('yannian_bookmarks')) || [];
let notes = JSON.parse(localStorage.getItem('yannian_notes')) || [];
let countdowns = JSON.parse(localStorage.getItem('yannian_cds')) || [];
let searchHistory = JSON.parse(localStorage.getItem('yannian_history')) || [];

let yannianQuotes = JSON.parse(localStorage.getItem('yannian_quotes')) || [
    "总之岁月漫长，然而值得等待。——村上春树",
    "当你做什么事都拖得太久，做的太晚，你就不能期待还有人待在原处等你。",
    "翻过这座山，便会有人愿意倾听你的故事。",
    "长夜难免黑凉，前行必有曙光。",
    "最明亮时总是最迷茫，最繁华时也是最悲凉。——《京华烟云》",
    "谁信故人千里，此时却到眉尖。",
    "时来天地皆同力，运去英雄不自由。"
];

let currentFolderPath = '';
let editingBmIndex = -1;
let inlineEditingNoteIndex = -1;

// CLI 模式专属变量
let cliCurrentBmPath = '';
let cliCurrentViewItems = []; // 存储当前 CLI 视图下的文件树节点映射

// 扩充默认搜索引擎列表
const defaultEngines = [
    { name: 'Bing', url: 'https://cn.bing.com/search?q=', icon: 'https://www.bing.com/favicon.ico' },
    { name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: 'https://www.baidu.com/favicon.ico' },
    { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'https://www.google.com/favicon.ico' },
    { name: 'Bilibili', url: 'https://search.bilibili.com/all?keyword=', icon: 'https://www.bilibili.com/favicon.ico' },
    { name: 'GitHub', url: 'https://github.com/search?type=repositories&q=', icon: 'https://github.com/favicon.ico' },
    { name: '知乎', url: 'https://www.zhihu.com/search?type=content&q=', icon: 'https://static.zhihu.com/heifetz/favicon.ico' },
    { name: '小红书', url: 'https://www.xiaohongshu.com/search_result?source=web_explore_feed&keyword=', icon: 'https://www.xiaohongshu.com/favicon.ico' },
    { name: '小黑盒', url: 'https://www.xiaoheihe.cn/app/search?q=', icon: 'https://www.xiaoheihe.cn/favicon.ico' }
];

let customEngines = JSON.parse(localStorage.getItem('yannian_engines')) || [...defaultEngines];
let currentEngineIdx = parseInt(localStorage.getItem('yannian_engine')) || 0;
if (currentEngineIdx >= customEngines.length) currentEngineIdx = 0;

const iconDelStr = `<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const iconEditStr = `<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const iconFolder = `<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
const iconHome = `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;

function init() {
    loadThemeColor();
    if (customBg) document.getElementById('app-bg').style.backgroundImage = `url('${customBg}')`;
    updateEngineView();
    renderBookmarksView();
    renderNotes();
    renderCountdowns();
    renderEngines();
    initQuotesPanel();
    loadDesktopSettings();
    toggleModeView();
}

// ================= 主题色动态管理 =================
function setThemeColor(hex) {
    document.documentElement.style.setProperty('--theme-color', hex);
    let r = parseInt(hex.slice(1, 3), 16) || 229;
    let g = parseInt(hex.slice(3, 5), 16) || 152;
    let b = parseInt(hex.slice(5, 7), 16) || 80;
    document.documentElement.style.setProperty('--theme-rgb', `${r}, ${g}, ${b}`);
    localStorage.setItem('yannian_theme', hex);
}
function loadThemeColor() {
    const savedTheme = localStorage.getItem('yannian_theme') || '#E59850';
    setThemeColor(savedTheme);
    document.getElementById('theme-color-input').value = savedTheme;
}
document.getElementById('theme-color-input').addEventListener('input', (e) => setThemeColor(e.target.value));
document.getElementById('btn-reset-theme').addEventListener('click', () => {
    setThemeColor('#E59850');
    document.getElementById('theme-color-input').value = '#E59850';
});

// ================= 全局基础交互 =================
function toggleModeView() {
    document.getElementById('gui-mode').classList.toggle('active', !isCliMode);
    document.getElementById('cli-mode').classList.toggle('active', isCliMode);
    isCliMode ? document.getElementById('cli-input').focus() : document.getElementById('gui-search-input').blur();
    localStorage.setItem('yannian_mode', isCliMode ? 'cli' : 'gui');
}
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === '/') { isCliMode = !isCliMode; toggleModeView(); }
});

const centralHub = document.getElementById('central-hub');
window.addEventListener('contextmenu', (e) => {
    if (isCliMode || e.target.closest('.desktop-zone') || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    centralHub.classList.remove('hidden');
});
centralHub.addEventListener('click', (e) => {
    if (e.target === centralHub) centralHub.classList.add('hidden');
});
document.getElementById('close-hub').addEventListener('click', () => centralHub.classList.add('hidden'));

document.querySelectorAll('.hub-sidebar .nav-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.hub-sidebar .nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-target')).classList.add('active');
    });
});


// ================= GUI: 搜索与下拉选择引擎 =================
setInterval(() => {
    document.getElementById('gui-clock').textContent = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}, 1000);

const searchInput = document.getElementById('gui-search-input');
const engineToggle = document.getElementById('engine-toggle');
const engineIcon = document.getElementById('engine-icon');
const historyDropdown = document.getElementById('search-history-dropdown');
const historyList = document.getElementById('history-list');
const engineDropdown = document.getElementById('engine-list-dropdown');

function updateEngineView() {
    const engine = customEngines[currentEngineIdx];
    engineIcon.src = engine.icon;
    engineIcon.alt = engine.name;
    localStorage.setItem('yannian_engine', currentEngineIdx);
}

function renderEngineDropdown() {
    engineDropdown.innerHTML = '';
    customEngines.forEach((engine, idx) => {
        const div = document.createElement('div');
        div.className = 'engine-dropdown-item';
        div.innerHTML = `<img src="${engine.icon}" onerror="this.src='https://www.google.com/favicon.ico'"><span>${engine.name}</span>`;
        div.onmousedown = (e) => {
            e.preventDefault();
            currentEngineIdx = idx;
            updateEngineView();
            engineDropdown.classList.add('hidden');
            searchInput.focus();
        };
        engineDropdown.appendChild(div);
    });
}

engineToggle.addEventListener('mousedown', (e) => { e.preventDefault(); });
engineToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    renderEngineDropdown();
    engineDropdown.classList.toggle('hidden');
    historyDropdown.classList.add('hidden');
});

document.addEventListener('click', (e) => {
    if (!engineToggle.contains(e.target) && !engineDropdown.contains(e.target)) {
        engineDropdown.classList.add('hidden');
    }
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            searchHistory = searchHistory.filter(item => item !== query);
            searchHistory.unshift(query);
            if (searchHistory.length > 15) searchHistory.pop();
            localStorage.setItem('yannian_history', JSON.stringify(searchHistory));
            window.location.href = customEngines[currentEngineIdx].url + encodeURIComponent(query);
        }
    }
});

function renderSearchHistory() {
    historyList.innerHTML = '';
    if (searchHistory.length === 0) {
        return;
    }

    searchHistory.forEach((query, idx) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-text" title="${query}">${query}</div>
            <button class="del-history-btn" title="删除">${iconDelStr}</button>
        `;
        div.querySelector('.history-text').addEventListener('mousedown', (e) => {
            e.preventDefault();
            searchInput.value = query;
            window.location.href = customEngines[currentEngineIdx].url + encodeURIComponent(query);
        });
        div.querySelector('.del-history-btn').addEventListener('mousedown', (e) => {
            e.preventDefault();
            searchHistory.splice(idx, 1);
            localStorage.setItem('yannian_history', JSON.stringify(searchHistory));
            renderSearchHistory();
        });
        historyList.appendChild(div);
    });
}

const appBg = document.getElementById('app-bg');
const hitokotoContainer = document.getElementById('hitokoto-container');
const hitokotoText = document.getElementById('hitokoto-text');

searchInput.addEventListener('focus', () => {
    appBg.classList.add('focus-blur');
    searchInput.placeholder = "";
    engineDropdown.classList.add('hidden');

    const randomQuote = yannianQuotes.length > 0 ? yannianQuotes[Math.floor(Math.random() * yannianQuotes.length)] : "一言为空";
    hitokotoText.textContent = randomQuote;
    hitokotoContainer.classList.add('visible');

    renderSearchHistory();
    if (searchHistory.length > 0) {
        historyDropdown.classList.remove('hidden');
    }
});

searchInput.addEventListener('blur', () => {
    appBg.classList.remove('focus-blur');
    searchInput.placeholder = "搜索";
    hitokotoContainer.classList.remove('visible');
    setTimeout(() => { historyDropdown.classList.add('hidden'); }, 150);
});

// ================= GUI: 专属一言面板管理 =================
function initQuotesPanel() {
    const textarea = document.getElementById('quotes-textarea');
    textarea.value = yannianQuotes.join('\n');

    document.getElementById('btn-save-quotes').addEventListener('click', () => {
        const rawText = textarea.value;
        yannianQuotes = rawText.split('\n').map(q => q.trim()).filter(q => q);
        localStorage.setItem('yannian_quotes', JSON.stringify(yannianQuotes));
        alert('专属一言保存成功！');
    });
}


// ================= GUI: 自定义搜索引擎管理 =================
const engineListContainer = document.getElementById('engine-list');
function renderEngines() {
    engineListContainer.innerHTML = '';
    customEngines.forEach((engine, idx) => {
        const itemHtml = `
            <div class="item-card">
                <div class="item-info">
                    <img src="${engine.icon}" onerror="this.src='https://www.google.com/favicon.ico'">
                    <span style="font-weight: bold;">${engine.name}</span>
                    <span style="font-size: 0.8rem; color:rgba(255,255,255,0.5);">${engine.url}</span>
                </div>
                <div class="item-actions">
                    ${customEngines.length > 1 ? `<button class="action-btn del del-engine-btn" data-idx="${idx}" title="删除">${iconDelStr}</button>` : ''}
                </div>
            </div>
        `;
        engineListContainer.insertAdjacentHTML('beforeend', itemHtml);
    });

    engineListContainer.querySelectorAll('.del-engine-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
            customEngines.splice(idx, 1);
            if (currentEngineIdx >= customEngines.length) currentEngineIdx = 0;
            localStorage.setItem('yannian_engines', JSON.stringify(customEngines));
            updateEngineView();
            renderEngines();
        });
    });
}

document.getElementById('btn-add-engine').addEventListener('click', () => {
    const name = document.getElementById('engine-name').value.trim();
    const url = document.getElementById('engine-url').value.trim();
    let icon = document.getElementById('engine-icon-url').value.trim();

    if (name && url) {
        if (!icon) {
            try {
                const domain = new URL(url).hostname;
                icon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
            } catch (e) {
                icon = 'https://www.google.com/favicon.ico';
            }
        }
        customEngines.push({ name, url, icon });
        localStorage.setItem('yannian_engines', JSON.stringify(customEngines));
        renderEngines();
        document.getElementById('engine-name').value = '';
        document.getElementById('engine-url').value = '';
        document.getElementById('engine-icon-url').value = '';
    } else {
        alert("名称和查询前缀不能为空！");
    }
});


// ================= GUI: 书签管理 (树状结构 + 面包屑导航) =================
const foldersView = document.getElementById('bm-folders-view');
const itemsView = document.getElementById('bm-items-view');
const breadcrumbsContainer = document.getElementById('bm-breadcrumbs');
const viewDivider = document.getElementById('bm-view-divider');

const bmModal = document.getElementById('bm-modal');
const inputName = document.getElementById('bm-name');
const inputUrl = document.getElementById('bm-url');
const inputCat = document.getElementById('bm-cat');

function renderBreadcrumbs() {
    breadcrumbsContainer.innerHTML = '';

    const rootNode = document.createElement('div');
    rootNode.className = `crumb-item ${currentFolderPath === '' ? 'active' : ''}`;
    rootNode.innerHTML = `${iconHome} 根目录`;
    rootNode.onclick = () => { currentFolderPath = ''; renderBookmarksView(); };
    breadcrumbsContainer.appendChild(rootNode);

    if (currentFolderPath !== '') {
        const parts = currentFolderPath.split('/');
        let buildPath = '';
        parts.forEach((part, index) => {
            if (!part) return;
            const sep = document.createElement('span');
            sep.className = 'crumb-sep';
            sep.textContent = '/';
            breadcrumbsContainer.appendChild(sep);

            buildPath += (buildPath === '' ? '' : '/') + part;
            const currentBuildPath = buildPath;

            const node = document.createElement('div');
            node.className = `crumb-item ${index === parts.length - 1 ? 'active' : ''}`;
            node.textContent = part;
            node.onclick = () => { currentFolderPath = currentBuildPath; renderBookmarksView(); };
            breadcrumbsContainer.appendChild(node);
        });
    }
}

function renderBookmarksView() {
    renderBreadcrumbs();
    foldersView.innerHTML = '';
    itemsView.innerHTML = '';

    const prefix = currentFolderPath === '' ? '' : currentFolderPath + '/';
    let subFolders = new Set();
    let currentItems = [];

    bookmarks.forEach((bm, idx) => {
        const cat = bm.cat || '';
        if (cat === currentFolderPath) {
            currentItems.push({ ...bm, _idx: idx });
        } else if (cat.startsWith(prefix)) {
            const remainingPath = prefix === '' ? cat : cat.substring(prefix.length);
            const nextSlashIdx = remainingPath.indexOf('/');
            if (nextSlashIdx === -1) {
                subFolders.add(remainingPath);
            } else {
                subFolders.add(remainingPath.substring(0, nextSlashIdx));
            }
        }
    });

    if (subFolders.size > 0) {
        foldersView.classList.remove('hidden');
        subFolders.forEach(folderName => {
            const targetPath = currentFolderPath === '' ? folderName : currentFolderPath + '/' + folderName;
            const div = document.createElement('div');
            div.className = 'folder-item';
            div.innerHTML = `
                <div class="folder-icon">${iconFolder}</div>
                <div class="folder-name">${folderName}</div>
            `;
            div.addEventListener('click', () => {
                currentFolderPath = targetPath;
                renderBookmarksView();
            });
            foldersView.appendChild(div);
        });
    } else {
        foldersView.classList.add('hidden');
    }

    if (currentItems.length > 0) {
        itemsView.classList.remove('hidden');
        let htmlContent = '';
        currentItems.forEach((bm) => {
            const iconSrc = `https://www.google.com/s2/favicons?domain=${bm.url}&sz=32`;
            htmlContent += `
                <div class="item-card">
                    <div class="item-info">
                        <img src="${iconSrc}" onerror="this.src='https://www.google.com/favicon.ico'">
                        <a href="${bm.url}" target="_self" title="${bm.url}">${bm.name}</a>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn edit-btn" data-idx="${bm._idx}" title="编辑">${iconEditStr}</button>
                        <button class="action-btn del del-btn" data-idx="${bm._idx}" title="删除">${iconDelStr}</button>
                    </div>
                </div>
            `;
        });
        itemsView.innerHTML = htmlContent;

        itemsView.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => openBmModal(parseInt(e.currentTarget.getAttribute('data-idx'))));
        });
        itemsView.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', (e) => delBookmark(parseInt(e.currentTarget.getAttribute('data-idx'))));
        });
    } else {
        itemsView.classList.add('hidden');
    }

    if (subFolders.size > 0 && currentItems.length > 0) {
        viewDivider.classList.remove('hidden');
    } else {
        viewDivider.classList.add('hidden');
    }

    if (subFolders.size === 0 && currentItems.length === 0) {
        foldersView.classList.remove('hidden');
        foldersView.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.3); padding: 30px;">此目录下空空如也</div>`;
    }
}

document.getElementById('btn-add-bm-modal').addEventListener('click', () => openBmModal(-1));
document.getElementById('btn-close-bm-modal').addEventListener('click', () => bmModal.classList.add('hidden'));

function openBmModal(idx) {
    editingBmIndex = idx;
    if (idx >= 0) {
        const bm = bookmarks[idx];
        document.getElementById('bm-modal-title').textContent = '编辑书签';
        inputName.value = bm.name;
        inputUrl.value = bm.url;
        inputCat.value = bm.cat || '';
    } else {
        document.getElementById('bm-modal-title').textContent = '新增书签';
        inputName.value = '';
        inputUrl.value = '';
        inputCat.value = currentFolderPath;
    }
    bmModal.classList.remove('hidden');
}

document.getElementById('btn-save-bm').addEventListener('click', () => {
    const name = inputName.value.trim();
    let url = inputUrl.value.trim();
    const cat = inputCat.value.trim();

    if (name && url) {
        if (!url.startsWith('http')) url = 'https://' + url;
        if (editingBmIndex >= 0) {
            bookmarks[editingBmIndex] = { name, url, cat };
        } else {
            bookmarks.push({ name, url, cat });
        }
        localStorage.setItem('yannian_bookmarks', JSON.stringify(bookmarks));
        bmModal.classList.add('hidden');
        renderBookmarksView();
    }
});

function delBookmark(idx) {
    bookmarks.splice(idx, 1);
    localStorage.setItem('yannian_bookmarks', JSON.stringify(bookmarks));
    renderBookmarksView();
}

document.getElementById('btn-export-bm').addEventListener('click', () => {
    const data = JSON.stringify(bookmarks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yannian_bookmarks.json';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('btn-import-bm').addEventListener('click', () => {
    document.getElementById('bm-import-input').click();
});
document.getElementById('bm-import-input').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                bookmarks = imported;
                localStorage.setItem('yannian_bookmarks', JSON.stringify(bookmarks));
                currentFolderPath = '';
                renderBookmarksView();
                alert('书签导入成功！');
            } else { alert('JSON 格式不正确。'); }
        } catch (err) { alert('解析失败，请检查 JSON 格式。'); }
    };
    reader.readAsText(file);
    this.value = '';
});


// ================= GUI: 备忘录逻辑 (自动伸缩就地编辑) =================
function renderNotes() {
    const hubList = document.getElementById('note-list');
    const dtList = document.getElementById('desktop-left-zone');

    let hubHtml = '';
    let dtHtml = '';

    notes.forEach((note, idx) => {
        const safeNote = String(note);

        if (idx === inlineEditingNoteIndex) {
            hubHtml += `
                <div class="item-card" style="flex-direction: column; align-items: stretch; gap: 12px; border-color: var(--theme-color);">
                    <textarea class="inline-edit-textarea" id="inline-note-${idx}">${safeNote}</textarea>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="sm-btn outline cancel-inline-btn">取消</button>
                        <button class="sm-btn primary save-inline-btn" data-idx="${idx}">保存</button>
                    </div>
                </div>
            `;
        } else {
            hubHtml += `
                <div class="item-card">
                    <div style="flex:1; word-break: break-all; padding-right:15px; line-height:1.6; color: rgba(255,255,255,0.9); white-space: pre-wrap;">${safeNote}</div>
                    <div class="item-actions">
                        <button class="action-btn edit-note-btn" data-idx="${idx}" title="编辑">${iconEditStr}</button>
                        <button class="action-btn del del-note-btn" data-idx="${idx}" title="删除">${iconDelStr}</button>
                    </div>
                </div>
            `;
        }
        dtHtml += `
            <div class="dt-card">
                <div class="dt-note-item">${safeNote.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    });

    hubList.innerHTML = hubHtml;
    dtList.innerHTML = dtHtml;

    hubList.querySelectorAll('.edit-note-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            inlineEditingNoteIndex = parseInt(e.currentTarget.getAttribute('data-idx'));
            renderNotes();

            const textarea = document.getElementById(`inline-note-${inlineEditingNoteIndex}`);
            if (textarea) {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
                textarea.addEventListener('input', function () {
                    this.style.height = 'auto';
                    this.style.height = this.scrollHeight + 'px';
                });
            }
        });
    });

    hubList.querySelectorAll('.del-note-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
            notes.splice(idx, 1);
            localStorage.setItem('yannian_notes', JSON.stringify(notes));
            renderNotes();
        });
    });

    hubList.querySelectorAll('.cancel-inline-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            inlineEditingNoteIndex = -1;
            renderNotes();
        });
    });

    hubList.querySelectorAll('.save-inline-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
            const newText = document.getElementById(`inline-note-${idx}`).value.trim();
            if (newText) {
                notes[idx] = newText;
            } else {
                notes.splice(idx, 1);
            }
            localStorage.setItem('yannian_notes', JSON.stringify(notes));
            inlineEditingNoteIndex = -1;
            renderNotes();
        });
    });
}

document.getElementById('btn-add-note').addEventListener('click', () => {
    const text = document.getElementById('hub-note-input').value.trim();
    if (text) {
        notes.unshift(text);
        localStorage.setItem('yannian_notes', JSON.stringify(notes));
        renderNotes();
        document.getElementById('hub-note-input').value = '';
    }
});


// ================= GUI: 倒数日阵列 =================
function renderCountdowns() {
    const hubList = document.getElementById('hub-cd-list');
    const dtList = document.getElementById('desktop-right-zone');

    let hubHtml = '';
    let dtHtml = '';

    countdowns.forEach((cd, idx) => {
        const targetDate = new Date(cd.date).getTime();
        const diff = Math.ceil((targetDate - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const finalDays = diff > 0 ? diff : 0;

        hubHtml += `
            <div class="item-card">
                <div class="item-info" style="flex:1;">
                    <span style="font-weight: bold; width: 100px;">${cd.title}</span>
                    <span class="highlight-num" style="font-size:1.5rem; margin-right:10px;">${finalDays}</span>天
                    <span style="color:rgba(255,255,255,0.4); font-size:0.8rem; margin-left:10px;">(${cd.date})</span>
                </div>
                <div class="item-actions">
                    <button class="action-btn del del-cd-btn" data-idx="${idx}" title="删除">${iconDelStr}</button>
                </div>
            </div>
        `;

        dtHtml += `
            <div class="dt-card">
                <div class="dt-title"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> <span>${cd.title}</span></div>
                <div class="dt-content"><span>${finalDays}</span> <span>天</span></div>
            </div>
        `;
    });

    hubList.innerHTML = hubHtml;
    dtList.innerHTML = dtHtml;

    hubList.querySelectorAll('.del-cd-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
            countdowns.splice(idx, 1);
            localStorage.setItem('yannian_cds', JSON.stringify(countdowns));
            renderCountdowns();
        });
    });
}

document.getElementById('btn-add-cd').addEventListener('click', () => {
    const title = prompt("请输入倒数日名称:");
    if (!title) return;
    const dateStr = prompt("请输入目标日期 (格式 YYYY-MM-DD):");
    if (dateStr && !isNaN(new Date(dateStr).getTime())) {
        countdowns.push({ title, date: dateStr });
        localStorage.setItem('yannian_cds', JSON.stringify(countdowns));
        renderCountdowns();
    } else { alert("日期格式有误"); }
});


// ================= GUI: 挂件开关 =================
const toggleDtCd = document.getElementById('toggle-dt-cd');
const toggleDtNote = document.getElementById('toggle-dt-note');
const desktopCdZone = document.getElementById('desktop-right-zone');
const desktopNoteZone = document.getElementById('desktop-left-zone');

function loadDesktopSettings() {
    const showCd = localStorage.getItem('yannian_show_cd') === 'true';
    const showNote = localStorage.getItem('yannian_show_note') === 'true';
    toggleDtCd.checked = showCd;
    toggleDtNote.checked = showNote;
    showCd ? desktopCdZone.classList.remove('hidden') : desktopCdZone.classList.add('hidden');
    showNote ? desktopNoteZone.classList.remove('hidden') : desktopNoteZone.classList.add('hidden');
}
toggleDtCd.addEventListener('change', () => {
    localStorage.setItem('yannian_show_cd', toggleDtCd.checked);
    loadDesktopSettings();
});
toggleDtNote.addEventListener('change', () => {
    localStorage.setItem('yannian_show_note', toggleDtNote.checked);
    loadDesktopSettings();
});


// ================= GUI: 壁纸设置 =================
const bgUrlInput = document.getElementById('bg-url-input');
const bgFileInput = document.getElementById('bg-file-input');

function applyBackground(url) {
    appBg.style.backgroundImage = url ? `url('${url}')` : '';
    localStorage.setItem('yannian_bg', url);
}

document.getElementById('btn-save-bg').addEventListener('click', () => applyBackground(bgUrlInput.value.trim()));
document.getElementById('btn-clear-bg').addEventListener('click', () => { applyBackground(''); bgUrlInput.value = ''; });

document.getElementById('btn-upload-local').addEventListener('click', () => bgFileInput.click());
bgFileInput.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        if (file.size > 4 * 1024 * 1024) return alert('图片过大，请选择 4MB 以内的图片。');
        const reader = new FileReader();
        reader.onload = e => applyBackground(e.target.result);
        reader.readAsDataURL(file);
    }
});


// ================= CLI: 极客终端引擎 =================
const cliInput = document.getElementById('cli-input');
const cliOutput = document.getElementById('cli-output');
const terminalContainer = document.querySelector('.terminal-container');

// 自动补全指令
const availableCommands = [
    'help', 'gui', 'clear', 'time', 'search ',
    'bm ls', 'bm add ', 'bm rm ', 'bm edit ', '..',
    'note ls', 'note add ', 'note edit ', 'note rm ',
    'cd ls', 'cd add ', 'cd rm ',
    'quote ls', 'engine ls', 'engine set '
];

cliInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const match = availableCommands.find(cmd => cmd.startsWith(cliInput.value));
        if (match) cliInput.value = match;
        return;
    }

    if (e.key === 'Enter') {
        const cmd = cliInput.value.trim();
        if (!cmd) return;

        appendCliOutput(`<span class="cli-prompt">yannian@home:~$</span> ${cmd}`);

        if (/^\d+$/.test(cmd)) {
            handleCliBmAction(parseInt(cmd));
        } else if (cmd === '..') {
            handleCliBmUp();
        } else {
            parseCommand(cmd);
        }

        cliInput.value = '';
        terminalContainer.scrollTop = terminalContainer.scrollHeight;
    }
});

function appendCliOutput(htmlText) {
    const div = document.createElement('div');
    div.innerHTML = htmlText;
    cliOutput.appendChild(div);
}

// 核心命令解析器
function parseCommand(cmd) {
    const args = cmd.split(' ').filter(Boolean);
    const c = args[0].toLowerCase();
    const subC = args[1] ? args[1].toLowerCase() : '';

    // --- 基础控制 ---
    if (c === 'help') {
        appendCliOutput(`
            <br><span class="cli-info">Yannian Terminal Commands:</span><br>
            <span class="cli-success">[基础]</span><br>
            gui       - 切换至可视化界面<br>
            clear     - 清空终端面板<br>
            time      - 显示当前时间<br>
            search    - 使用当前引擎搜索 (用法: search [词])<br><br>
            <span class="cli-success">[搜索引擎]</span><br>
            engine ls          - 查看引擎列表<br>
            engine set [编号]  - 切换默认引擎<br><br>
            <span class="cli-success">[文件树书签]</span><br>
            bm ls                    - 列出当前目录的内容<br>
            bm add [名称] [网址]       - 在当前目录新增书签<br>
            bm rm [编号]             - 删除当前目录下的某项<br>
            bm edit [编号] [名] [网]   - 编辑当前目录下的某项<br>
            ..                       - 返回上一级目录<br>
            [数字编号]                 - 打开书签 或 进入子目录<br><br>
            <span class="cli-success">[备忘速记]</span><br>
            note ls                  - 查看备忘录<br>
            note add [内容]          - 新增备忘录<br>
            note edit [编号] [内容]  - 编辑备忘录<br>
            note rm [编号]           - 删除备忘录<br><br>
            <span class="cli-success">[倒数日]</span><br>
            cd ls                               - 查看倒数日<br>
            cd add [名称] [YYYY-MM-DD]          - 新增倒数日<br>
            cd rm [编号]                        - 删除倒数日<br><br>
            <span class="cli-success">[专属一言]</span><br>
            quote ls                 - 查看专属一言库<br>
        `);
    }
    else if (c === 'gui') {
        isCliMode = false; toggleModeView();
    }
    else if (c === 'clear') {
        cliOutput.innerHTML = '';
    }
    else if (c === 'time') {
        const t = new Date().toLocaleString('zh-CN');
        appendCliOutput(`<span class="cli-info">当前时间:</span> ${t}`);
    }
    else if (c === 'search') {
        const query = args.slice(1).join(' ');
        if (query) {
            appendCliOutput(`<span class="cli-info">正在搜索:</span> ${query}`);
            window.location.href = customEngines[currentEngineIdx].url + encodeURIComponent(query);
        } else {
            appendCliOutput(`<span class="cli-warning">错误:</span> 缺少搜索词。用法: search [内容]`);
        }
    }

    // --- 搜索引擎管理 ---
    else if (c === 'engine' && subC === 'ls') {
        let out = "<br>";
        customEngines.forEach((eng, i) => {
            const isCurrent = (i === currentEngineIdx) ? '<span class="cli-success">[*]</span>' : '[ ]';
            out += `${isCurrent} [${i}] ${eng.name} <span class="cli-dim">- ${eng.url}</span><br>`;
        });
        appendCliOutput(out);
    }
    else if (c === 'engine' && subC === 'set') {
        const idx = parseInt(args[2]);
        if (!isNaN(idx) && customEngines[idx]) {
            currentEngineIdx = idx;
            updateEngineView();
            appendCliOutput(`<span class="cli-success">成功:</span> 搜索引擎已切换至 [${customEngines[idx].name}]。`);
        } else {
            appendCliOutput(`<span class="cli-warning">错误:</span> 无效的引擎编号。`);
        }
    }

    // --- 备忘录管理 ---
    else if (c === 'note' && subC === 'ls') {
        if (notes.length === 0) {
            appendCliOutput("暂无备忘录。");
        } else {
            let out = "<br>";
            notes.forEach((n, i) => out += `[<span class="cli-success">${i}</span>] ${n}<br>`);
            appendCliOutput(out);
        }
    }
    else if (c === 'note' && subC === 'add') {
        const text = args.slice(2).join(' ');
        if (text) {
            notes.unshift(text);
            localStorage.setItem('yannian_notes', JSON.stringify(notes));
            renderNotes();
            appendCliOutput(`<span class="cli-success">成功:</span> 备忘录已添加。`);
        } else {
            appendCliOutput(`<span class="cli-warning">错误:</span> 缺少便签内容。用法: note add [内容]`);
        }
    }
    else if (c === 'note' && subC === 'edit') {
        const idx = parseInt(args[2]);
        const newText = args.slice(3).join(' ');
        if (!isNaN(idx) && notes[idx] && newText) {
            notes[idx] = newText;
            localStorage.setItem('yannian_notes', JSON.stringify(notes));
            renderNotes();
            appendCliOutput(`<span class="cli-success">成功:</span> 备忘录 [${idx}] 已修改。`);
        } else {
            appendCliOutput(`<span class="cli-warning">错误:</span> 用法: note edit [编号] [新内容]`);
        }
    }
    else if (c === 'note' && subC === 'rm') {
        const idx = parseInt(args[2]);
        if (!isNaN(idx) && notes[idx]) {
            notes.splice(idx, 1);
            localStorage.setItem('yannian_notes', JSON.stringify(notes));
            renderNotes();
            appendCliOutput(`<span class="cli-success">成功:</span> 备忘录 [${idx}] 已删除。`);
        } else {
            appendCliOutput(`<span class="cli-warning">错误:</span> 找不到对应的备忘录。`);
        }
    }

    // --- 倒数日管理 ---
    else if (c === 'cd' && subC === 'ls') {
        if (countdowns.length === 0) {
            appendCliOutput("暂无倒数日。");
        } else {
            let out = "<br>";
            countdowns.forEach((cd, i) => {
                const diff = Math.ceil((new Date(cd.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const finalDays = diff > 0 ? diff : 0;
                out += `[<span class="cli-success">${i}</span>] ${cd.title} : 还有 <span class="cli-warning">${finalDays}</span> 天 <span class="cli-dim">(${cd.date})</span><br>`;
            });
            appendCliOutput(out);
        }
    }
    else if (c === 'cd' && subC === 'add') {
        const title = args[2];
        const dateStr = args[3];
        if (title && dateStr && !isNaN(new Date(dateStr).getTime())) {
            countdowns.push({ title, date: dateStr });
            localStorage.setItem('yannian_cds', JSON.stringify(countdowns));
            renderCountdowns();
            appendCliOutput(`<span class="cli-success">成功:</span> 倒数日已添加。`);
        } else {
            appendCliOutput(`<span class="cli-warning">错误:</span> 用法: cd add [名称] [YYYY-MM-DD]`);
        }
    }
    else if (c === 'cd' && subC === 'rm') {
        const idx = parseInt(args[2]);
        if (!isNaN(idx) && countdowns[idx]) {
            countdowns.splice(idx, 1);
            localStorage.setItem('yannian_cds', JSON.stringify(countdowns));
            renderCountdowns();
            appendCliOutput(`<span class="cli-success">成功:</span> 倒数日 [${idx}] 已删除。`);
        } else {
            appendCliOutput(`<span class="cli-warning">错误:</span> 找不到对应的倒数日。`);
        }
    }

    // --- 一言库管理 ---
    else if (c === 'quote' && subC === 'ls') {
        if (yannianQuotes.length === 0) {
            appendCliOutput("专属一言库为空。");
        } else {
            let out = "<br>";
            yannianQuotes.forEach((q, i) => out += `[<span class="cli-success">${i}</span>] ${q}<br>`);
            appendCliOutput(out);
        }
    }

    // --- 书签管理 (文件树架构) ---
    else if (c === 'bm' && subC === 'ls') {
        renderCliBookmarks();
    }
    else if (c === 'bm' && subC === 'add') {
        const name = args[2];
        const url = args[3];
        if (name && url) {
            let finalUrl = url.startsWith('http') ? url : 'https://' + url;
            bookmarks.push({ name, url: finalUrl, cat: cliCurrentBmPath });
            localStorage.setItem('yannian_bookmarks', JSON.stringify(bookmarks));
            renderBookmarksView();
            appendCliOutput(`<span class="cli-success">成功:</span> 书签 '${name}' 已添加到当前目录。`);
            renderCliBookmarks();
        } else {
            appendCliOutput(`<span class="cli-warning">错误:</span> 用法: bm add [名称] [网址]`);
        }
    }
    else if (c === 'bm' && subC === 'rm') {
        const viewIdx = parseInt(args[2]);
        const item = cliCurrentViewItems[viewIdx];
        if (!isNaN(viewIdx) && item && item.type === 'bookmark') {
            bookmarks.splice(item.originalIndex, 1);
            localStorage.setItem('yannian_bookmarks', JSON.stringify(bookmarks));
            renderBookmarksView();
            appendCliOutput(`<span class="cli-success">成功:</span> 书签已删除。`);
            renderCliBookmarks();
        } else {
            appendCliOutput(`<span class="cli-warning">错误:</span> 只能删除当前目录下的书签项编号。`);
        }
    }
    else if (c === 'bm' && subC === 'edit') {
        const viewIdx = parseInt(args[2]);
        const name = args[3];
        const url = args[4];
        const item = cliCurrentViewItems[viewIdx];
        if (!isNaN(viewIdx) && item && item.type === 'bookmark' && name && url) {
            let finalUrl = url.startsWith('http') ? url : 'https://' + url;
            bookmarks[item.originalIndex] = { name, url: finalUrl, cat: bookmarks[item.originalIndex].cat };
            localStorage.setItem('yannian_bookmarks', JSON.stringify(bookmarks));
            renderBookmarksView();
            appendCliOutput(`<span class="cli-success">成功:</span> 书签已更新。`);
            renderCliBookmarks();
        } else {
            appendCliOutput(`<span class="cli-warning">错误:</span> 用法: bm edit [编号] [新名称] [新网址]`);
        }
    }

    // --- 未知命令 ---
    else {
        appendCliOutput(`<span class="cli-warning">未找到命令:</span> ${c}. Type 'help' to see available commands.`);
    }
}

// 终端书签视图渲染器
function renderCliBookmarks() {
    const prefix = cliCurrentBmPath === '' ? '' : cliCurrentBmPath + '/';
    let subFolders = new Set();
    let currentItems = [];

    bookmarks.forEach((bm, idx) => {
        const cat = bm.cat || '';
        if (cat === cliCurrentBmPath) {
            currentItems.push({ type: 'bookmark', name: bm.name, url: bm.url, originalIndex: idx });
        } else if (cat.startsWith(prefix)) {
            const remainingPath = prefix === '' ? cat : cat.substring(prefix.length);
            const nextSlashIdx = remainingPath.indexOf('/');
            if (nextSlashIdx === -1) {
                subFolders.add(remainingPath);
            } else {
                subFolders.add(remainingPath.substring(0, nextSlashIdx));
            }
        }
    });

    cliCurrentViewItems = [];
    let out = `<br><span class="cli-info">当前路径: /${cliCurrentBmPath}</span><br>`;
    let viewIdx = 0;

    if (cliCurrentBmPath !== '') {
        out += `[<span class="cli-success">..</span>] 返回上一级<br>`;
    }

    subFolders.forEach(folderName => {
        cliCurrentViewItems.push({ type: 'folder', name: folderName, path: prefix + folderName });
        out += `[<span class="cli-success">${viewIdx++}</span>] <span class="cli-dir">[目录] ${folderName}</span><br>`;
    });

    currentItems.forEach(bm => {
        cliCurrentViewItems.push(bm);
        out += `[<span class="cli-success">${viewIdx++}</span>] <span class="cli-bm">[书签] ${bm.name}</span> <span class="cli-dim">- ${bm.url}</span><br>`;
    });

    if (cliCurrentViewItems.length === 0) {
        out += "此目录下空空如也。<br>";
    }

    appendCliOutput(out);
}

// 终端文件树动作执行器
function handleCliBmAction(idx) {
    const item = cliCurrentViewItems[idx];
    if (!item) {
        appendCliOutput(`<span class="cli-warning">错误:</span> 找不到编号为 [${idx}] 的项。请先运行 'bm ls'。`);
        return;
    }
    if (item.type === 'folder') {
        cliCurrentBmPath = item.path;
        renderCliBookmarks();
    } else {
        appendCliOutput(`<span class="cli-info">正在跳转至:</span> ${item.name}...`);
        window.location.href = item.url;
    }
}

// 终端路径返回
function handleCliBmUp() {
    if (cliCurrentBmPath === '') {
        appendCliOutput(`<span class="cli-warning">已经是根目录了。</span>`);
        return;
    }
    const parts = cliCurrentBmPath.split('/');
    parts.pop();
    cliCurrentBmPath = parts.join('/');
    renderCliBookmarks();
}

init();