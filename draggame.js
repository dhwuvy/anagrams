(() => {

// ================= Drag & Drop Game =================
const letters = "ABCDEFGHIKLMNOPRSTUVWY";
const rows = 9;
const cols = 8;
let board = Array(rows * cols).fill(null); // 72-cell board
let scoreDrag = 0;
let draggedIndex = null;

// Countdown Timer variables
let timerInterval = null;
let timeRemaining = 0;
let timerLocked = false;

// ---------- Shared dictionary ----------
let dictionary = null;
fetch("https://raw.githubusercontent.com/dhwuvy/anagrams/main/words.txt")
  .then(res => res.text())
  .then(text => {
    const words = text.replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map(w => w.trim().toUpperCase())
      .filter(w => /^[A-Z]+$/.test(w));
    dictionary = new Set(words);

    const status = document.getElementById("status");
    if (status) status.textContent = "Dictionary loaded! Start playing!";
  })
  .catch(err => console.error("Failed to load dictionary:", err));

// ---------- Mode Switching ----------
function showClassic() {
  document.getElementById("classicGame").style.display = "block";
  document.getElementById("dragDropGame").style.display = "none";
}

function showDragDrop() {
  document.getElementById("classicGame").style.display = "none";
  document.getElementById("dragDropGame").style.display = "block";
  generateTiles16();
}

// Attach button listeners
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("dragDropBtn");
  if (btn) btn.addEventListener("click", showDragDrop);

  const classicBtn = document.querySelector("button[onclick='showClassic()']");
  if (classicBtn) classicBtn.addEventListener("click", showClassic);

  // Reset Board button
  const resetBtn = document.getElementById("resetBoardBtn");
  if (resetBtn) resetBtn.addEventListener("click", generateTiles16);
});

// ---------- Enable/Disable Gameplay ----------
function setDragInputEnabled(enabled) {
  const tiles = document.querySelectorAll(".drag-tile");
  tiles.forEach(t => t.draggable = enabled);
  document.getElementById("submitWordBtn").disabled = !enabled;
  timerLocked = !enabled;
}

// ---------- Drag & Drop Board ----------
function generateTiles16() {
  board.fill(null);
  const positions = Array.from({length: rows*cols}, (_, i) => i);
  shuffleArray(positions);

  for (let i = 0; i < 16; i++) {
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    board[positions[i]] = randomLetter;
  }

  scoreDrag = 0;
  document.getElementById("currentWord").textContent = "";
  document.getElementById("foundWordsDrag").innerHTML = "";
  document.getElementById("scoreDrag").textContent = `Score: ${scoreDrag}`;
  renderBoard();

  // Enable gameplay and start countdown
  setDragInputEnabled(true);
  startCountdownDrag();
}

function renderBoard() {
  const boardEl = document.getElementById("tileBoard");
  boardEl.innerHTML = "";

  board.forEach((letter, index) => {
    const cell = document.createElement("div");
    cell.className = "cell";

    if (letter) {
      const tile = document.createElement("div");
      tile.className = "drag-tile";
      tile.textContent = letter;
      tile.dataset.index = index;
      tile.draggable = !timerLocked;

      // Drag events
      tile.addEventListener("dragstart", e => {
        if (timerLocked) { e.preventDefault(); return; }
        draggedIndex = index;
        e.dataTransfer.setDragImage(new Image(), 0, 0);
      });

      tile.addEventListener("touchstart", e => {
        if (timerLocked) { e.preventDefault(); return; }
        draggedIndex = index;
        e.preventDefault();
      });

      tile.addEventListener("touchend", e => {
        if (timerLocked) return;
        const touch = e.changedTouches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.classList.contains("drag-tile")) {
          const targetIndex = parseInt(target.dataset.index);
          [board[draggedIndex], board[targetIndex]] = [board[targetIndex], board[draggedIndex]];
          draggedIndex = null;
          renderBoard();
          checkBoardForWords();
        }
        e.preventDefault();
      });

      cell.appendChild(tile);
    }

    // Drop events
    cell.addEventListener("dragover", e => e.preventDefault());
    cell.addEventListener("drop", e => {
      if (timerLocked || draggedIndex === null) return;
      [board[draggedIndex], board[index]] = [board[index], board[draggedIndex]];
      draggedIndex = null;
      renderBoard();
      checkBoardForWords();
    });

    boardEl.appendChild(cell);
  });
}

// ---------- Points ----------
function calculatePoints(length) {
  switch(length) {
    case 3: return 100;
    case 4: return 400;
    case 5: return 800;
    case 6: return 1400;
    case 7: return 1800;
    case 8: return 2200;
    case 9: return 2600;
    default: return 0;
  }
}

// ---------- Automatic Word Checking ----------
function checkBoardForWords() {
  if (!dictionary || timerLocked) return;

  const foundList = document.getElementById("foundWordsDrag");
  let newWordsFound = [];

  function checkLine(line) {
    let start = 0;
    while (start < line.length) {
      if (!line[start]) { start++; continue; }

      let end = start;
      while (end < line.length && line[end]) end++;

      const segment = line.slice(start, end);
      const word = segment.join("");

      if (word.length >= 3 &&
          dictionary.has(word) &&
          ![...foundList.children].some(div => div.textContent.split(' ')[0] === word) &&
          !newWordsFound.includes(word)) {
        newWordsFound.push(word);
      }

      start = end;
    }
  }

  for (let r = 0; r < rows; r++) {
    const row = board.slice(r * cols, r * cols + cols);
    checkLine(row);
  }

  for (let c = 0; c < cols; c++) {
    const col = [];
    for (let r = 0; r < rows; r++) col.push(board[r * cols + c]);
    checkLine(col);
  }

  newWordsFound.forEach(word => {
    const points = calculatePoints(word.length);
    scoreDrag += points;
    const wordDiv = document.createElement("div");
    wordDiv.textContent = `${word} (+${points} pts)`;
    foundList.appendChild(wordDiv);
  });

  const wordDivs = Array.from(foundList.children);
  wordDivs.sort((a, b) => parseInt(b.textContent.split('(+')[1]) - parseInt(a.textContent.split('(+')[1]));
  foundList.innerHTML = "";
  wordDivs.forEach(div => foundList.appendChild(div));

  if (newWordsFound.length > 0) {
    document.getElementById("scoreDrag").textContent = `Score: ${scoreDrag}`;
  }
}

// ---------- Drag Countdown Timer ----------
function startCountdownDrag() {
  clearInterval(timerInterval);
  const timerValueSpan = document.getElementById("timerValueDrag");
  const timerInput = document.getElementById("timerInputDrag");
  let setTime = parseInt(timerInput.value, 10);
  if (isNaN(setTime) || setTime < 5) setTime = 30;

  timeRemaining = setTime;
  timerValueSpan.textContent = timeRemaining;
  timerLocked = false;
  setDragInputEnabled(true);

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerValueSpan.textContent = timeRemaining;

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerValueSpan.textContent = "0";
      setDragInputEnabled(false);
    }
  }, 1000);
}

// ---------- Utility ----------
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

})();
