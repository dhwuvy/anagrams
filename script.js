const letters = "ABCDEFGHIKLMNOPRSTUVWY"; // removed Q, Z, X
let tiles = [];
let dictionary = null;
let score = 0;

// Stopwatch variables
let timerInterval = null;
let secondsElapsed = 0;

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
      .filter(w => /^[A-Z]+$/.test(w));   
    dictionary = new Set(words);

    document.getElementById("status").textContent = "Dictionary loaded! Start playing! (Tip: Press Tab + Enter to reset tiles)";
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

  const sevenLetterWords = [...dictionary].filter(word => {
    if (word.length !== 7) return false;

    const counts = {};
    for (let char of word) {
      counts[char] = (counts[char] || 0) + 1;
      if (counts[char] > 2) return false;
    }

    const doubleCount = Object.values(counts).filter(c => c === 2).length;
    if (doubleCount > 1) return false;

    return true;
  });

  if (sevenLetterWords.length === 0) {
    console.error("No suitable words found under these constraints!");
    document.getElementById("status").textContent = "No words available for these rules!";
    return;
  }

  const chosenWord = sevenLetterWords[Math.floor(Math.random() * sevenLetterWords.length)];
  let lettersArray = [...chosenWord];
  const lastLetter = lettersArray.pop();

  for (let i = lettersArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lettersArray[i], lettersArray[j]] = [lettersArray[j], lettersArray[i]];
  }

  lettersArray.push(lastLetter);
  tiles = lettersArray;

  displayTiles();

  // Clear anagrams list if it exists
  const anagramsDiv = document.getElementById("anagramsList");
  if (anagramsDiv) anagramsDiv.innerHTML = "";

  // Start stopwatch
  startTimer();
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

// Stopwatch function
function startTimer() {
  clearInterval(timerInterval);
  secondsElapsed = 0;

  let timerEl = document.getElementById("timer");
  if (!timerEl) {
    timerEl = document.createElement("div");
    timerEl.id = "timer";
    timerEl.style.fontSize = "20px";
    timerEl.style.fontWeight = "bold";
    timerEl.style.color = "black";
    timerEl.style.margin = "8px 0";
    document.body.insertBefore(timerEl, document.getElementById("tiles"));
  }

  timerEl.textContent = `Time: 0s`;

  timerInterval = setInterval(() => {
    secondsElapsed++;
    timerEl.textContent = `Time: ${secondsElapsed}s`;
  }, 1000);
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

  const points = calculatePoints(word.length);
  const li = document.createElement("li");
  li.textContent = `${word} (+${points} pts)`;
  li.style.fontSize = "18px";
  li.style.fontWeight = "bold";
  foundList.appendChild(li);

  score += points;
  const scoreEl = document.getElementById("score");
  scoreEl.textContent = `Score: ${score}`;
  scoreEl.style.fontSize = "20px";
  scoreEl.style.fontWeight = "bold";

  messageDiv.textContent = `+${points} points for "${word}"!`;
  messageDiv.style.fontSize = "20px";
  messageDiv.style.fontWeight = "bold";
  messageDiv.style.color = "red";

  input.value = "";
});

// Show anagrams button
const showAnagramsBtn = document.createElement("button");
showAnagramsBtn.textContent = "Show Anagrams";
showAnagramsBtn.style.marginTop = "10px";
showAnagramsBtn.style.padding = "6px 10px";
showAnagramsBtn.style.fontSize = "16px";
showAnagramsBtn.style.cursor = "pointer";
document.body.appendChild(showAnagramsBtn);

const anagramsDiv = document.createElement("div");
anagramsDiv.id = "anagramsList";
anagramsDiv.style.marginTop = "8px";
anagramsDiv.style.maxWidth = "320px";
anagramsDiv.style.marginLeft = "auto";
anagramsDiv.style.marginRight = "auto";
document.body.appendChild(anagramsDiv);

showAnagramsBtn.addEventListener("click", () => {
  anagramsDiv.innerHTML = ""; // clear previous

  const tilesCopy = [...tiles];
  const validWords = [...dictionary].filter(word => {
    if (word.length < 3) return false;
    let tempTiles = [...tilesCopy];
    for (let char of word) {
      let index = tempTiles.indexOf(char);
      if (index === -1) return false;
      tempTiles.splice(index, 1);
    }
    return true;
  }).sort();

  if (validWords.length === 0) {
    anagramsDiv.textContent = "No valid anagrams found.";
    return;
  }

  validWords.forEach(word => {
    const wEl = document.createElement("div");
    wEl.textContent = word;
    wEl.style.fontSize = "18px";
    wEl.style.fontWeight = "bold";
    anagramsDiv.appendChild(wEl);
  });
});

// Tab + Enter to reset tiles, score, and found words
let tabPressed = false;
document.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    tabPressed = true;
    e.preventDefault();
  } else if (e.key === "Enter" && tabPressed) {
    e.preventDefault();

    generateTiles();

    score = 0;
    const scoreEl = document.getElementById("score");
    scoreEl.textContent = `Score: ${score}`;
    scoreEl.style.fontSize = "20px";
    scoreEl.style.fontWeight = "bold";

    document.getElementById("foundWords").innerHTML = "";
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = "";

    // clear anagrams list
    document.getElementById("anagramsList").innerHTML = "";

    const inputField = document.getElementById("wordInput");
    inputField.value = "";
    inputField.focus();

    tabPressed = false;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Tab") tabPressed = false;
});
