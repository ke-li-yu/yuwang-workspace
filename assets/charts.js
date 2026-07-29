(function() {
  // ===== COLOR TOKENS =====
  var primary = '#5A6B3A';
  var primaryLight = '#6E8349';
  var accent2 = '#D4873A';
  var accent3 = '#3A8FBF';
  var accent4 = '#8B6BAE';
  var warning = '#E8A838';
  var ink = '#2d2d2d';
  var muted = '#8c8c8c';
  var rule = '#e5e5e0';
  var bgCard = '#ffffff';

  // ===== DATE & CLOCK =====
  var months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  var days = ['周日','周一','周二','周三','周四','周五','周六'];

  function updateDate() {
    var now = new Date();
    document.getElementById('today-date').textContent = now.getFullYear() + '年' + months[now.getMonth()] + now.getDate() + '日';
    document.getElementById('today-week').textContent = days[now.getDay()];
  }
  function updateClock() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('live-clock').textContent = h + ':' + m + ':' + s;
  }
  updateDate();
  updateClock();
  setInterval(updateClock, 1000);

  // ===== SIDEBAR =====
  window.openSidebar = function() {
    document.getElementById('sidebar').classList.add('open');
    var ov = document.getElementById('sidebar-overlay');
    ov.style.display = 'block';
    requestAnimationFrame(function() { ov.classList.add('show'); });
  };
  window.closeSidebar = function() {
    document.getElementById('sidebar').classList.remove('open');
    var ov = document.getElementById('sidebar-overlay');
    ov.classList.remove('show');
    setTimeout(function() { ov.style.display = 'none'; }, 300);
  };

  // ===== PANEL SWITCHING =====
  var panelTitles = { daily: '每日计划', inspire: '选题/每日灵感', trends: '爆款热点视频/二创', review: '内容复盘' };
  window.switchPanel = function(name, el) {
    document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
    document.getElementById('panel-' + name).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    if (el) el.classList.add('active');
    document.getElementById('top-title').textContent = panelTitles[name] || name;
    closeSidebar();
    setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 100);
  };

  // ===== TASK MANAGEMENT (localStorage) =====
  var STORAGE_KEY = 'ywgz_tasks_v2';
  var STORAGE_NOTES = 'ywgz_notes_v2';

  var defaultTasks = [
    { id: 1, title: '口语练习30分钟', cat: 'growth', catLabel: '个人成长', done: false },
    { id: 2, title: '健身房锻炼1小时', cat: 'growth', catLabel: '个人成长', done: false },
    { id: 3, title: '浏览各平台热点话题（抖音/视频号/小红书/快手）', cat: 'create', catLabel: '创作', done: false },
    { id: 4, title: '视频拍摄/剪辑', cat: 'create', catLabel: '创作', done: false },
    { id: 5, title: '发布内容+评论互动', cat: 'create', catLabel: '创作', done: false },
    { id: 6, title: '数据复盘', cat: 'daily', catLabel: '日常', done: false }
  ];

  function loadTasks() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return JSON.parse(JSON.stringify(defaultTasks));
  }
  function saveTasks() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch(e) {}
  }

  var tasks = loadTasks();
  var nextId = tasks.reduce(function(mx, t) { return Math.max(mx, t.id); }, 0) + 1;
  var currentFilter = 'all';

  function updateStats() {
    var total = tasks.length;
    var done = tasks.filter(function(t) { return t.done; }).length;
    var remain = total - done;
    var pct = total > 0 ? Math.round(done / total * 100) : 0;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-done').textContent = done;
    document.getElementById('stat-progress').textContent = pct + '%';
    document.getElementById('stat-remain').textContent = remain;
  }

  function renderTasks() {
    var list = document.getElementById('task-list');
    list.innerHTML = '';
    var filtered = currentFilter === 'all' ? tasks : tasks.filter(function(t) { return t.cat === currentFilter; });
    filtered.forEach(function(task) {
      var catClass = task.cat === 'create' ? 'tag-create' : task.cat === 'growth' ? 'tag-growth' : 'tag-daily';
      var div = document.createElement('div');
      div.className = 'task-item' + (task.done ? ' completed' : '');
      div.innerHTML =
        '<div class="task-check' + (task.done ? ' done' : '') + '" data-id="' + task.id + '"></div>' +
        '<div class="task-content"><h4>' + task.title + '</h4>' +
        '<div class="task-meta"><span class="task-tag ' + catClass + '">' + task.catLabel + '</span></div></div>' +
        '<button class="task-delete" data-id="' + task.id + '">&times;</button>';
      list.appendChild(div);
    });
    updateStats();
    // bind events
    list.querySelectorAll('.task-check').forEach(function(el) {
      el.addEventListener('click', function() {
        var id = parseInt(this.getAttribute('data-id'));
        tasks.forEach(function(t) { if (t.id === id) t.done = !t.done; });
        saveTasks(); renderTasks();
      });
    });
    list.querySelectorAll('.task-delete').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = parseInt(this.getAttribute('data-id'));
        tasks = tasks.filter(function(t) { return t.id !== id; });
        saveTasks(); renderTasks();
      });
    });
  }

  window.filterTasks = function(cat, el) {
    currentFilter = cat;
    document.querySelectorAll('.task-cat').forEach(function(c) { c.classList.remove('active'); });
    if (el) el.classList.add('active');
    renderTasks();
  };

  window.addNewTask = function() {
    var input = document.getElementById('add-task-input');
    var title = input.value.trim();
    if (!title) return;
    tasks.push({ id: nextId++, title: title, cat: 'daily', catLabel: '日常', done: false });
    saveTasks(); input.value = ''; renderTasks();
  };
  // Enter key to add task
  document.getElementById('add-task-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') addNewTask();
  });

  renderTasks();

  // ===== INSPIRATION NOTES (localStorage) =====
  var defaultNotes = [
    '试试用捶打鱼丸的节奏配《今生啊多相见》BGM做卡点视频',
    '潮汕方言教学系列可以每周固定一期，培养粉丝期待感'
  ];

  function loadNotes() {
    try {
      var raw = localStorage.getItem(STORAGE_NOTES);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return defaultNotes.slice();
  }
  function saveNotes() {
    try { localStorage.setItem(STORAGE_NOTES, JSON.stringify(inspireNotes)); } catch(e) {}
  }

  var inspireNotes = loadNotes();

  function renderNotes() {
    var list = document.getElementById('inspire-notes-list');
    list.innerHTML = '';
    inspireNotes.forEach(function(note, idx) {
      var div = document.createElement('div');
      div.className = 'note-item';
      div.innerHTML =
        '<span style="color:' + primary + ';flex-shrink:0;font-size:14px;">\u{1F4A1}</span>' +
        '<span style="flex:1;">' + note + '</span>' +
        '<button class="note-del" data-idx="' + idx + '">&times;</button>';
      list.appendChild(div);
    });
    list.querySelectorAll('.note-del').forEach(function(el) {
      el.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-idx'));
        inspireNotes.splice(idx, 1);
        saveNotes(); renderNotes();
      });
    });
  }

  document.getElementById('inspire-note-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && this.value.trim()) {
      inspireNotes.unshift(this.value.trim());
      this.value = '';
      saveNotes(); renderNotes();
    }
  });
  renderNotes();

  // ===== ECHARTS =====

  // --- Radar Chart: 二创适配度 ---
  var chartRadar = echarts.init(document.getElementById('chart-radar'), null, { renderer: 'svg' });
  chartRadar.setOption({
    tooltip: { trigger: 'item', backgroundColor: bgCard, borderColor: rule, textStyle: { color: ink, fontSize: 12 } },
    radar: {
      indicator: [
        { name: '热度值', max: 100 },
        { name: '风格匹配', max: 100 },
        { name: '二创空间', max: 100 },
        { name: '受众重合', max: 100 },
        { name: '竞争优势', max: 100 }
      ],
      axisName: { color: muted, fontSize: 11 },
      splitArea: { show: true, areaStyle: { color: ['rgba(90,107,58,0.02)', 'rgba(90,107,58,0.05)'] } },
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'radar',
      data: [
        { value: [95, 85, 90, 80, 70], name: '古诗词旅行', lineStyle: { color: primary }, areaStyle: { color: 'rgba(90,107,58,0.20)' }, itemStyle: { color: primary } },
        { value: [90, 90, 85, 85, 75], name: '拍照教程', lineStyle: { color: accent3 }, areaStyle: { color: 'rgba(58,143,191,0.15)' }, itemStyle: { color: accent3 } },
        { value: [85, 70, 80, 60, 50], name: '航天科普', lineStyle: { color: accent4 }, areaStyle: { color: 'rgba(139,107,174,0.15)' }, itemStyle: { color: accent4 } },
        { value: [80, 75, 75, 70, 60], name: '短剧reaction', lineStyle: { color: accent2 }, areaStyle: { color: 'rgba(212,135,58,0.15)' }, itemStyle: { color: accent2 } },
        { value: [70, 65, 70, 75, 55], name: '旅游避坑', lineStyle: { color: warning }, areaStyle: { color: 'rgba(232,168,56,0.15)' }, itemStyle: { color: warning } }
      ]
    }],
    legend: {
      bottom: 0, textStyle: { color: muted, fontSize: 11 }, itemWidth: 12, itemHeight: 8
    }
  });

  // --- Weekly Chart: 近7天数据 ---
  var chartWeekly = echarts.init(document.getElementById('chart-weekly'), null, { renderer: 'svg' });
  chartWeekly.setOption({
    tooltip: { trigger: 'axis', backgroundColor: bgCard, borderColor: rule, textStyle: { color: ink, fontSize: 12 } },
    legend: { top: 0, textStyle: { color: muted, fontSize: 11 }, itemWidth: 12, itemHeight: 8 },
    grid: { top: 40, bottom: 30, left: 50, right: 20 },
    xAxis: {
      type: 'category',
      data: ['7/19', '7/20', '7/21', '7/22', '7/23', '7/24', '7/25'],
      axisLabel: { color: muted, fontSize: 11 },
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value', name: '播放量(万)', nameTextStyle: { color: muted, fontSize: 10 },
        axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } }
      },
      {
        type: 'value', name: '互动率(%)', nameTextStyle: { color: muted, fontSize: 10 },
        axisLabel: { color: muted, fontSize: 10 }, splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '播放量', type: 'bar', yAxisIndex: 0,
        data: [6.2, 18.5, 10.8, 8.7, 12.5, 15.2, null],
        itemStyle: { color: primary, borderRadius: [4, 4, 0, 0] }, barWidth: '40%'
      },
      {
        name: '互动率', type: 'line', yAxisIndex: 1,
        data: [2.8, 5.8, 3.5, 4.1, 3.8, 4.5, null],
        lineStyle: { color: accent3 }, itemStyle: { color: accent3 }, symbol: 'circle', symbolSize: 6
      }
    ]
  });

  // --- Type Comparison Chart ---
  var chartType = echarts.init(document.getElementById('chart-type'), null, { renderer: 'svg' });
  chartType.setOption({
    tooltip: { trigger: 'axis', backgroundColor: bgCard, borderColor: rule, textStyle: { color: ink, fontSize: 12 } },
    legend: { top: 0, textStyle: { color: muted, fontSize: 11 }, itemWidth: 12, itemHeight: 8 },
    grid: { top: 40, bottom: 30, left: 90, right: 20 },
    xAxis: {
      type: 'value',
      axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } }
    },
    yAxis: {
      type: 'category',
      data: ['对比测评', '沉浸式制作', '文化探店', '自律Vlog', '美食教程'],
      axisLabel: { color: muted, fontSize: 11 },
      axisLine: { lineStyle: { color: rule } }, axisTick: { show: false }
    },
    series: [
      {
        name: '平均播放(万)', type: 'bar',
        data: [18.5, 15.2, 8.7, 5.3, 6.8],
        itemStyle: { color: primary, borderRadius: [0, 4, 4, 0] }, barWidth: '35%'
      },
      {
        name: '平均互动率(%)', type: 'bar',
        data: [5.8, 4.5, 4.1, 2.8, 3.5],
        itemStyle: { color: accent3, borderRadius: [0, 4, 4, 0] }, barWidth: '35%'
      }
    ]
  });

  // ===== RESIZE =====
  window.addEventListener('resize', function() {
    chartRadar.resize();
    chartWeekly.resize();
    chartType.resize();
  });

})();
