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

  // Hide the Submit Word button in drag-and-drop mode
  const submitBtn = document.getElementById("submitWordBtn");
  if (submitBtn) submitBtn.style.display = "none";
}

// Attach button listeners
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("dragDropBtn");
  if (btn) btn.addEventListener("click", showDragDrop);

  const classicBtn = document.querySelector("button[onclick='showClassic()']");
  if (classicBtn) classicBtn.addEventListener("click", showClassic);

  // New Game button in Classic
  const newGameBtn = document.getElementById("newGameBtn");
  if (newGameBtn) newGameBtn.addEventListener("click", () => {
    if (window.generateTiles) window.generateTiles();
    document.getElementById("score").textContent = "Score: 0";
    document.getElementById("foundWords").innerHTML = "";
    document.getElementById("anagramsList").innerHTML = "";
    document.getElementById("message").textContent = "";
    document.getElementById("wordInput").value = "";
  });
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

      cell.appendChild(tile);
    }

    // Drop events for the cell
    cell.addEventListener("dragover", e => e.preventDefault());
    cell.addEventListener("drop", e => {
      if (draggedIndex === null) return;
      [board[draggedIndex], board[index]] = [board[index], board[draggedIndex]];
      draggedIndex = null;
      renderBoard();

      checkBoardForWords(); // automatically check for new words
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
  if (!dictionary) return;

  const foundList = document.getElementById("foundWordsDrag");
  let newWordsFound = [];

  function checkLine(line) {
    let start = 0;
    while (start < line.length) {
      if (!line[start]) { 
        start++;
        continue;
      }

      let end = start;
      while (end < line.length && line[end]) end++;

      const segment = line.slice(start, end);
      const word = segment.join(""); // full segment only

      // Only award points if the entire segment is a valid word
      if (dictionary.has(word) &&
          ![...foundList.children].some(div => div.textContent.split(' ')[0] === word) &&
          !newWordsFound.includes(word)) {
        newWordsFound.push(word);
      }

      start = end;
    }
  }

  // Horizontal check
  for (let r = 0; r < rows; r++) {
    const row = board.slice(r * cols, r * cols + cols);
    checkLine(row);
  }

  // Vertical check
  for (let c = 0; c < cols; c++) {
    const col = [];
    for (let r = 0; r < rows; r++) {
      col.push(board[r * cols + c]);
    }
    checkLine(col);
  }

  // Award points for newly found words
  newWordsFound.forEach(word => {
    const points = calculatePoints(word.length);
    scoreDrag += points;
    const wordDiv = document.createElement("div");
    wordDiv.textContent = `${word} (+${points} pts)`;
    foundList.appendChild(wordDiv);
  });

  // Update score if any new words found
  if (newWordsFound.length > 0) {
    document.getElementById("scoreDrag").textContent = `Score: ${scoreDrag}`;
  }
}

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

