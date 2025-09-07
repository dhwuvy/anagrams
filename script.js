const letters = "ABCDEFGHIKLMNOPRSTUVWY"; // removed Q, Z, X
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
      .replace(/^\uFEFF/, '')              // remove BOM
      .split(/\r?\n/)                      // split lines
      .map(w => w.trim().toUpperCase())    // clean and uppercase
      .filter(w => /^[A-Z]+$/.test(w));   // only letters
    dictionary = new Set(words);

    document.getElementById("status").textContent = "Dictionary loaded! Start playing!";
    console.log("Dictionary loaded with", dictionary.size, "words");

    // ✅ Generate tiles only after dictionary is ready
    generateTiles();
  })
  .catch(err => {
    console.error("Failed to load dictionary:", err);
    document.getElementById("status").textContent = "Failed to load dictionary!";
  });

// Generate 7 random letters with last letter fixed
function generateTiles() {
  if (!dictionary) return;

  // Get all 7-letter words from dictionary
  const sevenLetterWords = [...dictionary].filter(word => word.length === 7);
  const chosenWord = sevenLetterWords[Math.floor(Math.random() * sevenLetterWords.length)];

  // Split word into letters
  let lettersArray = [...chosenWord];

  // Remove last letter
  const lastLetter = lettersArray.pop();

  // Shuffle the remaining letters
  for (let i = lettersArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lettersArray[i], lettersArray[j]] = [lettersArray[j], lettersArray[i]];
  }

  // Put the last letter back
  lettersArray.push(lastLetter);

  tiles = lettersArray;

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

  const input = document.getElementById("wordInput");
  const messageDiv = document.getElementById("message");
  const word = input.value.trim().toUpperCase();

  if (!dictionary) {
    messageDiv.textContent = "Dictionary still loading... please wait.";
    input.value = "";
    return;
  }

  if (word.length < 3) {
    messageDiv.textContent = "Words must be at least 3 letters long!";
    input.value = "";
    return;
  }

  if (!canFormWord(word)) {
    messageDiv.textContent = "Invalid word! (uses letters not in tiles)";
    input.value = "";
    return;
  }

  if (!dictionary.has(word)) {
    messageDiv.textContent = "Not a valid Scrabble word!";
    input.value = "";
    return;
  }

  const foundList = document.getElementById("foundWords");
  if ([...foundList.children].some(li => li.textContent.split(' ')[0] === word)) {
  messageDiv.textContent = "You already used that word!";
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

  // Show success message
  messageDiv.textContent = `+${points} points for "${word}"!`;

  input.value = "";
});
