const letters = "ABCDEFGHIJKLMNOPRSTUVWY";
let tiles = [];
let dictionary = null;
let score = 0;

// Load dictionary from GitHub raw URL
fetch("https://raw.githubusercontent.com/dhwuvy/anagrams/main/words.txt")
  .then(response => {
    if (!response.ok) throw new Error("Failed to fetch dictionary");
    return response.text();
  })
  .then(text => {
    const words = text
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map(w => w.trim().toUpperCase())
      .filter(w => w.length > 0);
    dictionary = new Set(words);
    document.getElementById("status").textContent = "Dictionary loaded! Start playing!";
    console.log("Dictionary loaded with", dictionary.size, "words");
  })
  .catch(err => {
    console.error("Failed to load dictionary:", err);
    document.getElementById("status").textContent = "Failed to load dictionary!";
  });

// Generate 7 random letters
function generateTiles() {
  tiles = [];
  for (let i = 0; i < 7; i++) {
    let randomLetter = letters[Math.floor(Math.random() * letters.length)];
    tiles.push(randomLetter);
  }
  displayTiles();
}

// Display letter tiles
function displayTiles() {
  const tilesDiv = document.getElementById("tiles");
  tilesDiv.innerHTML = "";
  tiles.forEach(letter => {
    const tileEl = document.createElement("div");
    tileEl.className = "tile";
    tileEl.textContent = letter;
    tilesDiv.appendChild(tileEl);
  });
}

// Check if word can be formed from tiles
function canFormWord(word) {
  let tempTiles = [...tiles];
  for (let char of word.toUpperCase()) {
    let index = tempTiles.indexOf(char);
    if (index === -1) return false;
    tempTiles.splice(index, 1);
  }
  return true;
}

// Calculate points
function calculatePoints(length) {
  switch(length) {
    case 3: return 100;
    case 4: return 400;
    case 5: return 1200;
    case 6: return 2000;
    case 7: return 3000;
    default: return 0;
  }
}

// Handle word submission
document.getElementById("wordForm").addEventListener("submit", e => {
  e.preventDefault();

  if (!dictionary) {
    alert("Dictionary still loading... please wait.");
    return;
  }

  const input = document.getElementById("wordInput");
  const word = input.value.trim().toUpperCase();

  if (word.length < 3) {
    alert("Words must be at least 3 letters long!");
    input.value = "";
    return;
  }

  if (!canFormWord(word)) {
    alert("Invalid word! (uses letters not in tiles)");
    input.value = "";
    return;
  }

  if (!dictionary.has(word)) {
    alert("Not a valid Scrabble word!");
    input.value = "";
    return;
  }

  const foundList = document.getElementById("foundWords");
  if ([...foundList.children].some(li => li.textContent.startsWith(word))) {
    alert("You already used that word!");
    input.value = "";
    return;
  }

  // Add word to list
  const points = calculatePoints(word.length);
  const li = document.createElement("li");
  li.textContent = `${word} (+${points} pts)`;
  foundList.appendChild(li);

  // Update score
  score += points;
  document.getElementById("score").textContent = `Score: ${score}`;

  input.value = "";
});

// Initialize game
generateTiles();


