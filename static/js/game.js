"use strict";

/* =========================================================
   ELEMENTS
========================================================= */

const wordElement =
    document.getElementById("word");

const mobileKeyboard =
    document.getElementById("mobile-keyboard");

const keyboardButtons =
    document.querySelectorAll(
        "#mobile-keyboard button"
    );

const chancesElement =
    document.getElementById("chances");

const wordLengthElement =
    document.getElementById("word-length");

const wrongLettersElement =
    document.getElementById("wrong-letters");

const messageElement =
    document.getElementById("message");

const scoreElement =
    document.getElementById("score");

const bestScoreElement =
    document.getElementById("best-score");

const gameResult =
    document.getElementById("game-result");

const resultIcon =
    document.getElementById("result-icon");

const resultTitle =
    document.getElementById("result-title");

const resultText =
    document.getElementById("result-text");

const answerElement =
    document.getElementById("answer");

const finalScoreElement =
    document.getElementById("final-score");

const restartButton =
    document.getElementById("restart-button");

const keyboardStatus =
    document.getElementById("keyboard-status");


/* =========================================================
   HANGMAN PARTS
========================================================= */

const bodyParts = [
    "head",
    "body",
    "left-arm",
    "right-arm",
    "left-leg",
    "right-leg"
];


/* =========================================================
   GAME STATE
========================================================= */

let gameFinished = false;

let submitting = false;

let guessedLetters = new Set();

let wrongLetters = new Set();


/* =========================================================
   DEVICE
========================================================= */

function isMobileDevice() {

    return window.matchMedia(
        "(max-width: 600px)"
    ).matches;

}


/* =========================================================
   KEYBOARD MODE
========================================================= */

function setupKeyboardMode() {

    if (isMobileDevice()) {

        mobileKeyboard.style.display =
            "flex";

        keyboardStatus.textContent =
            "ON-SCREEN KEYBOARD";

    } else {

        mobileKeyboard.style.display =
            "none";

        keyboardStatus.textContent =
            "PHYSICAL KEYBOARD";

    }

}


/* =========================================================
   BEST SCORE
========================================================= */

function getBestScore() {

    return Number(
        localStorage.getItem(
            "hangmanBestScore"
        ) || 0
    );

}


/* =========================================================
   SCORE
========================================================= */

function updateScore(score) {

    if (score > 0) {

        scoreElement.textContent =
            score;

    } else {

        scoreElement.textContent =
            "—";

    }


    const oldBest =
        getBestScore();


    if (score > oldBest) {

        localStorage.setItem(
            "hangmanBestScore",
            score
        );

    }


    const best =
        Math.max(
            score,
            oldBest
        );


    if (best > 0) {

        bestScoreElement.textContent =
            best;

    } else {

        bestScoreElement.textContent =
            "—";

    }

}


/* =========================================================
   LOAD GAME
========================================================= */

async function loadGame() {

    try {

        const response =
            await fetch(
                "/api/game",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load game."
            );

        }


        const game =
            await response.json();


        updateGame(
            game
        );


    } catch (error) {

        console.error(
            "LOAD ERROR:",
            error
        );


        showMessage(
            "Unable to connect to Flask."
        );

    }

}


/* =========================================================
   UPDATE GAME
========================================================= */

function updateGame(game) {

    renderWord(
        game.word
    );


    chancesElement.textContent =
        game.remaining_chances;


    wordLengthElement.textContent =
        game.word_length;


    renderWrongLetters(
        game.wrong_letters
    );


    updateHangman(
        game.wrong_guesses
    );


    updateKeyboard(
        game.guessed_letters,
        game.wrong_letters
    );


    updateScore(
        game.score
    );


    gameFinished =
        game.game_over;


    if (game.game_over) {

        showResult(
            game
        );

    } else {

        gameResult.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   RENDER WORD
========================================================= */

function renderWord(word) {

    wordElement.innerHTML = "";


    for (const letter of word) {

        const element =
            document.createElement(
                "span"
            );


        element.className =
            "word-letter";


        if (letter === "_") {

            element.textContent =
                "_";

            element.classList.add(
                "hidden-letter"
            );

        } else {

            element.textContent =
                letter.toUpperCase();

        }


        wordElement.appendChild(
            element
        );

    }

}


/* =========================================================
   WRONG LETTERS
========================================================= */

function renderWrongLetters(
    letters
) {

    if (
        !letters ||
        letters.length === 0
    ) {

        wrongLettersElement.textContent =
            "None";

        return;

    }


    wrongLettersElement.textContent =

        letters
            .map(
                letter =>
                    letter.toUpperCase()
            )
            .join(" • ");

}


/* =========================================================
   HANGMAN
========================================================= */

function updateHangman(
    wrongGuesses
) {

    const partsToShow =
        Math.ceil(
            (
                wrongGuesses / 10
            ) *
            bodyParts.length
        );


    bodyParts.forEach(
        (
            part,
            index
        ) => {

            const element =
                document.getElementById(
                    part
                );


            if (
                index < partsToShow
            ) {

                element.classList.add(
                    "visible"
                );

            } else {

                element.classList.remove(
                    "visible"
                );

            }

        }
    );

}


/* =========================================================
   UPDATE MOBILE KEYBOARD
========================================================= */

function updateKeyboard(
    guessed,
    wrong
) {

    guessedLetters =
        new Set(
            guessed || []
        );


    wrongLetters =
        new Set(
            wrong || []
        );


    keyboardButtons.forEach(
        button => {

            const letter =
                button.dataset.letter;


            button.classList.remove(
                "used",
                "correct",
                "wrong"
            );


            if (
                guessedLetters.has(
                    letter
                )
            ) {

                button.classList.add(
                    "used"
                );


                if (
                    wrongLetters.has(
                        letter
                    )
                ) {

                    button.classList.add(
                        "wrong"
                    );

                } else {

                    button.classList.add(
                        "correct"
                    );

                }

            }

        }
    );

}


/* =========================================================
   FAST MOBILE BUTTON FEEDBACK
========================================================= */

function markButtonImmediately(
    button,
    letter
) {

    /*
        React visually BEFORE Flask responds.
        This makes the keyboard feel instant.
    */

    button.classList.add(
        "used"
    );


    button.disabled =
        true;


    button.setAttribute(
        "aria-disabled",
        "true"
    );

}


/* =========================================================
   MOBILE KEYBOARD
========================================================= */

keyboardButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function(event) {

                event.preventDefault();


                if (
                    gameFinished ||
                    submitting
                ) {

                    return;

                }


                const letter =
                    button.dataset.letter;


                /*
                    Ignore already-used letters.
                */

                if (
                    guessedLetters.has(
                        letter
                    )
                ) {

                    return;

                }


                /*
                    INSTANT visual reaction.
                */

                markButtonImmediately(
                    button,
                    letter
                );


                submitGuess(
                    letter,
                    button
                );

            }
        );

    }
);


/* =========================================================
   DESKTOP PHYSICAL KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            isMobileDevice()
        ) {

            return;

        }


        if (
            gameFinished ||
            submitting
        ) {

            return;

        }


        if (
            event.ctrlKey ||
            event.altKey ||
            event.metaKey
        ) {

            return;

        }


        const letter =
            event.key.toLowerCase();


        if (
            /^[a-z]$/.test(
                letter
            )
        ) {

            event.preventDefault();


            if (
                guessedLetters.has(
                    letter
                )
            ) {

                return;

            }


            submitGuess(
                letter,
                null
            );

        }

    }
);


/* =========================================================
   SUBMIT GUESS
========================================================= */

async function submitGuess(
    letter,
    button
) {

    if (
        gameFinished
    ) {

        return;

    }


    /*
        Do NOT block the UI.
        Only prevent duplicate requests.
    */

    if (
        submitting
    ) {

        if (button) {

            button.disabled =
                false;

        }

        return;

    }


    submitting =
        true;


    /*
        Optimistically remember the letter.
        This makes repeated taps feel instant.
    */

    guessedLetters.add(
        letter
    );


    try {

        const response =
            await fetch(
                "/api/guess",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            letter:
                                letter
                        }),

                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );

        }


        const result =
            await response.json();


        if (
            result.message
        ) {

            showMessage(
                result.message
            );

        }


        /*
            Flask response updates the
            real game state.
        */

        if (
            result.game
        ) {

            updateGame(
                result.game
            );

        }


        if (
            result.answer
        ) {

            answerElement.textContent =
                result.answer.toUpperCase();

        }


    } catch (error) {

        console.error(
            "GUESS ERROR:",
            error
        );


        /*
            If request failed,
            allow the letter again.
        */

        guessedLetters.delete(
            letter
        );


        if (button) {

            button.disabled =
                false;

            button.classList.remove(
                "used"
            );

        }


        showMessage(
            "Connection error. Try again."
        );

    }


    submitting =
        false;

}


/* =========================================================
   RESULT
========================================================= */

function showResult(game) {

    gameResult.classList.remove(
        "hidden"
    );


    if (
        game.score > 0
    ) {

        finalScoreElement.textContent =
            game.score;

    } else {

        finalScoreElement.textContent =
            "—";

    }


    if (
        game.won
    ) {

        resultIcon.textContent =
            "🎉";

        resultTitle.textContent =
            "You Win!";

        resultText.textContent =
            "Excellent! You found the word.";

    } else {

        resultIcon.textContent =
            "💀";

        resultTitle.textContent =
            "Game Over";

        resultText.textContent =
            "You used all 10 chances.";

    }

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message
) {

    messageElement.textContent =
        message;

}


/* =========================================================
   RESTART
========================================================= */

restartButton.addEventListener(
    "click",
    async function() {

        if (
            submitting
        ) {

            return;

        }


        try {

            const response =
                await fetch(
                    "/api/restart",
                    {
                        method: "POST",
                        cache: "no-store"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Restart failed."
                );

            }


            const result =
                await response.json();


            gameFinished =
                false;


            submitting =
                false;


            guessedLetters.clear();

            wrongLetters.clear();


            keyboardButtons.forEach(
                button => {

                    button.disabled =
                        false;

                    button.classList.remove(
                        "used",
                        "correct",
                        "wrong"
                    );

                }
            );


            gameResult.classList.add(
                "hidden"
            );


            messageElement.textContent =
                "";


            updateGame(
                result.game
            );


        } catch (error) {

            console.error(
                "RESTART ERROR:",
                error
            );


            showMessage(
                "Unable to restart."
            );

        }

    }
);


/* =========================================================
   DEVICE MODE
========================================================= */

setupKeyboardMode();


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    setupKeyboardMode
);


/* =========================================================
   START
========================================================= */

loadGame();
