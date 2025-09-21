(() => {

// ================= Drag & Drop Game =================
const letters = "ABCDEFGHIKLMNOPRSTUVWY";
const rows = 9;
const cols = 8;
let board = Array(rows * cols).fill(null); // 72-cell board
let scoreDrag = 0;
let draggedIndex = null;

// Shared dictionary
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
  if (window.showAnagramsUI) window.showAnagramsUI();
}

function showDragDrop() {
  document.getElementById("classicGame").style.display = "none";
  document.getElementById("dragDropGame").style.display = "block";
  if (window.hideAnagramsUI) window.hideAnagramsUI();
  generateTiles16();
}

// Attach button listeners
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("dragDropBtn");
  if (btn) btn.addEventListener("click", showDragDrop);

  const classicBtn = document.querySelector("button[onclick='showClassic()']");
  if (classicBtn) classicBtn.addEventListener("click", showClassic);
});

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
      tile.draggable = true;

      // Drag events
      tile.addEventListener("dragstart", e => {
        draggedIndex = index;
        e.dataTransfer.setDragImage(new Image(), 0, 0);
      });

      tile.addEventListener("click", () => {
        // No more currentWord accumulation
      });

      cell.appendChild(tile);
    }

    // Drop events for the cell
    cell.addEventListener("dragover", e => e.preventDefault());
    cell.addEventListener("drop", e => {
      if (draggedIndex === null) return;
      [board[draggedIndex], board[index]] = [board[index], board[draggedIndex]];
      draggedIndex = null;
      renderBoard();
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

// ---------- Submit Word ----------
document.getElementById("submitWordBtn").addEventListener("click", () => {
  if (!dictionary) return alert("Dictionary still loading...");

  const foundList = document.getElementById("foundWordsDrag");
  let newWordsFound = [];

  function checkLine(line) {
    const n = line.length;
    for (let len = 3; len <= Math.min(9, n); len++) {
      for (let start = 0; start <= n - len; start++) {
        const word = line.slice(start, start + len).join("");
        if (dictionary.has(word) &&
            ![...foundList.children].some(div => div.textContent.split(' ')[0] === word) &&
            !newWordsFound.includes(word)) {
          newWordsFound.push(word);
        }
      }
    }
  }

  // Check horizontally
  for (let r = 0; r < rows; r++) {
    const row = board.slice(r * cols, r * cols + cols).filter(Boolean);
    if (row.length) checkLine(row);
  }

  // Check vertically
  for (let c = 0; c < cols; c++) {
    let col = [];
    for (let r = 0; r < rows; r++) {
      const letter = board[r * cols + c];
      if (letter) col.push(letter);
    }
    if (col.length) checkLine(col);
  }

  if (newWordsFound.length === 0) return alert("No new words found!");

  // Award points for all found words
  newWordsFound.forEach(word => {
    const points = calculatePoints(word.length);
    scoreDrag += points;
    const wordDiv = document.createElement("div");
    wordDiv.textContent = `${word} (+${points} pts)`;
    foundList.appendChild(wordDiv);
  });

  document.getElementById("scoreDrag").textContent = `Score: ${scoreDrag}`;
});

// ---------- Reset Board ----------
document.getElementById("resetBoardBtn").addEventListener("click", generateTiles16);

// ---------- Utility ----------
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

})();
