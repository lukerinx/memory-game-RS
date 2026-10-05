"use strict";

// ==========================================
// 1. БАЗОВАЯ ФУНКЦИЯ СОЗДАНИЯ ЭЛЕМЕНТОВ
// ==========================================
function buildElement(tag, className = "", textContent = "") {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (textContent) element.textContent = textContent;

    return element;
}

// ==========================================
// 2. СОЗДАНИЕ МОДАЛЬНОГО ОКНА
// ==========================================
function createModal(titleText) {
    const overlay = buildElement("div", "modal-overlay hidden");
    const content = buildElement("div", "modal-content");
    const title = buildElement("h2", "modal-title", titleText);
    const body = buildElement("div", "modal-body");
    const actions = buildElement("div", "modal-actions");

    content.append(title, body, actions);
    overlay.append(content);
    document.body.append(overlay);

    return {
        overlay,
        content,
        title,
        body,
        actions
    };
}

function openModal(modal) {
    modal.overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeModal(modal) {
    modal.overlay.classList.add("hidden");

    const anotherModalIsOpen = document.querySelector(
        ".modal-overlay:not(.hidden)"
    );

    if (!anotherModalIsOpen) {
        document.body.style.overflow = "";
    }
}

// ==========================================
// 3. ГЕНЕРАЦИЯ ИНТЕРФЕЙСА
// ==========================================
const header = buildElement("header");

const logo = buildElement("img");
logo.src = "imgs/logo.jpg";
logo.alt = "Logo";

const statsDiv = buildElement("div", "stats-container");

const nicknameWrapper = buildElement("div", "nickname");
const nicknameLabel = buildElement("span", "", "AGENT: ");

const nicknameInput = buildElement("input");
nicknameInput.type = "text";
nicknameInput.value = "NEO";
nicknameInput.maxLength = 10;

nicknameInput.style.background = "transparent";
nicknameInput.style.color = "#00ff00";
nicknameInput.style.border = "none";
nicknameInput.style.borderBottom = "1px solid #00ff00";
nicknameInput.style.fontFamily = "inherit";
nicknameInput.style.fontSize = "1.2rem";
nicknameInput.style.width = "120px";
nicknameInput.style.outline = "none";
nicknameInput.style.cursor = "text";

nicknameWrapper.append(nicknameLabel, nicknameInput);

const pairsCounter = buildElement(
    "h3",
    "",
    "Pairs: 0 / 8"
);

const movesCounter = buildElement(
    "h3",
    "",
    "Moves: 0"
);

statsDiv.append(
    nicknameWrapper,
    pairsCounter,
    movesCounter
);

const timerDiv = buildElement("div", "timer");

const timerText = buildElement(
    "h2",
    "",
    "03:00"
);

timerDiv.append(timerText);

const nav = buildElement("nav");

const linkLeaderboard = buildElement(
    "a",
    "",
    "Leaderboard"
);

linkLeaderboard.href = "#";

const linkStartOver = buildElement(
    "a",
    "",
    "Start over"
);

linkStartOver.href = "#";

nav.append(
    linkLeaderboard,
    linkStartOver
);

header.append(
    logo,
    statsDiv,
    timerDiv,
    nav
);

document.body.append(header);

const cardsContainer = buildElement(
    "div",
    "cards"
);

document.body.append(cardsContainer);

// ==========================================
// 4. МОДАЛЬНЫЕ ОКНА
// ==========================================
const winModal = createModal(
    "THE SYSTEM IS HACKED!"
);

const winTitle = winModal.title;

const winText = buildElement(
    "p",
    "modal-text"
);

const btnNewGame = buildElement(
    "button",
    "modal-btn",
    "New Game"
);

const btnCloseWin = buildElement(
    "button",
    "modal-btn",
    "Close"
);

winModal.body.append(winText);

winModal.actions.append(
    btnNewGame,
    btnCloseWin
);

// ------------------------------------------

const leaderboardModal = createModal(
    "Leaderboard"
);

const lbHeader = buildElement(
    "div",
    "leaderboard-header"
);

const colAgent = buildElement(
    "span",
    "",
    "AGENT"
);

const colMoves = buildElement(
    "span",
    "",
    "MOVES"
);

const colDate = buildElement(
    "span",
    "",
    "DATE"
);

lbHeader.append(
    colAgent,
    colMoves,
    colDate
);

const lbList = buildElement(
    "div",
    "leaderboard-list"
);

const btnCloseLb = buildElement(
    "button",
    "modal-btn",
    "CLOSE"
);

leaderboardModal.body.append(
    lbHeader,
    lbList
);

leaderboardModal.actions.append(
    btnCloseLb
);

// ==========================================
// 5. СОСТОЯНИЕ ИГРЫ
// ==========================================
let moves = 0;
let pairsFound = 0;

let timerInterval = null;
let timeRemaining = 180;
let isTimerRunning = false;

let firstCard = null;
let secondCard = null;

let lockBoard = false;
let gameFinished = false;

let unmatchTimeout = null;
let unmatchAnimationTimeout = null;

const flipTimeouts = new Set();

const initialImages = [
    "imgs/CSS_CARD.jpg",
    "imgs/HTML_CARD.jpg",
    "imgs/JS_CARD.jpg",
    "imgs/React_CARD.jpg",
    "imgs/Node.js_CARD.jpg",
    "imgs/Neon_CARD.jpg",
    "imgs/Python_CARD.jpg",
    "imgs/GitHub_CARD.jpg"
];

let cardImages = [
    ...initialImages,
    ...initialImages
];

// ==========================================
// 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(
            Math.random() * (i + 1)
        );

        [array[i], array[j]] =
            [array[j], array[i]];
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(
        seconds / 60
    )
        .toString()
        .padStart(2, "0");

    const secondsLeft = (
        seconds % 60
    )
        .toString()
        .padStart(2, "0");

    return `${minutes}:${secondsLeft}`;
}

function clearAllGameTimers() {
    clearInterval(timerInterval);

    timerInterval = null;
    isTimerRunning = false;

    clearTimeout(unmatchTimeout);
    clearTimeout(unmatchAnimationTimeout);

    unmatchTimeout = null;
    unmatchAnimationTimeout = null;

    flipTimeouts.forEach(
        (timeoutId) => {
            clearTimeout(timeoutId);
        }
    );

    flipTimeouts.clear();
}

function startTimer() {
    if (
        isTimerRunning ||
        gameFinished
    ) {
        return;
    }

    isTimerRunning = true;

    timerInterval = setInterval(() => {
        timeRemaining--;

        timerText.textContent =
            formatTime(timeRemaining);

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);

            timerInterval = null;
            isTimerRunning = false;

            endGame(false);
        }
    }, 1000);
}

function resetBoard() {
    firstCard = null;
    secondCard = null;
    lockBoard = false;
}

function resetCardToBack(card) {
    if (!card) return;

    card.src = "imgs/CLOSE_CARD.jpg";

    card.classList.remove(
        "flip-animation"
    );
}

// ==========================================
// 7. ЛОГИКА КАРТОЧЕК
// ==========================================
function flipCard(event) {
    if (
        lockBoard ||
        gameFinished
    ) {
        return;
    }

    const clickedCard =
        event.currentTarget;

    if (
        clickedCard === firstCard ||
        clickedCard.classList.contains(
            "matched"
        )
    ) {
        return;
    }

    // Сразу блокируем следующие клики.
    lockBoard = true;

    startTimer();

    clickedCard.classList.add(
        "flip-animation"
    );

    const timeoutId = setTimeout(() => {
        flipTimeouts.delete(timeoutId);

        if (gameFinished) {
            return;
        }

        clickedCard.src =
            clickedCard.dataset.face;

        clickedCard.classList.remove(
            "flip-animation"
        );

        // Первая карточка
        if (!firstCard) {
            firstCard = clickedCard;

            lockBoard = false;

            return;
        }

        // Вторая карточка
        secondCard = clickedCard;

        moves++;

        movesCounter.textContent =
            `Moves: ${moves}`;

        checkForMatch();

    }, 150);

    flipTimeouts.add(timeoutId);
}

// ==========================================
// 8. ПРОВЕРКА ПАРЫ
// ==========================================
function checkForMatch() {
    const isMatch =
        firstCard.dataset.face ===
        secondCard.dataset.face;

    if (isMatch) {
        firstCard.classList.add(
            "matched"
        );

        secondCard.classList.add(
            "matched"
        );

        pairsFound++;

        pairsCounter.textContent =
            `Pairs: ${pairsFound} / 8`;

        resetBoard();

        // Победа
        if (pairsFound === 8) {
            clearInterval(
                timerInterval
            );

            timerInterval = null;
            isTimerRunning = false;

            saveResultToLocalStorage();

            endGame(true);

            return;
        }

        return;
    }

    // Несовпадение
    lockBoard = true;

    const firstMatchedAttempt =
        firstCard;

    const secondMatchedAttempt =
        secondCard;

    unmatchTimeout = setTimeout(() => {
        if (gameFinished) {
            return;
        }

        firstMatchedAttempt.classList.add(
            "flip-animation"
        );

        secondMatchedAttempt.classList.add(
            "flip-animation"
        );

        unmatchAnimationTimeout =
            setTimeout(() => {
                if (gameFinished) {
                    return;
                }

                resetCardToBack(
                    firstMatchedAttempt
                );

                resetCardToBack(
                    secondMatchedAttempt
                );

                unmatchAnimationTimeout =
                    null;

                unmatchTimeout = null;

                resetBoard();

            }, 150);

    }, 1000);
}

// ==========================================
// 9. ОКОНЧАНИЕ ИГРЫ
// ==========================================
function endGame(isWin) {
    gameFinished = true;
    lockBoard = true;

    if (isWin) {
        winTitle.textContent =
            "THE SYSTEM IS HACKED!";

        winTitle.style.color =
            "#00ff00";

        winText.textContent =
            `Agent ${
                nicknameInput.value
                    .trim()
                    .toUpperCase() ||
                "UNKNOWN"
            }, you found all matches in ${
                moves
            } moves!`;

    } else {
        winTitle.textContent =
            "TIME IS UP!";

        winTitle.style.color =
            "red";

        winText.textContent =
            `Game Over. You found ${
                pairsFound
            } out of 8 pairs.`;
    }

    openModal(winModal);
}

// ==========================================
// 10. LOCALSTORAGE
// ==========================================
function getLeaderboard() {
    try {
        return JSON.parse(
            localStorage.getItem(
                "memoryGameRS"
            )
        ) || [];

    } catch (error) {
        console.error(
            "Failed to read leaderboard:",
            error
        );

        return [];
    }
}

function saveResultToLocalStorage() {
    const date = new Date();

    const dateString =
        `${date.getDate()
            .toString()
            .padStart(2, "0")}.${(
            date.getMonth() + 1
        )
            .toString()
            .padStart(2, "0")}.${date.getFullYear()}`;

    const playerName =
        nicknameInput.value.trim() ||
        "UNKNOWN";

    const newResult = {
        name:
            playerName.toUpperCase(),

        moves: moves,

        date: dateString,

        timestamp: date.getTime()
    };

    const leaderboard =
        getLeaderboard();

    leaderboard.push(newResult);

    leaderboard.sort((a, b) => {
        if (a.moves !== b.moves) {
            return a.moves - b.moves;
        }

        return (
            a.timestamp -
            b.timestamp
        );
    });

    localStorage.setItem(
        "memoryGameRS",
        JSON.stringify(
            leaderboard.slice(0, 10)
        )
    );
}

// ==========================================
// 11. ОТОБРАЖЕНИЕ LEADERBOARD
// ==========================================
function renderLeaderboard() {
    lbList.textContent = "";

    const leaderboard =
        getLeaderboard();

    if (leaderboard.length === 0) {
        const emptyMsg =
            buildElement(
                "p",
                "modal-text",
                "No records found in the database."
            );

        lbList.append(emptyMsg);

        return;
    }

    leaderboard.forEach(
        (entry, index) => {
            const row =
                buildElement(
                    "div",
                    "leaderboard-item"
                );

            const nameSpan =
                buildElement(
                    "span",
                    "player-name",
                    `${index + 1}. ${entry.name}`
                );

            const movesSpan =
                buildElement(
                    "span",
                    "player-moves",
                    `${entry.moves}`
                );

            const dateSpan =
                buildElement(
                    "span",
                    "player-time",
                    `${entry.date}`
                );

            row.append(
                nameSpan,
                movesSpan,
                dateSpan
            );

            lbList.append(row);
        }
    );
}

// ==========================================
// 12. НОВАЯ ИГРА
// ==========================================
function initGame() {
    // Сначала отменяем вообще все
    // старые таймеры.
    clearAllGameTimers();

    gameFinished = false;

    moves = 0;
    pairsFound = 0;

    timeRemaining = 180;

    resetBoard();

    movesCounter.textContent =
        `Moves: ${moves}`;

    pairsCounter.textContent =
        `Pairs: ${pairsFound} / 8`;

    timerText.textContent =
        formatTime(timeRemaining);

    closeModal(winModal);
    closeModal(leaderboardModal);

    cardsContainer.textContent = "";

    cardImages = [
        ...initialImages,
        ...initialImages
    ];

    shuffle(cardImages);

    for (
        let i = 0;
        i < cardImages.length;
        i++
    ) {
        const cardImg =
            buildElement("img");

        cardImg.src =
            "imgs/CLOSE_CARD.jpg";

        cardImg.alt =
            "Memory Card";

        cardImg.dataset.face =
            cardImages[i];

        cardImg.addEventListener(
            "click",
            flipCard
        );

        cardsContainer.append(
            cardImg
        );
    }
}

// ==========================================
// 13. СОБЫТИЯ
// ==========================================
linkStartOver.addEventListener(
    "click",
    (event) => {
        event.preventDefault();

        initGame();
    }
);

btnNewGame.addEventListener(
    "click",
    () => {
        initGame();
    }
);

linkLeaderboard.addEventListener(
    "click",
    (event) => {
        event.preventDefault();

        renderLeaderboard();

        openModal(
            leaderboardModal
        );
    }
);

btnCloseWin.addEventListener(
    "click",
    () => {
        closeModal(winModal);
    }
);

btnCloseLb.addEventListener(
    "click",
    () => {
        closeModal(
            leaderboardModal
        );
    }
);

// ==========================================
// 14. ЗАКРЫТИЕ ПО ФОНУ
// ==========================================
[
    winModal,
    leaderboardModal
].forEach((modal) => {
    modal.overlay.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                modal.overlay
            ) {
                closeModal(modal);
            }
        }
    );
});

// ==========================================
// 15. ESCAPE
// ==========================================
window.addEventListener(
    "keydown",
    (event) => {
        if (event.key !== "Escape") {
            return;
        }

        if (
            !winModal.overlay.classList.contains(
                "hidden"
            )
        ) {
            closeModal(winModal);
        }

        if (
            !leaderboardModal.overlay.classList.contains(
                "hidden"
            )
        ) {
            closeModal(
                leaderboardModal
            );
        }
    }
);

// ==========================================
// 16. СТАРТ
// ==========================================
initGame();