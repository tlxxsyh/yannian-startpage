document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let tab = tabs[0];
        if (tab) {
            document.getElementById('bm-name').value = tab.title || '';
            document.getElementById('bm-url').value = tab.url || '';
        }
    });

    document.getElementById('btn-cancel').addEventListener('click', () => {
        window.close();
    });

    document.getElementById('btn-save').addEventListener('click', () => {
        const name = document.getElementById('bm-name').value.trim();
        const url = document.getElementById('bm-url').value.trim();
        const cat = document.getElementById('bm-cat').value.trim();
        const icon = document.getElementById('bm-icon').value.trim();

        if (!name || !url) {
            alert('名称和网址不能为空！');
            return;
        }

        chrome.storage.local.get(['yannian_bookmarks'], function (result) {
            let bookmarks = [];
            if (result.yannian_bookmarks) {
                try { bookmarks = JSON.parse(result.yannian_bookmarks); } catch (e) { }
            }

            let finalUrl = url.startsWith('http') ? url : 'https://' + url;

            const newBm = { name: name, url: finalUrl, cat: cat };
            if (icon) newBm.icon = icon;

            bookmarks.push(newBm);

            chrome.storage.local.set({ 'yannian_bookmarks': JSON.stringify(bookmarks) }, () => {
                const btn = document.getElementById('btn-save');
                // 优雅克制的交互反馈
                btn.textContent = '保存成功';
                btn.style.background = 'rgba(255, 255, 255, 0.15)';
                btn.style.color = '#fff';
                setTimeout(() => window.close(), 800);
            });
        });
    });
});