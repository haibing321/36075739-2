/**
 * Backup（备份恢复）模块
 * ===================================================
 * 功能：全局数据打包备份与恢复
 *   - oneClickBackup(): ZIP 打包所有模块数据并下载
 *   - oneClickRestore(): 从 ZIP 文件恢复数据到各模块
 * 
 * 依赖：
 *   - 外部库: JSZip
 *   - IndexedDB: IssueDB, RuleDB, DiaryDB, MemoDB, PhoneDB, HandbookDB
 *   - localStorage: 各模块的配置数据
 *   - Toast 系统（如果可用）
 * 
 * 导出到 window:
 *   - window.oneClickBackup
 *   - window.oneClickRestore
 */

// ============================================================
// 全局数据备份与恢复 IIFE
// ========== 全局数据备份与恢复 ==========
(function() {
    function readIndexedDB(dbName, storeName, version) {
        return new Promise(function(resolve, reject) {
            var req = indexedDB.open(dbName, version || 1);
            req.onerror = function(){ reject(req.error); };
            req.onsuccess = function(){
                var db = req.result;
                if (!db.objectStoreNames.contains(storeName)) { db.close(); return resolve([]); }
                var tx = db.transaction(storeName, 'readonly');
                var store = tx.objectStore(storeName);
                var getAll = store.getAll();
                getAll.onsuccess = function(){ resolve(getAll.result); };
                getAll.onerror = function(){ reject(getAll.error); };
                tx.oncomplete = function(){ db.close(); };
            };
        });
    }

    function writeIndexedDB(dbName, storeName, version, data, clearFirst) {
        if (clearFirst === undefined) clearFirst = true;
        return new Promise(function(resolve, reject) {
            var req = indexedDB.open(dbName, version || 1);
            req.onupgradeneeded = function(e){
                var db = e.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                }
            };
            req.onsuccess = function(){
                var db = req.result;
                var tx = db.transaction(storeName, 'readwrite');
                var store = tx.objectStore(storeName);
                if (clearFirst) {
                    store.clear();
                }
                var completed = 0;
                var hasError = false;
                for (var i = 0; i < data.length; i++) {
                    var item = data[i];
                    // 移除原有的 id 字段，让数据库自动生成新 ID，避免冲突
                    var cleanItem = {};
                    for (var k in item) {
                        if (item.hasOwnProperty(k) && k !== 'id') cleanItem[k] = item[k];
                    }
                    var addReq = store.add(cleanItem);
                    addReq.onerror = function(ev) {
                        console.error('写入 ' + dbName + '.' + storeName + ' 失败:', ev.target.error);
                        hasError = true;
                        reject(ev.target.error);
                    };
                    addReq.onsuccess = function() {
                        completed++;
                        if (completed === data.length && !hasError) {
                            resolve();
                        }
                    };
                }
                if (data.length === 0) resolve();
                tx.oncomplete = function() { db.close(); };
                tx.onerror = function() {
                    if (!hasError) {
                        console.error('事务错误 ' + dbName + '.' + storeName + ':', tx.error);
                        reject(tx.error);
                    }
                };
            };
            req.onerror = function(){ reject(req.error); };
        });
    }

    function getLocal(key, def) {
        try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch(e) { return def; }
    }

    function _toast(msg, isErr) {
        try { if (typeof Toast !== 'undefined') { isErr ? Toast.error(msg) : Toast.success(msg); return; } } catch(e) {}
        alert(msg);
    }

    window.oneClickBackup = async function() {
        if (typeof JSZip === 'undefined') { _toast('JSZip 未加载，请刷新后重试', true); return; }
        _toast('正在收集数据…');
        var backup = { version: 3, exportDate: new Date().toISOString(), modules: {} };
        try {
            backup.modules.issues = await readIndexedDB('RailwayIssueDB_v2', 'issues', 1);
            if (!backup.modules.issues || backup.modules.issues.length === 0) console.warn('警告：检查信息模块无数据');
            backup.modules.rules = await readIndexedDB('RailwayRuleDB', 'ruleCollection', 3);
            if (!backup.modules.rules || backup.modules.rules.length === 0) console.warn('警告：规章制度模块无数据');
            backup.modules.diary = getLocal('railway_work_diary_v2', []);
            backup.modules.phone = getLocal('railway_phone_db_v1', []);
            backup.modules.handbook = getLocal('handbook_fourlevel_v1', []);
            if (!backup.modules.handbook || backup.modules.handbook.length === 0) console.warn('警告：检查手册模块无数据');
            backup.modules.writingMaterials = await readIndexedDB('railway_writer_db', 'writing_materials', 2);
            backup.modules.writingReports = await readIndexedDB('railway_writer_db', 'writing_reports', 2);
            backup.modules.dsConversations = getLocal('ds_conversations_v1', []);
            backup.modules.dsChatHistory = getLocal('ds_chat_history_v1', []);
            backup.modules.termLibrary = getLocal('patch_term_library_v2', []);
            backup.modules.memos = getLocal('railway_memo_v1', []);
            backup.modules.diaryMedia = await readIndexedDB('DiaryMediaDB', 'media', 1);
            // 将 diaryMedia 中的 blob (ArrayBuffer) 异步转为 base64，避免手机端主线程卡死
            var mediaFileCount = 0, mediaTotalBytes = 0;
            if (backup.modules.diaryMedia && backup.modules.diaryMedia.length > 0) {
                _toast('正在处理多媒体文件(' + backup.modules.diaryMedia.length + '个)…');
                var converted = [];
                for (var i = 0; i < backup.modules.diaryMedia.length; i++) {
                    var rec = backup.modules.diaryMedia[i];
                    var copy = { id: rec.id, type: rec.type || 'image/jpeg', captureTime: rec.captureTime || '' };
                    if (rec.blob) {
                        // 兼容不同浏览器返回格式（ArrayBuffer 或 Blob）
                        var rawBlob = rec.blob instanceof Blob ? rec.blob : new Blob([rec.blob], { type: rec.type || 'application/octet-stream' });
                        var rawSize = rec.blob.byteLength || rec.blob.size || rawBlob.size || 0;
                        // 使用 FileReader 异步编码，不阻塞主线程（华为/手机端不会卡死）
                        copy.blobBase64 = await new Promise(function(resolve) {
                            var reader = new FileReader();
                            reader.onload = function() { resolve(reader.result.split(',')[1] || ''); };
                            reader.onerror = function() { resolve(''); };
                            reader.readAsDataURL(rawBlob);
                        });
                        copy.blobSize = rawSize;
                        mediaFileCount++;
                        mediaTotalBytes += rawSize;
                        // 每处理5个文件让出主线程，给 UI 刷新的机会
                        if (i % 5 === 4) { await new Promise(function(r) { setTimeout(r, 10); }); }
                    }
                    converted.push(copy);
                }
                backup.modules.diaryMedia = converted;
            }

            var zip = new JSZip();
            zip.file('full_backup.json', JSON.stringify(backup, null, 2));
            var blob = await zip.generateAsync({ type: 'blob' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = '安监系统备份_' + new Date().toISOString().slice(0,19).replace(/:/g,'-') + '.zip';
            a.click();
            setTimeout(function(){ URL.revokeObjectURL(url); }, 5000);
            _toast('备份完成' + (mediaFileCount > 0 ? ' · 含' + mediaFileCount + '个附件(' + (mediaTotalBytes/1024/1024).toFixed(1) + 'MB原始)' : ''));
        } catch(e) { _toast('备份失败：' + e.message, true); }
    };

    window.oneClickRestore = function() {
        if (typeof JSZip === 'undefined') { _toast('JSZip 未加载', true); return; }
        var input = document.createElement('input');
        input.type = 'file'; input.accept = '.zip';
        input.onchange = async function(e){
            var file = e.target.files[0]; if (!file) return;
            try {
                var zip = await JSZip.loadAsync(file);
                var backupFile = zip.file('full_backup.json');
                if (!backupFile) throw new Error('缺少 full_backup.json');
                var backup = JSON.parse(await backupFile.async('string'));
                if (backup.version !== 2 && backup.version !== 3) throw new Error('版本不兼容（仅支持v2/v3）');
                if (!confirm('⚠️ 将覆盖现有数据，确定继续？')) return;

                _toast('正在恢复数据…');
                var bm = backup.modules;
                if (bm.issues && Array.isArray(bm.issues) && bm.issues.length) {
                    await writeIndexedDB('RailwayIssueDB_v2', 'issues', 1, bm.issues);
                    console.log('已恢复 ' + bm.issues.length + ' 条检查信息');
                } else {
                    console.warn('备份中无检查信息数据');
                }
                if (bm.rules && Array.isArray(bm.rules) && bm.rules.length) {
                    // 兼容备份格式：规章数据可能是 {id:1, data:[...]} 或直接的数组
                    var standardRules = bm.rules;
                    if (!(bm.rules.length === 1 && bm.rules[0].id === 1 && bm.rules[0].data)) {
                        standardRules = [{ id: 1, data: bm.rules }];
                    }
                    // 使用 store.put 保留 id=1（不能用 writeIndexedDB，会移除 id）
                    await new Promise(function(resolve, reject) {
                        var req = indexedDB.open('RailwayRuleDB', 3);
                        req.onupgradeneeded = function(e) {
                            var db = e.target.result;
                            if (!db.objectStoreNames.contains('ruleCollection')) {
                                db.createObjectStore('ruleCollection', { keyPath: 'id' });
                            }
                        };
                        req.onsuccess = function() {
                            var db = req.result;
                            var tx = db.transaction('ruleCollection', 'readwrite');
                            var store = tx.objectStore('ruleCollection');
                            store.clear();
                            for (var i = 0; i < standardRules.length; i++) {
                                store.put(standardRules[i]);
                            }
                            tx.oncomplete = function() { db.close(); resolve(); };
                            tx.onerror = function() { reject(tx.error); };
                        };
                        req.onerror = function() { reject(req.error); };
                    });
                    console.log('已恢复 ' + standardRules[0].data.length + ' 条规章制度');
                } else {
                    console.warn('备份中无规章制度数据');
                }
                if (bm.diary) localStorage.setItem('railway_work_diary_v2', JSON.stringify(bm.diary));
                if (bm.phone) localStorage.setItem('railway_phone_db_v1', JSON.stringify(bm.phone));
                if (bm.handbook && Array.isArray(bm.handbook) && bm.handbook.length) {
                    localStorage.setItem('handbook_fourlevel_v1', JSON.stringify(bm.handbook));
                    console.log('已恢复 ' + bm.handbook.length + ' 条手册条目');
                } else {
                    console.warn('备份中无手册数据');
                }
                if (bm.writingMaterials && Array.isArray(bm.writingMaterials) && bm.writingMaterials.length) {
                    await writeIndexedDB('railway_writer_db', 'writing_materials', 2, bm.writingMaterials);
                }
                if (bm.writingReports && Array.isArray(bm.writingReports) && bm.writingReports.length) {
                    await writeIndexedDB('railway_writer_db', 'writing_reports', 2, bm.writingReports);
                }
                if (bm.dsConversations) localStorage.setItem('ds_conversations_v1', JSON.stringify(bm.dsConversations));
                if (bm.dsChatHistory) localStorage.setItem('ds_chat_history_v1', JSON.stringify(bm.dsChatHistory));
                if (bm.termLibrary) localStorage.setItem('patch_term_library_v2', JSON.stringify(bm.termLibrary));
                if (bm.memos) localStorage.setItem('railway_memo_v1', JSON.stringify(bm.memos));
                if (bm.diaryMedia) {
                    // 将 base64 异步还原为 ArrayBuffer，避免手机端卡死
                    _toast('正在还原多媒体文件…');
                    for (var i = 0; i < bm.diaryMedia.length; i++) {
                        var rec = bm.diaryMedia[i];
                        if (rec.blobBase64) {
                            // 分块异步还原，避免手机端主线程闪退
                            rec.blob = await new Promise(function(resolve) {
                                var binary = atob(rec.blobBase64);
                                var bytes = new Uint8Array(binary.length);
                                var chunkSize = 65536; // 64KB 每块
                                var offset = 0;
                                function processChunk() {
                                    var end = Math.min(offset + chunkSize, binary.length);
                                    for (var b = offset; b < end; b++) { bytes[b] = binary.charCodeAt(b); }
                                    offset = end;
                                    if (offset < binary.length) {
                                        setTimeout(processChunk, 0); // 让出主线程
                                    } else {
                                        resolve(bytes.buffer);
                                    }
                                }
                                processChunk();
                            });
                            delete rec.blobBase64;
                            delete rec.blobSize;
                            if (typeof rec.id === 'string') rec.id = parseInt(rec.id, 10);
                        }
                    }
                    await writeIndexedDB('DiaryMediaDB', 'media', 1, bm.diaryMedia);
                }

                _toast('恢复完成，即将刷新…');
                // 等待所有异步写入完成，并额外留出 IndexedDB 事务落盘时间
                setTimeout(function() {
                    setTimeout(function(){ location.reload(); }, 2000);
                }, 1000);
            } catch(err) { _toast('恢复失败：' + err.message, true); }
            input.remove();
        };
        input.click();
    };

    function bind() {
        var b1 = document.getElementById('global-backup-btn');
        var b2 = document.getElementById('global-restore-btn');
        if (b1) b1.onclick = window.oneClickBackup;
        if (b2) b2.onclick = window.oneClickRestore;
    }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', bind); }
    else { bind(); }
})();
