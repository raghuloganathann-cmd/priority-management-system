(function(){
  var KEY = "pms-tasks-v1";
  var RANK = { High: 0, Medium: 1, Low: 2 };
  var tasks = load();

  function load(){
    try {
      var raw = localStorage.getItem(KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }
  function save(){
    try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) {}
  }

  var $ = function(id){ return document.getElementById(id); };
  var titleEl = $("title"), prioEl = $("priority"), dueEl = $("due");

  function addTask(){
    var t = titleEl.value.trim();
    if (!t) { titleEl.focus(); return; }
    tasks.push({ id: Date.now() + Math.random().toString(16).slice(2), title: t, priority: prioEl.value, due: dueEl.value || "", done: false, created: Date.now() });
    titleEl.value = ""; dueEl.value = "";
    save(); render(); titleEl.focus();
  }

  function today(){
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  }

  function visible(){
    var q = $("search").value.trim().toLowerCase();
    var f = $("filter").value, s = $("sort").value;
    var out = tasks.filter(function(t){
      if (f === "active" && t.done) return false;
      if (f === "done" && !t.done) return false;
      return !q || t.title.toLowerCase().indexOf(q) !== -1;
    });
    out.sort(function(a,b){
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (s === "priority") {
        if (RANK[a.priority] !== RANK[b.priority]) return RANK[a.priority] - RANK[b.priority];
        return (a.due || "9999") < (b.due || "9999") ? -1 : (a.due || "9999") > (b.due || "9999") ? 1 : a.created - b.created;
      }
      if (s === "due") return (a.due || "9999") < (b.due || "9999") ? -1 : (a.due || "9999") > (b.due || "9999") ? 1 : RANK[a.priority] - RANK[b.priority];
      return b.created - a.created;
    });
    return out;
  }

  function el(tag, cls, text){
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function render(){
    var list = $("list");
    list.innerHTML = "";
    var items = visible(), td = today();

    items.forEach(function(t){
      var li = el("li", "task " + t.priority + (t.done ? " done" : ""));
      var cb = el("input"); cb.type = "checkbox"; cb.checked = t.done;
      cb.setAttribute("aria-label", "Mark complete");
      cb.onchange = function(){ t.done = cb.checked; save(); render(); };

      var info = el("div", "info");
      info.appendChild(el("div", "title", t.title));
      var meta = el("div", "meta");
      var b = el("span", "badge " + t.priority, t.priority + " priority");
      meta.appendChild(b);
      if (t.due) {
        var late = !t.done && t.due < td;
        meta.appendChild(document.createTextNode(" \u2022 Due " + t.due));
        if (late) meta.appendChild(el("span", "overdue", " (overdue)"));
      }
      info.appendChild(meta);

      var sel = el("select"); sel.setAttribute("aria-label", "Change priority");
      ["High","Medium","Low"].forEach(function(p){
        var o = el("option", "", p); if (p === t.priority) o.selected = true; sel.appendChild(o);
      });
      sel.style.width = "auto";
      sel.onchange = function(){ t.priority = sel.value; save(); render(); };

      var del = el("button", "", "Delete");
      del.onclick = function(){ tasks = tasks.filter(function(x){ return x.id !== t.id; }); save(); render(); };

      li.appendChild(cb); li.appendChild(info); li.appendChild(sel); li.appendChild(del);
      list.appendChild(li);
    });

    if (!items.length) {
      var li = el("li", "empty", tasks.length ? "No tasks match this view." : "No tasks yet. Add your first task above.");
      list.appendChild(li);
    }

    var active = tasks.filter(function(t){ return !t.done; });
    var stats = $("stats"); stats.innerHTML = "";
    [
      ["High", active.filter(function(t){return t.priority==="High";}).length],
      ["Medium", active.filter(function(t){return t.priority==="Medium";}).length],
      ["Low", active.filter(function(t){return t.priority==="Low";}).length],
      ["Completed", tasks.length - active.length]
    ].forEach(function(s){
      var d = el("div", "stat"); d.appendChild(el("b", "", String(s[1]))); d.appendChild(el("span", "", s[0])); stats.appendChild(d);
    });
    $("count").textContent = active.length + " active of " + tasks.length;
  }

  $("addBtn").onclick = addTask;
  titleEl.addEventListener("keydown", function(e){ if (e.key === "Enter") addTask(); });
  ["search","filter","sort"].forEach(function(id){ $(id).addEventListener("input", render); });
  $("clearDone").onclick = function(){ tasks = tasks.filter(function(t){ return !t.done; }); save(); render(); };

  render();
})();
