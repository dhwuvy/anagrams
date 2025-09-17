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

// Generate N random letters with last letter fixed
function generateTiles() {
  if (!dictionary) return;

  const lengthInput = document.getElementById("wordLength");
  const targetLength = parseInt(lengthInput.value, 10);

  const candidateWords = [...dictionary].filter(word => {
    if (word.length !== targetLength) return false;

    // rules: no more than 2 of the same letter, at most one double
    const counts = {};
    for (let char of word) {
      counts[char] = (counts[char] || 0) + 1;
      if (counts[char] > 2) return false;
    }
    const doubleCount = Object.values(counts).filter(c => c === 2).length;
    if (doubleCount > 1) return false;

    return true;
  });

  if (candidateWords.length === 0) {
    console.error(`No suitable words found of length ${targetLength}!`);
    document.getElementById("status").textContent =
      `No words of length ${targetLength} available under these rules.`;
    return;
  }

  const chosenWord = candidateWords[Math.floor(Math.random() * candidateWords.length)];
  let lettersArray = [...chosenWord];
  const lastLetter = lettersArray.pop(); // keep last letter fixed

  for (let i = lettersArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lettersArray[i], lettersArray[j]] = [lettersArray[j], lettersArray[i]];
  }

  lettersArray.push(lastLetter);
  tiles = lettersArray;

  displayTiles();

  const anagramsDiv = document.getElementById("anagramsList");
  if (anagramsDiv) anagramsDiv.innerHTML = "";

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
  if (length < 3) return 0;

  if (length === 3) return 100;
  if (length === 4) return 400;
  if (length === 5) return 1200;

  // from 6 upwards, it's 1000 increments
  return (length - 3) * 1000;
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

  // Insert in score-sorted order
  let inserted = false;
  for (let existingLi of foundList.children) {
    const existingPoints = parseInt(existingLi.textContent.match(/\+(\d+) pts/)[1], 10);
    if (points > existingPoints) {
      foundList.insertBefore(li, existingLi);
      inserted = true;
      break;
    }
  }
  if (!inserted) foundList.appendChild(li);

  // Update score
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
  });

  // sort by points (highest first), then alphabetically
  validWords.sort((a, b) => {
    const scoreDiff = calculatePoints(b.length) - calculatePoints(a.length);
    if (scoreDiff !== 0) return scoreDiff;
    return a.localeCompare(b);
  });

  if (validWords.length === 0) {
    anagramsDiv.textContent = "No valid anagrams found.";
    return;
  }

  validWords.forEach(word => {
    const wEl = document.createElement("div");
    wEl.textContent = `${word} (+${calculatePoints(word.length)} pts)`;
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

// New Game button listener
document.getElementById("newGameBtn").addEventListener("click", () => {
  score = 0;
  document.getElementById("score").textContent = `Score: ${score}`;
  document.getElementById("foundWords").innerHTML = "";
  document.getElementById("message").textContent = "";
  document.getElementById("anagramsList").innerHTML = "";
  generateTiles();
});
