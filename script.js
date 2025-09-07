const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let tiles = [];
let dictionary = null;

// Load dictionary from words.txt
fetch("words.txt")
  .then(response => response.text())
  .then(text => {
    dictionary = new Set(text.split("\n").map(w => w.trim().toUpperCase()));
    document.getElementById("status").textContent = "Dictionary loaded! Start playing.";
    console.log("Dictionary loaded with", dictionary.size, "words");
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
    tempTiles.splice(index, 1); // remove used letter
  }
  return true;
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

  if (word && canFormWord(word)) {
    if (dictionary.has(word)) {
      const foundList = document.getElementById("foundWords");

      // Prevent duplicates
      if (![...foundList.children].some(li => li.textContent === word)) {
        const li = document.createElement("li");
        li.textContent = word;
        foundList.appendChild(li);
      } else {
        alert("You already used that word!");
      }
    } else {
      alert("Not a valid Scrabble word!");
    }
  } else {
    alert("Invalid word! (uses letters not in tiles)");
  }

  input.value = "";
});

// Initialize game
generateTiles();

