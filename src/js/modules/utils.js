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

