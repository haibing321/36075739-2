/**
 * Utils（公共工具函数）模块
 * ===================================================
 * 功能：
 *   - TAB_LABELS: 导航栏 Tab 名称映射
 *   - toggleNav(): 移动端导航菜单切换
 *   - switchTab(tab): 切换主面板 Tab
 *   - closeModal(id) / openModal(id): 模态框控制
 *   - autoResize(textarea): 自动调整文本框高度
 *   - pinyinMatch(text, keyword): 拼音匹配
 *   - extractDigits(str): 提取数字
 *   - TAB_ORDER, _tabHistory: 模块切换历史
 * 
 * 导出到 window:
 *   - window.toggleNav, window.switchTab, window.closeModal
 *   - window.openModal, window.autoResize
 *   - window._fvScrollbarReset
 */

// ============================================================
// 全局工具函数
        // ========== 全局工具函数 ==========
        // 导航栏 Tab 名称映射
        const TAB_LABELS = {
            handbook: '📖 检查手册',
            issue: '📊 检查信息',
            rule: '📋 规章制度',
            diary: '📝 工作日志',
            phone: '📞 车站电话',
            doubao: '🤖 智能助手'
        };

        window.toggleNav = function() {
            const nav = document.getElementById('mainNav');
            const toggle = document.getElementById('navToggle');
            const isOpen = nav.classList.contains('nav-open');
            if (isOpen) {
                nav.classList.remove('nav-open');
                toggle.classList.remove('open');
                toggle.setAttribute('aria-label', '展开导航菜单');
            } else {
                nav.classList.add('nav-open');
                toggle.classList.add('open');
                toggle.setAttribute('aria-label', '收起导航菜单');
            }
        };

        // ===== 模块切换历史记录（最近5次）=====
        const TAB_ORDER = ['handbook','issue','rule','diary','phone','doubao'];
        const _tabHistory = []; // 最近5次切换记录 [{from, to, label}]

        window.switchTab = function(tab, fromSwipe) {
            // 记录历史（侧滑或手动切换都记录）
            const prevActiveBtn = document.querySelector('.nav-btn.active');
            let prevTab = null;
            if (prevActiveBtn) {
                const m = prevActiveBtn.id.match(/^tab-(.+)$/);
                if (m) prevTab = m[1];
            }
            if (prevTab && prevTab !== tab) {
                _tabHistory.push({ from: prevTab, to: tab, label: TAB_LABELS[tab] || tab });
                if (_tabHistory.length > 5) _tabHistory.shift();
            }
            document.querySelectorAll('.nav-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById('tab-' + tab).classList.add('active');
            document.getElementById('panel-' + tab).classList.add('active');
            // 更新移动端当前Tab标签
            const labelEl = document.getElementById('navCurrentLabel');
            if (labelEl) labelEl.textContent = TAB_LABELS[tab] || '';
            // 切换后自动收起导航菜单（移动端）
            const nav = document.getElementById('mainNav');
            const toggle = document.getElementById('navToggle');
            if (nav && nav.classList.contains('nav-open')) {
                nav.classList.remove('nav-open');
                toggle.classList.remove('open');
                toggle.setAttribute('aria-label', '展开导航菜单');
            }
            // 侧滑时不再显示 Toast 记录框
            // if (fromSwipe) {
            //     _showSwipeToast(tab);
            // }
        };

        window.closeModal = function(id) { 
            document.getElementById(id).classList.remove('active'); 
            if (id === 'rule-fullViewModal' && _imgLazyObserver) {
                _imgLazyObserver.disconnect();
            }
        };
        window.openModal = function(id) { document.getElementById(id).classList.add('active'); };

        // 自定义滚动条已移除（改用原生滚动，消除手机端高频DOM计算卡顿）
        window._fvScrollbarReset = function() {}; // 空函数，保持原有调用不报错

        window.autoResize = function(textarea) {
            if (!textarea) return;
            void textarea.offsetHeight;
            textarea.style.height = 'auto';
            textarea.style.height = Math.max(40, textarea.scrollHeight) + 'px';
        };

        window.addEventListener('resize', function() {
            setTimeout(function() {
                document.querySelectorAll('.diary-issue-input, .diary-textarea').forEach(function(el) {
                    autoResize(el);
                });
            }, 100);
        });

        function pinyinMatch(text, keyword) {
            if (!text || !keyword) return false;
            const lowerText = text.toLowerCase();
            if (lowerText.includes(keyword.toLowerCase())) return true;
            try {
                const pinyinFull = pinyin(text, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join('').toLowerCase();
                if (pinyinFull.includes(keyword.toLowerCase())) return true;
                const pinyinFirst = pinyin(text, { style: pinyin.STYLE_FIRST_LETTER }).flat().join('').toLowerCase();
                if (pinyinFirst.includes(keyword.toLowerCase())) return true;
            } catch (e) {}
            return false;
        }
        function extractDigits(str) {
            return (str || '').replace(/\D/g, '');
        }

        // ============================================================
        // 统一安全函数（XSS 防护）
        // ============================================================

        /**
         * HTML 实体转义 — 统一版本，替代各模块重复实现
         * 覆盖: diary.js:294, phone.js:127, rule.js:427 的本地副本
         * 用法: window.escapeHtml('<script>alert(1)</script>')
         * 返回: '&lt;script&gt;alert(1)&lt;/script&gt;'
         */
        window.escapeHtml = function(text) {
            if (text === null || text === undefined) return '';
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        /**
         * 安全 HTML 渲染 — DOMPurify 包装 + 降级回退
         *
         * 优先使用 DOMPurify（允许安全的 HTML 标签如 <br><strong> 等），
         * 若 CDN 加载失败则降级为纯转义（所有标签都变文本）。
         *
         * @param {string} dirty - 可能包含恶意 HTML 的字符串
         * @param {object} [options] - 传给 DOMPurify.sanitize 的选项
         *   - allowedTags: 允许的标签白名单（默认：常用安全标签）
         *   - allowedAttributes: 允许的属性白名单
         *   - forceEscape: true 时强制纯文本模式（不保留任何HTML标签）
         * @returns {string} 安全的 HTML 字符串，可直接赋值给 innerHTML
         *
         * 用法示例:
         *   el.innerHTML = safeHtml(userContent);              // 默认允许 br/b/strong/i/em/p
         *   el.innerHTML = safeHtml(aiResponse, {forceEscape:true}); // 纯文本模式
         *   el.innerHTML = safeHtml(markdown, {allowedTags:['br','h3','div','pre','code']});
         */
        window.safeHtml = function(dirty, options) {
            if (dirty === null || dirty === undefined) return '';

            // 强制纯文本模式（不信任任何HTML标签）
            if (options && options.forceEscape) {
                return window.escapeHtml(dirty);
            }

            // DOMPurify 可用时使用完整 sanitize
            if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
                try {
                    var purifyOptions = {
                        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span',
                                        'h1','h2','h3','h4','h5','h6',
                                        'ul','ol','li','blockquote',
                                        'pre','code','div',
                                        'table','thead','tbody','tr','th','td',
                                        'a', 'img', 'hr', 'sub', 'sup', 'mark'],
                        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style',
                                       'id', 'target', 'rel', 'data-*'],
                        ADD_ATTR: ['target'],
                        FORCE_BODY: false
                    };
                    // 合并用户自定义选项
                    if (options) {
                        if (options.allowedTags) purifyOptions.ALLOWED_TAGS = options.allowedTags;
                        if (options.allowedAttributes) purifyOptions.ALLOWED_ATTR = options.allowedAttributes;
                        if (options.allowHref) purifyOptions.ALLOWED_ATTR.push('href');
                    }
                    return DOMPurify.sanitize(dirty, purifyOptions);
                } catch(e) {
                    console.warn('[safeHtml] DOMPurify sanitize 失败，降级为转义:', e.message);
                }
            }

            // 降级方案：CDN 未加载或异常时，全部转义为纯文本
            // 保留换行符转为 <br>（这是最常见的安全需求）
            var escaped = window.escapeHtml(dirty);
            return escaped.replace(/\n/g, '<br>');
        };


