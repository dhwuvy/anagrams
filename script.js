const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let tiles = [];
let dictionary = null;

// Load dictionary from GitHub raw URL
fetch("https://raw.githubusercontent.com/dhwuvy/anagrams/main/words.txt")
  .then(response => {
    if (!response.ok) throw new Error("Failed to fetch dictionary");
    return response.text();
  })
  .then(text => {
    const words = text
      .replace(/^\uFEFF/, '')           // remove BOM if present
      .split(/\r?\n/)                   // handle CRLF or LF
      .map(w => w.trim().toUpperCase()) // remove spaces & convert to uppercase
      .filter(w => w.length > 0);       // ignore empty lines
    dictionary = new Set(words);
    document.getElementById("status").textContent = "Dictionary loaded! Start playing.";
    console.log("Dictionary loaded with", dictionary.size, "words");
    console.log("Does dictionary have 'RIP'?", dictionary.has("RIP"));
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

// Handle word submission
document.getElementById("wordForm").addEventListener("submit", e => {
  e.preventDefault();

  if (!dictionary) {
    alert("Dictionary still loading... please wait.");
    return;
  }

  const input = document.getElementById("wordInput");
  const word = input.value.trim().toUpperCase(); // convert input to uppercase

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
