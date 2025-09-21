(() => {

// ================= Drag & Drop Game =================
const letters = "ABCDEFGHIKLMNOPRSTUVWY";
const rows = 9;
const cols = 8;
let board = Array(rows * cols).fill(null); // 72-cell board
let currentWord = "";
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
}

function showDragDrop() {
  document.getElementById("classicGame").style.display = "none";
  document.getElementById("dragDropGame").style.display = "block";
  generateTiles16();
}

// ---------- Drag & Drop Board ----------
function generateTiles16() {
  board.fill(null); // clear board
  const positions = Array.from({length: rows*cols}, (_, i) => i);
  shuffleArray(positions); // shuffle positions

  for (let i = 0; i < 16; i++) {
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    board[positions[i]] = randomLetter;
  }

  currentWord = "";
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
        e.dataTransfer.setDragImage(new Image(), 0, 0); // hide ghost
      });

      tile.addEventListener("click", () => {
        currentWord += tile.textContent;
        document.getElementById("currentWord").textContent = currentWord;
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
  if (length < 3) return 0;
  if (length === 3) return 100;
  if (length === 4) return 400;
  if (length === 5) return 1200;
  if (length === 6) return 2000;
  if (length === 7) return 3000;
  if (length === 8) return 4000;
  if (length === 9) return 5000;
  if (length === 10) return 6000;
  if (length === 11) return 7000;
  if (length === 12) return 8000;
  if (length === 13) return 9000;
  if (length === 14) return 10000;
  if (length === 15) return 11000;
  return 0;
}

// ---------- Submit Word ----------
document.getElementById("submitWordBtn").addEventListener("click", () => {
  if (!dictionary) return alert("Dictionary still loading...");
  if (currentWord.length < 3) return alert("Word must be at least 3 letters!");

  const word = currentWord.toUpperCase();
  if (!dictionary.has(word)) return alert("Not a valid word!");

  const foundList = document.getElementById("foundWordsDrag");
  if ([...foundList.children].some(div => div.textContent.split(' ')[0] === word)) return alert("Word already found!");

  const points = calculatePoints(word.length);
  scoreDrag += points;

  const wordDiv = document.createElement("div");
  wordDiv.textContent = `${word} (+${points} pts)`;
  foundList.appendChild(wordDiv);

  document.getElementById("scoreDrag").textContent = `Score: ${scoreDrag}`;
  currentWord = "";
  document.getElementById("currentWord").textContent = "";
});

// ---------- Reset Board ----------
document.getElementById("resetBoardBtn").addEventListener("click", generateTiles16);

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("dragDropBtn");
  if (btn) btn.addEventListener("click", showDragDrop);
});

// ---------- Utility ----------
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

})();
