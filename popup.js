document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let tab = tabs[0];
        if (tab) {
            document.getElementById('bm-name').value = tab.title || '';
            document.getElementById('bm-url').value = tab.url || '';
        }
    });

    chrome.storage.local.get(['yannian_bookmarks'], function (result) {
        let bookmarks = result.yannian_bookmarks ? JSON.parse(result.yannian_bookmarks) : [];
        let catsSet = new Set();

        bookmarks.forEach(bm => {
            if (bm.cat && bm.cat.trim() !== '') {
                catsSet.add(bm.cat.trim());
            }
        });

        const datalist = document.getElementById('cat-suggestions');
        catsSet.forEach(cat => {
            let option = document.createElement('option');
            option.value = cat;
            datalist.appendChild(option);
        });
    });

    document.getElementById('btn-cancel').addEventListener('click', () => window.close());

    document.getElementById('btn-save').addEventListener('click', () => {
        const name = document.getElementById('bm-name').value.trim();
        const url = document.getElementById('bm-url').value.trim();
        const cat = document.getElementById('bm-cat').value.trim();

        /* 核心修复：支持中英文半角全角逗号切割 */
        const tags = document.getElementById('bm-tags').value.split(/[,，]/).map(t => t.trim()).filter(t => t);

        if (!name || !url) return alert('名称和网址不能为空！');

        chrome.storage.local.get(['yannian_bookmarks'], function (result) {
            let bookmarks = result.yannian_bookmarks ? JSON.parse(result.yannian_bookmarks) : [];
            let finalUrl = url.startsWith('http') ? url : 'https://' + url;

            bookmarks.push({ name, url: finalUrl, cat, tags });

            chrome.storage.local.set({ 'yannian_bookmarks': JSON.stringify(bookmarks) }, () => {
                const btn = document.getElementById('btn-save');
                btn.textContent = '保存成功';
                btn.style.background = '#e6f4ea';
                btn.style.color = '#52c41a';
                setTimeout(() => window.close(), 800);
            });
        });
    });
});