/**
 * 安监智能查询系统 · 完整六模块版
 * ===================================================
 * 应用入口文件 - 负责模块加载顺序和全局初始化协调
 * 
 * ===================================================
 * 项目结构:
 * ===================================================
 * src/
 *   css/
 *     main.css             - 全局样式 (变量、组件、响应式)
 *   js/
 *     app.js               - 入口文件 (本文件)
 *     modules/
 *       utils.js           - 公共工具函数 (TAB_LABELS, switchTab, pinyinMatch等)
 *       issue.js           - 检查信息模块 (IndexedDB + 关键词搜索)
 *       rule.js            - 规章制度模块 (IndexedDB + 全文检索)
 *       diary.js           - 工作日志模块 (写实记录)
 *       memo.js            - 备忘提醒模块
 *       phone.js           - 车站电话模块
 *       handbook.js        - 检查手册模块 (四级目录大纲)
 *       swipe.js           - 侧滑手势切换模块
 *       doubao.js          - 智能助手模块 (DeepSeek API 对话/对规/写作)
 *       backup.js          - 全局备份与恢复模块 (ZIP 打包)
 *       engine.js          - 前端增强引擎 (Toast/Ripple/懒加载/性能优化)
 *       pwa.js             - PWA 安装提示
 *       anti-kimi.js       - 屏蔽 Kimi 扩展悬浮按钮
 *
 * ===================================================
 * 外部依赖 (通过 <script> 标签在 HTML 中加载):
 * ===================================================
 *   - XLSX v0.18.5       : xlsx.full.min.js
 *   - pdf.js v2.16.105   : pdf.min.js (mammoth.js依赖)
 *   - Mammoth v1.4.2     : mammoth.browser.min.js (Word文档解析)
 *   - Fuse.js v6.6.2     : fuse.min.js (模糊搜索)
 *   - Pinyin v2.11.0     : pinyin.min.js (拼音匹配)
 *   - JSZip v3.10.1      : jszip.min.js (ZIP 打包)
 *   - xml-js v1.6.11     : xml-js.min.js (XML解析)
 *   - html-docx-js v0.3.1: html-docx.js (HTML转Word)
 *
 * ===================================================
 * 模块加载顺序:
 * ===================================================
 *   1. utils.js       - 公共工具 (最先加载，其他模块依赖)
 *   2. issue.js       - 检查信息
 *   3. rule.js        - 规章制度
 *   4. diary.js       - 工作日志
 *   5. memo.js        - 备忘提醒
 *   6. phone.js       - 车站电话
 *   7. handbook.js    - 检查手册
 *   8. swipe.js       - 侧滑手势
 *   9. doubao.js      - 智能助手 (Part A + Part B)
 *  10. backup.js      - 备份恢复 (最后加载，依赖所有其他模块)
 *  11. engine.js      - 前端增强引擎
 *  12. pwa.js         - PWA 安装
 *  13. anti-kimi.js   - 屏蔽 Kimi 扩展
 *
 * ===================================================
 * HTML 结构要求:
 * ===================================================
 *   - .nav-btn[id=tab-*] : 导航按钮
 *   - .panel[id=panel-*] : 对应的面板容器
 *   - .modal[id]         : 模态框
 *   - 各模块特定 DOM 元素 (参见各模块文件注释)
 */

'use strict';

// ============================================================
// 初始化协调逻辑
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('%c安监智能查询系统 · 初始化开始', 'color:#1a365d;font-weight:bold;');

    // 各模块的初始化由各自的 IIFE 自行处理
    // 跨模块协调逻辑如下：
});

// ============================================================
// 全局事件处理
// ============================================================

// --- DeepSeek 气泡样式 ---
(function() {
    const style = document.createElement('style');
    style.textContent = [
        '.ds-row-user { display:flex; justify-content:flex-end; }',
        '.ds-row-assistant { display:flex; justify-content:flex-start; }',
        '.ds-row-system { display:flex; justify-content:center; }',
        '.ds-bubble-user {',
        '    background:#dbeafe;',
        '    color:#1e3a5f;',
        '    padding:10px 14px;',
        '    border-radius:14px 14px 4px 14px;',
        '    max-width:75%;',
        '    font-size:0.92rem;',
        '    line-height:1.6;',
        '    white-space:pre-wrap;',
        '    word-break:break-word;',
        '}',
        '.ds-bubble-assistant {',
        '    background:#fff;',
        '    color:var(--text);',
        '    padding:10px 14px;',
        '    border-radius:14px 14px 14px 4px;',
        '    max-width:85%;',
        '    font-size:0.92rem;',
        '    line-height:1.7;',
        '    word-break:break-word;',
        '    white-space:pre-wrap;',
        '    box-shadow:0 1px 4px rgba(0,0,0,.08);',
        '    border:1px solid var(--border);',
        '}',
        '.ds-bubble-system {',
        '    background:#fff3cd;',
        '    color:#856404;',
        '    padding:8px 14px;',
        '    border-radius:8px;',
        '    font-size:0.85rem;',
        '    max-width:90%;',
        '    white-space:pre-wrap;',
        '    word-break:break-word;',
        '    border:1px solid #ffc107;',
        '}',
        '.ds-cursor { animation:dsBlink 1s step-end infinite; }',
        '@keyframes dsBlink { 0%,100%{opacity:1;} 50%{opacity:0;} }'
    ].join('');
    document.head.appendChild(style);
})();

// 全局回车搜索
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        var activePanel = document.querySelector('.panel.active');
        if (!activePanel) return;
        if (activePanel.id === 'panel-issue') issueDoSearch();
        else if (activePanel.id === 'panel-rule') renderResults();
        else if (activePanel.id === 'panel-phone') phoneDoSearch();
    }
});

// 点击模态框外部关闭
window.onclick = function(e) {
    if (e.target.classList.contains('modal')) e.target.classList.remove('active');
};

// ============================================================
// PWA 安装提示
// ============================================================
(function() {
    if (!('serviceWorker' in navigator)) return;
    var _deferredPrompt = null;
    var _installBtn = null;
    var _installBtnAdded = false;

    navigator.serviceWorker.register('sw.js').then(function() {
        console.log('[PWA] SW 注册成功');
    }).catch(function(err) {
        console.warn('[PWA] SW 注册失败:', err);
    });

    window.addEventListener('beforeinstallprompt', function(e) {
        if (localStorage.getItem('pwa_install_dismissed') === '1') return;
        e.preventDefault();
        _deferredPrompt = e;
        showInstallButton();
    });

    window.addEventListener('appinstalled', function() {
        console.log('[PWA] 应用已安装');
        _deferredPrompt = null;
        hideInstallButton();
    });

    function showInstallButton() {
        if (_installBtnAdded) return;
        _installBtnAdded = true;
        _installBtn = document.createElement('div');
        _installBtn.id = '_pwa_install_bar';
        _installBtn.innerHTML = [
            '<span style="font-size:1.2rem;">📲</span>',
            '<span style="flex:1;text-align:left;">安装「安监助手」到桌面</span>',
            '<button id="_pwa_install_btn" style="',
            '  background:#fff;color:#1a365d;border:none;border-radius:20px;',
            '  padding:6px 18px;font-size:0.85rem;font-weight:700;cursor:pointer;',
            '  white-space:nowrap;',
            '">安装</button>',
            '<button id="_pwa_install_close" style="',
            '  background:none;border:none;color:rgba(255,255,255,0.6);',
            '  font-size:1.1rem;cursor:pointer;padding:0 4px;margin-left:4px;',
            '">✕</button>'
        ].join('');
        Object.assign(_installBtn.style, {
            position:'fixed', bottom:'0', left:'0', right:'0',
            background:'rgba(26,54,93,0.97)', color:'#fff',
            display:'flex', alignItems:'center', gap:'8px',
            padding:'12px 16px', zIndex:'99999',
            fontSize:'0.92rem', fontWeight:'600',
            boxShadow:'0 -2px 12px rgba(0,0,0,.25)',
            transform:'translateY(100%)', transition:'transform .3s ease'
        });
        document.body.appendChild(_installBtn);
        requestAnimationFrame(function() { _installBtn.style.transform = 'translateY(0)'; });

        document.getElementById('_pwa_install_btn').onclick = function() {
            if (!_deferredPrompt) return;
            _deferredPrompt.prompt();
            _deferredPrompt.userChoice.then(function(choice) {
                console.log('[PWA] 用户选择:', choice.outcome);
                _deferredPrompt = null;
            });
        };
        document.getElementById('_pwa_install_close').onclick = function() {
            hideInstallButton();
            try { localStorage.setItem('pwa_install_dismissed', '1'); } catch(e) {}
        };
    }

    function hideInstallButton() {
        if (_installBtn) {
            _installBtn.style.transform = 'translateY(100%)';
            setTimeout(function() {
                if (_installBtn && _installBtn.parentNode) _installBtn.parentNode.removeChild(_installBtn);
                _installBtnAdded = false;
                _installBtn = null;
            }, 300);
        }
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA] 已作为应用运行');
    }
})();

// ============================================================
// 屏蔽 Kimi 扩展悬浮按钮（JS 层兜底）
// ============================================================
(function() {
    function removeKimiElements() {
        document.querySelectorAll('[id*="kimi" i],[class*="kimi" i],[class*="kimi-extension" i]').forEach(function(el) {
            if (el.id !== '_block_kimi_fab' && el.closest('header,main,nav,section')) return;
            el.remove();
        });
        document.querySelectorAll('kimi-chat-widget,kimi-fab').forEach(function(el) { el.remove(); });
        document.querySelectorAll('body > div').forEach(function(el) {
            var s = getComputedStyle(el);
            if (s.position === 'fixed' && s.zIndex && parseInt(s.zIndex) > 100000 && !el.id && !el.className) {
                el.remove();
            }
        });
    }
    setTimeout(removeKimiElements, 500);
    setTimeout(removeKimiElements, 2000);
    var mo = new MutationObserver(function() {
        removeKimiElements();
    });
    mo.observe(document.body, { childList: true, subtree: true });
})();

// ============================================================
// 早期退出提示 (边缘滑出) - 必须最早执行
// ============================================================
(function() {
    function initExitHint() {
        var s = document.createElement('style');
        s.id = '_early_exit_style';
        s.textContent = [
            '#_exit_bar{',
            '  position:fixed;bottom:0;left:0;right:0;',
            '  background:rgba(26,54,93,0.96);color:#fff;',
            '  text-align:center;padding:18px;font-size:1.05rem;font-weight:700;',
            '  z-index:99998;transform:translateY(100%);',
            '  transition:transform .3s ease;',
            '  box-shadow:0 -2px 12px rgba(0,0,0,.25);letter-spacing:.5px;',
            '  display:flex;align-items:center;justify-content:center;gap:10px;',
            '}',
            '#_exit_bar.show{transform:translateY(0);}',
            '#_exit_bar ._exit_icon{font-size:1.3rem;}'
        ].join('');
        document.head.appendChild(s);

        var bar = document.createElement('div');
        bar.id = '_exit_bar';
        bar.innerHTML = '<span class="_exit_icon">👆</span><span>再次滑入退出</span>';
        document.body.appendChild(bar);

        var _exitReady = false, _exitTimer = null;
        var _popEnabled = false;

        function enableExitDetection() {
            if (_popEnabled) return;
            _popEnabled = true;
            history.pushState(null, null, location.href);

            window.addEventListener('popstate', function(e) {
                if (!_popEnabled) return;
                if (_exitReady) {
                    _exitReady = false;
                    return;
                }
                bar.classList.add('show');
                _exitReady = true;
                if (_exitTimer) clearTimeout(_exitTimer);
                _exitTimer = setTimeout(function() {
                    bar.classList.remove('show');
                    _exitReady = false;
                }, 3000);
                history.pushState(null, null, location.href);
            });
        }

        setTimeout(enableExitDetection, 500);

        ['touchstart', 'click', 'keydown', 'focus'].forEach(function(evt) {
            document.addEventListener(evt, enableExitDetection, { once: true, capture: true });
        });

        window._hideExitBar = function() {
            if (bar.classList.contains('show')) {
                bar.classList.remove('show');
                _exitReady = false;
                if (_exitTimer) clearTimeout(_exitTimer);
            }
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExitHint);
    } else {
        initExitHint();
    }
})();

console.log('%c安监智能查询系统 · app.js 已加载', 'color:#1a365d;font-weight:bold;');
