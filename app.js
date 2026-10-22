const STORAGE_KEY = "task-grabber-state-v2";
const MAX_TASKS = 50;
const starterTasks = ["Reply to Alex's email", "Tidy my desktop", "Draft the project outline", "Take a 10-minute walk", "Book that dentist appointment"];
const colors = ["capsule-pink", "capsule-yellow", "capsule-mint", "capsule-orange", "capsule-blue"];
const icons = ["✦", "●", "♥", "◆", "★"];
const $ = selector => document.querySelector(selector);
const drawer = $("#taskDrawer"), onboarding = $("#onboarding"), rewardModal = $("#rewardModal"), streakModal = $("#streakModal");
let state = loadState();
let activeTask = null, selectedIndex = -1, isPlaying = false, capsuleClickTimer = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.tasks)) return { tasks: saved.tasks.slice(0, MAX_TASKS), wins: Number(saved.wins) || 0, tokens: Math.max(0, Number.isFinite(Number(saved.tokens)) ? Number(saved.tokens) : 5), streak: Math.max(1, Number.isFinite(Number(saved.streak)) ? Number(saved.streak) : 3), seen: Boolean(saved.seen) };
  } catch (_) { /* Start fresh when saved data is malformed. */ }
  return { tasks: [], wins: 0, tokens: 5, streak: 0, seen: false };
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function esc(value) { const node = document.createElement("div"); node.textContent = value; return node.innerHTML; }
function pilePlacement(index) {
  let row = 0, offset = index, rowSize = 10;
  while (offset >= rowSize) { offset -= rowSize; row++; rowSize = row % 2 ? 9 : 10; }
  const noise = index === 0 ? 0 : ((index * 17) % 9) - 4;
  const tilt = index === 0 ? 0 : ((index * 23) % 9) - 4;
  const verticalNoise = index === 0 ? 0 : ((index * 13) % 7) - 3;
  return { x: rowSize === 1 ? 50 : (offset / (rowSize - 1)) * 100 + noise, bottom: row * 25 + verticalNoise, tilt };
}
function render() {
  if (selectedIndex >= state.tasks.length) selectedIndex = -1;
  $("#taskCount").textContent = state.tasks.length;
  $("#winsCount").textContent = state.wins;
  $("#tokenCount").textContent = state.tokens;
  $("#streakCount").textContent = state.streak;
  $("#grabButton").innerHTML = selectedIndex === -1 ? `<span>↓</span> GRAB RANDOM` : `<span>↓</span> GRAB SELECTED`;
  $("#capsuleBed").innerHTML = state.tasks.length
    ? state.tasks.map((task, index) => { const pile = pilePlacement(index); return `<button class="capsule ${colors[index % colors.length]} ${index === selectedIndex ? "selected" : ""}" data-index="${index}" data-bottom="${pile.bottom}" style="left:${6 + pile.x * .88}%;--y:${pile.bottom}px;--tilt:${pile.tilt}deg" title="${esc(task)} — click to peek"><span>${icons[index % icons.length]}</span></button>`; }).join("")
    : `<div class="empty-machine">Add a task to stock the machine!</div>`;
  $("#taskList").innerHTML = state.tasks.length
    ? state.tasks.map((task, index) => `<div class="task-item" title="${esc(task)}"><span class="task-dot ${colors[index % colors.length]}"></span><span class="task-name" title="${esc(task)}">${esc(task)}</span><button class="delete-task" aria-label="Delete ${esc(task)}" data-index="${index}">×</button></div>`).join("")
    : `<p class="empty-list">Your machine is waiting for its first mission.</p>`;
  saveState();
}
function addTask(value) {
  const task = value.trim();
  if (!task) { showTaskError("Type a task before adding it."); return false; }
  if (state.tasks.includes(task)) { showTaskError("That task is already in the machine."); return false; }
  if (state.tasks.length >= MAX_TASKS) { showTaskError(`The machine is full at ${MAX_TASKS} tasks. Complete one to make room.`); return false; }
  state.tasks.push(task); state.seen = true; render(); return true;
}
function showTaskError(message = "") { $("#taskError").textContent = message; $("#taskError").classList.toggle("show", Boolean(message)); }
function showDrawer() { drawer.classList.add("open"); drawer.setAttribute("aria-hidden", "false"); setTimeout(() => $("#taskInput").focus(), 120); }
function hideDrawer() { drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); }
function closeReward() { rewardModal.classList.remove("show"); rewardModal.setAttribute("aria-hidden", "true"); }
function showStreakModal() { $("#streakModalCount").textContent = state.streak; streakModal.classList.add("show"); streakModal.setAttribute("aria-hidden", "false"); }
function closeStreakModal() { streakModal.classList.remove("show"); streakModal.setAttribute("aria-hidden", "true"); const badge = $(".streak"); badge.classList.remove("streak-celebrate"); requestAnimationFrame(() => badge.classList.add("streak-celebrate")); }
function choose(direction) {
  if (!state.tasks.length || isPlaying) return;
  selectedIndex = selectedIndex === -1 ? (direction > 0 ? 0 : state.tasks.length - 1) : (selectedIndex + direction + state.tasks.length) % state.tasks.length;
  render(); $("#machineHint").textContent = `Capsule ${selectedIndex + 1} selected — press ↓ to grab it.`;
}
function burst(x = innerWidth / 2, y = innerHeight / 2) {
  ["✦", "★", "●", "♥", "✦", "★"].forEach((shape, index) => {
    const particle = document.createElement("span"), angle = Math.PI * 2 * index / 6;
    particle.className = "particle"; particle.textContent = shape; particle.style.left = `${x}px`; particle.style.top = `${y}px`;
    particle.style.color = ["#ff4e91", "#ffd64d", "#6c45ef", "#42c9a5"][index % 4];
    particle.style.setProperty("--x", `${Math.cos(angle) * (70 + Math.random() * 75)}px`); particle.style.setProperty("--y", `${Math.sin(angle) * (55 + Math.random() * 90)}px`);
    document.body.append(particle); setTimeout(() => particle.remove(), 900);
  });
}
function rainConfetti() {
  ["✦", "●", "■", "♥", "◆", "★", "●", "■", "✦", "♥", "◆", "★"].forEach((shape, index) => {
    const piece = document.createElement("span");
    piece.className = "rain-confetti"; piece.textContent = shape;
    piece.style.left = `${5 + Math.random() * 90}%`; piece.style.animationDelay = `${index * 45}ms`;
    piece.style.color = ["#ff4e91", "#ffd64d", "#6c45ef", "#42c9a5", "#69ccff"][index % 5];
    document.body.append(piece); setTimeout(() => piece.remove(), 2100);
  });
}
function openReward(task, peek = false) {
  $("#rewardTask").textContent = task; $("#rewardTask").title = task;
  $("#rewardEyebrow").textContent = peek ? "A PREVIEW OF THIS CAPSULE" : "YOUR NEXT FOCUS TASK";
  $("#rewardCopy").textContent = peek ? "Take a look at what is inside, then decide whether you would like the claw to make it your next task." : "Give this one task your attention, then return to celebrate the progress you made.";
  $("#rewardActions").innerHTML = peek ? `<button class="done-button" id="peekClose">RETURN TO THE MACHINE</button>` : `<button class="done-button" id="doneButton">I COMPLETED IT <span>✓</span></button><button class="reroll-button" id="rerollButton">Choose a different task</button>`;
  rewardModal.classList.add("show"); rewardModal.setAttribute("aria-hidden", "false"); if (!peek) burst();
  if (peek) $("#peekClose").onclick = closeReward;
  else { $("#doneButton").onclick = completeTask; $("#rerollButton").onclick = () => { closeReward(); choose(1); play(); }; }
}
function play() {
  if (!state.tasks.length) return showDrawer();
  if (!state.tokens) { $("#machineHint").textContent = "All out of tokens — take a breather and come back tomorrow."; return; }
  const grabIndex = selectedIndex === -1 ? Math.floor(Math.random() * state.tasks.length) : selectedIndex;
  const rig = $("#clawRig"), box = $("#machineWindow"), selected = document.querySelector(`.capsule[data-index="${grabIndex}"]`);
  const selectedRect = selected.getBoundingClientRect(), boxRect = box.getBoundingClientRect(), task = state.tasks[grabIndex];
  const targetTop = Math.max(43, Math.min(160, 160 - Number(selected.dataset.bottom)));
  isPlaying = true; state.tokens--; $("#grabButton").disabled = $("#leftButton").disabled = $("#rightButton").disabled = true;
  rig.style.left = `${((selectedRect.left + selectedRect.width / 2 - boxRect.left) / boxRect.width) * 100}%`; $("#machineHint").textContent = "The claw has found its target and is carefully lowering toward the selected capsule."; saveState();
  setTimeout(() => { rig.style.top = `${targetTop}px`; rig.classList.add("grabbing"); }, 600);
  let flight;
  setTimeout(() => { flight = selected.cloneNode(true); flight.removeAttribute("style"); flight.className = `capsule ${colors[grabIndex % colors.length]} flying-capsule`; flight.style.left = `${selectedRect.left - boxRect.left + selectedRect.width / 2}px`; flight.style.top = `${selectedRect.top - boxRect.top + selectedRect.height / 2}px`; box.append(flight); selected.classList.add("picked-up"); setTimeout(() => { flight.style.left = `${((selectedRect.left + selectedRect.width / 2 - boxRect.left) / boxRect.width) * 100}%`; flight.style.top = `${targetTop + 115}px`; }, 30); $("#machineHint").textContent = "The capsule is safely in the claw and is heading toward the prize chute."; }, 1400);
  const chuteLeft = `${(86 / box.clientWidth) * 100}%`;
  setTimeout(() => { flight.className = `capsule ${colors[grabIndex % colors.length]} claw-payload`; rig.append(flight); }, 2050);
  setTimeout(() => { rig.style.top = "35px"; rig.style.left = chuteLeft; }, 2100);
  setTimeout(() => { flight.className = `capsule ${colors[grabIndex % colors.length]} dropping-capsule`; flight.style.left = chuteLeft; flight.style.top = "178px"; box.append(flight); requestAnimationFrame(() => { flight.style.top = `${box.clientHeight - 3}px`; }); box.classList.add("flash"); burst(boxRect.left + 86, boxRect.bottom - 40); }, 2850);
  setTimeout(() => { activeTask = task; $("#machineHint").textContent = "Your next task has arrived, ready for your full attention."; openReward(task); $("#grabButton").disabled = $("#leftButton").disabled = $("#rightButton").disabled = false; isPlaying = false; box.classList.remove("flash"); flight?.remove(); document.querySelectorAll(".picked-up").forEach(node => node.classList.remove("picked-up")); }, 3650);
}
function completeTask() {
  if (activeTask) {
    state.tasks = state.tasks.filter(task => task !== activeTask); state.wins++; state.tokens++; render();
    $("#winsCount").closest(".score-card").animate([{ transform: "scale(1)" }, { transform: "scale(1.18) rotate(-3deg)" }, { transform: "scale(1)" }], { duration: 520 });
    $("#winToast").classList.add("show"); rainConfetti(); setTimeout(() => $("#winToast").classList.remove("show"), 1600);
  }
  activeTask = null; closeReward(); $("#machineHint").textContent = "That task is complete. When you are ready, choose another capsule and continue building your momentum.";
}
$("#taskMenuButton").onclick = showDrawer; $("#closeDrawer").onclick = $("#drawerScrim").onclick = hideDrawer;
$("#clearTasks").onclick = () => { if (!state.tasks.length) return showTaskError("There are no tasks to clear."); state.tasks = []; selectedIndex = -1; render(); showTaskError("Task stash cleared."); };
$("#taskForm").onsubmit = event => { event.preventDefault(); if (addTask($("#taskInput").value)) { $("#taskInput").value = ""; showTaskError(); } };
$("#taskList").onclick = event => { if (event.target.matches(".delete-task")) { state.tasks.splice(Number(event.target.dataset.index), 1); render(); } };
$("#welcomeForm").onsubmit = event => { event.preventDefault(); if (addTask($("#welcomeInput").value)) onboarding.classList.remove("show"); };
$("#sampleButton").onclick = () => { state.tasks = [...starterTasks]; state.seen = true; render(); onboarding.classList.remove("show"); };
$("#capsuleBed").onclick = event => { const capsule = event.target.closest(".capsule"); if (!capsule || isPlaying) return; const index = Number(capsule.dataset.index); if (capsuleClickTimer) { clearTimeout(capsuleClickTimer); capsuleClickTimer = null; selectedIndex = index; render(); openReward(state.tasks[index], true); return; } capsuleClickTimer = setTimeout(() => { selectedIndex = selectedIndex === index ? -1 : index; render(); capsuleClickTimer = null; }, 450); };
$("#grabButton").onclick = play; $("#leftButton").onclick = () => choose(-1); $("#rightButton").onclick = () => choose(1); $("#rewardClose").onclick = closeReward; $("#streakModalClose").onclick = closeStreakModal;
document.addEventListener("keydown", event => { if (event.key === "Escape") { hideDrawer(); closeReward(); } if (onboarding.classList.contains("show") || rewardModal.classList.contains("show") || document.activeElement.matches("input")) return; if (event.key === "ArrowLeft") { event.preventDefault(); choose(-1); } if (event.key === "ArrowRight") { event.preventDefault(); choose(1); } if (event.key === "ArrowDown") { event.preventDefault(); play(); } });
render(); if (!state.seen) onboarding.classList.add("show"); else if (state.streak >= 1) showStreakModal();
