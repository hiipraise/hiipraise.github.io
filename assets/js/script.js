/* script.js */

// NAV
(function initNav() {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");

  if (nav) {
    window.addEventListener("scroll", () =>
      nav.classList.toggle("scrolled", window.scrollY > 20),
    );
  }

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open);
    });
    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.classList.remove("open");
      });
    });
  }

  // Active link
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if (a.getAttribute("href") === current) a.classList.add("active");
  });
})();

//  SCROLL REVEAL
(function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  els.forEach((el) => observer.observe(el));
})();

//  TYPED HERO
(function initTyped() {
  const el = document.getElementById("typed-role");
  if (!el) return;
  const phrases = [
    "Full-Stack Product Engineer",
    "UI/UX Designer",
    "React / TypeScript Dev",
    "Open Source Builder",
  ];
  let phraseIdx = 0,
    charIdx = 0,
    deleting = false;

  function tick() {
    const phrase = phrases[phraseIdx];
    el.textContent = deleting
      ? phrase.slice(0, charIdx--)
      : phrase.slice(0, charIdx++);
    let delay = deleting ? 45 : 80;
    if (!deleting && charIdx > phrase.length) {
      delay = 1800;
      deleting = true;
    } else if (deleting && charIdx < 0) {
      deleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
      charIdx = 0;
      delay = 300;
    }
    setTimeout(tick, delay);
  }
  tick();
})();

//  ACADEMIC PLANNER
(function initPlanner() {
  const form = document.getElementById("task-form");
  if (!form) return;

  const taskInput = document.getElementById("task-input");
  const subjectInp = document.getElementById("task-subject");
  const dueInp = document.getElementById("task-due");
  const priorityInp = document.getElementById("task-priority");
  const noteInp = document.getElementById("task-note");
  const taskList = document.getElementById("task-list");
  const totalEl = document.getElementById("stat-total");
  const doneEl = document.getElementById("stat-done");
  const pendEl = document.getElementById("stat-pending");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const taskErr = document.getElementById("task-err");
  const subjectErr = document.getElementById("subject-err");

  let tasks = JSON.parse(localStorage.getItem("planner_tasks") || "[]");
  let filter = "all";

  function save() {
    localStorage.setItem("planner_tasks", JSON.stringify(tasks));
  }

  function updateStats() {
    const done = tasks.filter((t) => t.done).length;
    totalEl.textContent = tasks.length;
    doneEl.textContent = done;
    pendEl.textContent = tasks.length - done;
  }

  function renderTasks() {
    const visible = tasks.filter((t) => {
      if (filter === "pending") return !t.done;
      if (filter === "completed") return t.done;
      return true;
    });

    taskList.innerHTML = "";

    if (!visible.length) {
      taskList.innerHTML = `<div class="task-empty">No tasks here yet.<br>Add one using the form on the left.</div>`;
      updateStats();
      return;
    }

    visible.forEach((t) => {
      const item = document.createElement("div");
      item.className = "task-item" + (t.done ? " completed" : "");
      item.dataset.id = t.id;

      const dueText = t.due
        ? `<span class="task-due">
            <i data-lucide="calendar" style="width:11px;height:11px;stroke:var(--text-muted);"></i>
            ${new Date(t.due + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
           </span>`
        : "";
      const noteText = t.note
        ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.4rem;">${escapeHtml(t.note)}</p>`
        : "";

      item.innerHTML = `
        <div class="task-checkbox${t.done ? " checked" : ""}" role="checkbox"
             aria-checked="${t.done}" tabindex="0" data-action="toggle"></div>
        <div class="task-info">
          <div class="task-title">${escapeHtml(t.title)}</div>
          <div class="task-meta">
            <span class="task-subject">${escapeHtml(t.subject)}</span>
            ${dueText}
            <span class="task-priority ${t.priority}">${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}</span>
          </div>
          ${noteText}
        </div>
        <button class="task-delete" data-action="delete" title="Delete task" aria-label="Delete task">
          <i data-lucide="x"></i>
        </button>`;

      taskList.appendChild(item);
    });

    // Re-init Lucide icons for dynamically inserted elements
    if (window.lucide) lucide.createIcons();
    updateStats();
  }

  // Event delegation
  taskList.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    const id = parseInt(e.target.closest(".task-item")?.dataset.id);
    if (!id) return;
    if (action === "toggle") {
      const t = tasks.find((t) => t.id === id);
      if (t) {
        t.done = !t.done;
        save();
        renderTasks();
      }
    }
    if (action === "delete") {
      tasks = tasks.filter((t) => t.id !== id);
      save();
      renderTasks();
      showToast("Task deleted.");
    }
  });

  taskList.addEventListener("keydown", (e) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      e.target.classList.contains("task-checkbox")
    ) {
      e.preventDefault();
      e.target.click();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;
    if (!taskInput.value.trim()) {
      taskErr.style.display = "block";
      taskInput.classList.add("error");
      valid = false;
    } else {
      taskErr.style.display = "none";
      taskInput.classList.remove("error");
    }

    if (!subjectInp.value.trim()) {
      subjectErr.style.display = "block";
      subjectInp.classList.add("error");
      valid = false;
    } else {
      subjectErr.style.display = "none";
      subjectInp.classList.remove("error");
    }

    if (!valid) return;

    tasks.unshift({
      id: Date.now(),
      title: taskInput.value.trim(),
      subject: subjectInp.value.trim(),
      due: dueInp.value,
      priority: priorityInp.value,
      note: noteInp.value.trim(),
      done: false,
    });
    save();
    renderTasks();
    form.reset();
    showToast("Task added!");
  });

  taskInput.addEventListener("input", () => {
    if (taskInput.value.trim()) {
      taskErr.style.display = "none";
      taskInput.classList.remove("error");
    }
  });
  subjectInp.addEventListener("input", () => {
    if (subjectInp.value.trim()) {
      subjectErr.style.display = "none";
      subjectInp.classList.remove("error");
    }
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filter = btn.dataset.filter;
      renderTasks();
    });
  });

  renderTasks();
  updateStats();
})();

//  CONTACT FORM - Formspree AJAX
(function initContact() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const submitBtn = document.getElementById("submit-btn");
  const btnText = document.getElementById("btn-text");
  const btnSpinner = document.getElementById("btn-spinner");
  const formBody = document.getElementById("form-body");
  const formSuccess = document.getElementById("form-success");

  function setError(fieldId, errId, message, show) {
    const field = document.getElementById(fieldId);
    const err = document.getElementById(errId);
    if (!field || !err) return;
    if (show) {
      field.classList.add("error");
      err.textContent = message;
      err.style.display = "block";
    } else {
      field.classList.remove("error");
      err.style.display = "none";
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function isValidPhone(phone) {
    return /^[\d\s\-\+\(\)]{7,15}$/.test(phone);
  }

  function validate() {
    let valid = true;
    const name = document.getElementById("c-name").value.trim();
    const email = document.getElementById("c-email").value.trim();
    const phone = document.getElementById("c-phone").value.trim();
    const subj = document.getElementById("c-subject").value.trim();
    const msg = document.getElementById("c-message").value.trim();

    setError("c-name", "err-name", "Please enter your name.", !name);
    if (!name) valid = false;

    if (!email) {
      setError("c-email", "err-email", "Please enter your email.", true);
      valid = false;
    } else if (!isValidEmail(email)) {
      setError(
        "c-email",
        "err-email",
        "Please enter a valid email address.",
        true,
      );
      valid = false;
    } else {
      setError("c-email", "err-email", "", false);
    }

    if (phone && !isValidPhone(phone)) {
      setError("c-phone", "err-phone", "Phone must contain only digits.", true);
      valid = false;
    } else {
      setError("c-phone", "err-phone", "", false);
    }

    setError("c-subject", "err-subject", "Please enter a subject.", !subj);
    if (!subj) valid = false;

    setError("c-message", "err-message", "Please enter your message.", !msg);
    if (!msg) valid = false;

    return valid;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Loading state
    submitBtn.disabled = true;
    btnText.textContent = "Sending…";
    btnSpinner.classList.add("active");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        formBody.style.display = "none";
        formSuccess.style.display = "block";
        if (window.lucide) lucide.createIcons();
        showToast("Message sent successfully!");
      } else {
        const data = await response.json();
        const msg = data.errors
          ? data.errors.map((e) => e.message).join(", ")
          : "Something went wrong.";
        showToast(msg, "error");
      }
    } catch {
      showToast("Network error - please try again.", "error");
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = "Send Message";
      btnSpinner.classList.remove("active");
    }
  });

  // Inline clear on blur
  ["c-name", "c-email", "c-phone", "c-subject", "c-message"].forEach((id) => {
    const el = document.getElementById(id);
    if (el)
      el.addEventListener("blur", () => {
        if (el.value.trim()) {
          el.classList.remove("error");
          const errEl = document.getElementById("err-" + id.slice(2));
          if (errEl) errEl.style.display = "none";
        }
      });
  });
})();

//  TOAST
function showToast(msg, type = "success") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.borderLeftColor =
    type === "error" ? "var(--danger)" : "var(--success)";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}

//  UTILITY
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
