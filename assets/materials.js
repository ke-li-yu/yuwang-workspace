/**
 * 素材积累模块 — 独立脚本
 * 功能：保存视频链接、平台识别、AI分析请求复制、二创灵感记录
 * 数据持久化：localStorage
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'ywgz_materials_v1';

  // ===== 工具函数 =====
  function showToast(msg, icon) {
    var existing = document.getElementById('mat-toast-el');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'mat-toast-el';
    toast.className = 'mat-toast';
    toast.innerHTML = (icon ? '<span class="toast-icon">' + icon + '</span>' : '') + msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function() { toast.classList.add('show'); });
    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { toast.remove(); }, 300);
    }, 2800);
  }

  function extractUrl(text) {
    if (!text) return '';
    // 匹配 http/https 链接
    var urlMatch = text.match(/https?:\/\/[^\s，。、,.)\]]+/i);
    if (urlMatch) return urlMatch[0];
    // 匹配抖音短链接（无协议头）
    var douyinMatch = text.match(/v\.douyin\.com\/[^\s，。、,.)\]]+/i);
    if (douyinMatch) return 'https://' + douyinMatch[0];
    // 匹配小红书短链接
    var xhsMatch = text.match(/xhslink\.com\/[^\s，。、,.)\]]+/i);
    if (xhsMatch) return 'https://' + xhsMatch[0];
    // 匹配快手短链接
    var ksMatch = text.match(/v\.kuaishou\.com\/[^\s，。、,.)\]]+/i);
    if (ksMatch) return 'https://' + ksMatch[0];
    // 匹配B站短链接
    var biliMatch = text.match(/b23\.tv\/[^\s，。、,.)\]]+/i);
    if (biliMatch) return 'https://' + biliMatch[0];
    return '';
  }

  function detectPlatform(url) {
    var u = (url || '').toLowerCase();
    if (u.indexOf('douyin.com') >= 0 || u.indexOf('iesdouyin') >= 0) return { key: 'douyin', label: '抖音' };
    if (u.indexOf('xiaohongshu') >= 0 || u.indexOf('xhslink') >= 0) return { key: 'xhs', label: '小红书' };
    if (u.indexOf('kuaishou') >= 0 || u.indexOf('gifshow') >= 0) return { key: 'kuaishou', label: '快手' };
    if (u.indexOf('channels.weixin') >= 0 || u.indexOf('weixin.qq.com') >= 0) return { key: 'shipinhao', label: '视频号' };
    if (u.indexOf('bilibili') >= 0 || u.indexOf('b23.tv') >= 0) return { key: 'bilibili', label: 'B站' };
    if (u.indexOf('weibo') >= 0) return { key: 'weibo', label: '微博' };
    return { key: 'other', label: '其他' };
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ===== 数据读写 =====
  function loadMaterials() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return [];
  }

  function saveMaterials() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
    } catch(e) {}
  }

  var materials = loadMaterials();
  var nextId = materials.reduce(function(mx, m) { return Math.max(mx, m.id || 0); }, 0) + 1;

  // ===== 渲染素材卡片 =====
  function renderMaterials() {
    var list = document.getElementById('mat-list');
    if (!list) return;

    if (materials.length === 0) {
      list.innerHTML =
        '<div class="mat-empty">' +
          '<div class="empty-icon">📦</div>' +
          '<div>还没有素材，快粘贴视频链接添加吧</div>' +
        '</div>';
      return;
    }

    list.innerHTML = '';
    materials.forEach(function(mat) {
      var platform = detectPlatform(mat.url);
      var card = document.createElement('div');
      card.className = 'mat-card';
      card.setAttribute('data-mat-id', mat.id);

      card.innerHTML =
        '<div class="mat-card-header">' +
          '<div class="mat-card-left">' +
            '<div class="mat-card-left-top">' +
              '<span class="mat-platform-badge ' + platform.key + '">' + platform.label + '</span>' +
              '<span style="font-size:11px;color:var(--muted);">' + (mat.createdAt || '') + '</span>' +
            '</div>' +
            '<a href="' + escapeHtml(mat.url) + '" target="_blank" rel="noopener" class="mat-card-link">' + escapeHtml(mat.url) + '</a>' +
          '</div>' +
          '<button class="mat-card-delete" data-mat-del="' + mat.id + '" title="删除">&times;</button>' +
        '</div>' +

        '<div class="mat-ai-action-row">' +
          '<button class="analyze" data-mat-analyze="' + mat.id + '">' +
            '<span>🤖</span> AI分析视频' +
          '</button>' +
          '<button class="open-link" data-mat-open="' + mat.id + '">' +
            '<span>🔗</span> 打开视频' +
          '</button>' +
        '</div>' +

        '<div class="mat-analysis-block">' +
          '<div class="mat-analysis-label">' +
            '<span class="lbl-icon hook">⚡</span>' +
            '<span class="lbl-text">开头5秒爆点分析</span>' +
            '<span class="lbl-tag">前5秒抓手</span>' +
          '</div>' +
          '<textarea class="mat-analysis-textarea" data-mat-field="hook" data-mat-id="' + mat.id + '" placeholder="点击上方「AI分析视频」后，将AI分析的开头5秒爆点结果粘贴到这里...">' + escapeHtml(mat.hook || '') + '</textarea>' +
        '</div>' +

        '<div class="mat-analysis-block">' +
          '<div class="mat-analysis-label">' +
            '<span class="lbl-icon comment">💬</span>' +
            '<span class="lbl-text">评论区热门话题</span>' +
            '<span class="lbl-tag">讨论最多</span>' +
          '</div>' +
          '<textarea class="mat-analysis-textarea" data-mat-field="comment" data-mat-id="' + mat.id + '" placeholder="点击上方「AI分析视频」后，将AI总结的评论区讨论最多的话题粘贴到这里...">' + escapeHtml(mat.comment || '') + '</textarea>' +
        '</div>' +

        '<div class="mat-analysis-block">' +
          '<div class="mat-analysis-label">' +
            '<span class="lbl-icon idea">💡</span>' +
            '<span class="lbl-text">二创灵感</span>' +
            '<span class="lbl-tag">我的创作方向</span>' +
          '</div>' +
          '<textarea class="mat-analysis-textarea idea" data-mat-field="idea" data-mat-id="' + mat.id + '" placeholder="根据以上分析，写下你的二创灵感、拍摄思路、脚本大纲...">' + escapeHtml(mat.idea || '') + '</textarea>' +
        '</div>';

      list.appendChild(card);
    });

    // 绑定事件
    bindCardEvents();
  }

  function bindCardEvents() {
    var list = document.getElementById('mat-list');
    if (!list) return;

    // 删除按钮
    list.querySelectorAll('[data-mat-del]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = parseInt(this.getAttribute('data-mat-del'));
        materials = materials.filter(function(m) { return m.id !== id; });
        saveMaterials();
        renderMaterials();
        showToast('素材已删除', '🗑️');
      });
    });

    // AI分析按钮
    list.querySelectorAll('[data-mat-analyze]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = parseInt(this.getAttribute('data-mat-analyze'));
        var mat = materials.find(function(m) { return m.id === id; });
        if (!mat) return;
        copyAnalysisRequest(mat);
      });
    });

    // 打开视频按钮
    list.querySelectorAll('[data-mat-open]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = parseInt(this.getAttribute('data-mat-open'));
        var mat = materials.find(function(m) { return m.id === id; });
        if (!mat || !mat.url) return;
        window.open(mat.url, '_blank', 'noopener');
      });
    });

    // textarea 自动保存
    list.querySelectorAll('.mat-analysis-textarea').forEach(function(ta) {
      ta.addEventListener('input', function() {
        var id = parseInt(this.getAttribute('data-mat-id'));
        var field = this.getAttribute('data-mat-field');
        var mat = materials.find(function(m) { return m.id === id; });
        if (mat) {
          mat[field] = this.value;
          saveMaterials();
        }
      });
    });
  }

  // ===== AI分析请求复制 =====
  function copyAnalysisRequest(mat) {
    var platform = detectPlatform(mat.url);
    var prompt =
      '请帮我分析以下视频素材：\n\n' +
      '平台：' + platform.label + '\n' +
      '链接：' + mat.url + '\n\n' +
      '请从以下两个维度进行分析：\n\n' +
      '1.【开头5秒爆点分析】\n' +
      '   - 视频开头前5秒用了什么抓手吸引观众？\n' +
      '   - 是悬念、冲突、反差、情绪共鸣还是视觉冲击？\n' +
      '   - 这个开头为什么能留住观众？\n\n' +
      '2.【评论区热门话题总结】\n' +
      '   - 评论区讨论最多的话题是什么？\n' +
      '   - 观众的情绪倾向如何（正面/负面/中性）？\n' +
      '   - 有哪些高频关键词和共鸣点？\n\n' +
      '请先打开视频链接观看，然后给出详细分析。';

    // 尝试复制到剪贴板
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(prompt).then(function() {
        showToast('分析请求已复制！请粘贴到AI对话框发送', '📋');
        // 同时打开视频链接
        window.open(mat.url, '_blank', 'noopener');
      }).catch(function() {
        fallbackCopy(prompt, mat);
      });
    } else {
      fallbackCopy(prompt, mat);
    }
  }

  function fallbackCopy(text, mat) {
    // 降级方案：创建临时textarea
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('分析请求已复制！请粘贴到AI对话框发送', '📋');
    } catch(e) {
      showToast('复制失败，请手动复制分析请求', '⚠️');
    }
    document.body.removeChild(ta);
    // 打开视频链接
    if (mat && mat.url) {
      window.open(mat.url, '_blank', 'noopener');
    }
  }

  // ===== 添加素材 =====
  window.addMaterial = function() {
    var input = document.getElementById('mat-link-input');
    if (!input) return;
    var rawText = input.value.trim();
    if (!rawText) {
      showToast('请先粘贴视频链接或分享文案', '⚠️');
      return;
    }

    var url = extractUrl(rawText);
    if (!url) {
      showToast('未识别到有效链接，请检查输入内容', '⚠️');
      return;
    }

    // 检查重复
    var exists = materials.find(function(m) { return m.url === url; });
    if (exists) {
      showToast('该链接已添加过', 'ℹ️');
      return;
    }

    var now = new Date();
    var dateStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0');

    var mat = {
      id: nextId++,
      url: url,
      rawText: rawText.substring(0, 200),
      hook: '',
      comment: '',
      idea: '',
      createdAt: dateStr
    };

    materials.unshift(mat);
    saveMaterials();
    input.value = '';
    renderMaterials();
    showToast('素材添加成功！点击「AI分析视频」开始分析', '✅');
  };

  // ===== 初始化 =====
  function init() {
    var input = document.getElementById('mat-link-input');
    if (input) {
      // 支持回车添加（Shift+Enter换行）
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          window.addMaterial();
        }
      });
    }
    renderMaterials();
  }

  // DOM就绪后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
