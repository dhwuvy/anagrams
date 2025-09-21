(() => {

// ================= Drag & Drop Game =================
const letters = "ABCDEFGHIKLMNOPRSTUVWY";
let tiles = [];
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
  tiles = [];
  for (let i = 0; i < 16; i++) {
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    tiles.push(randomLetter);
  }
  displayTileBoard();
  currentWord = "";
  document.getElementById("currentWord").textContent = "";
  document.getElementById("foundWordsDrag").innerHTML = "";
  scoreDrag = 0;
  document.getElementById("scoreDrag").textContent = `Score: ${scoreDrag}`;
}

function displayTileBoard() {
  const board = document.getElementById("tileBoard");
  board.innerHTML = "";
  const boardWidth = board.clientWidth;
  const boardHeight = board.clientHeight;

  tiles.forEach((letter, index) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.textContent = letter;
    tile.draggable = true;

    // Random initial position inside board
    tile.style.position = "absolute";
    tile.style.left = `${Math.random() * (boardWidth - 50)}px`;
    tile.style.top = `${Math.random() * (boardHeight - 50)}px`;

    // Drag functionality
    tile.addEventListener("dragstart", e => {
      draggedIndex = index;
      e.dataTransfer.setDragImage(new Image(), 0, 0); // hide default ghost
    });

    tile.addEventListener("dragend", e => {
      const rect = board.getBoundingClientRect();
      tile.style.left = `${e.clientX - rect.left - 25}px`;
      tile.style.top = `${e.clientY - rect.top - 25}px`;
    });

    // Click to add letter
    tile.addEventListener("click", () => {
      currentWord += tile.textContent;
      document.getElementById("currentWord").textContent = currentWord;
    });

    board.appendChild(tile);
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

})();

