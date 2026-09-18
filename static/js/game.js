"use strict";


/* =========================================================
   ELEMENTS
========================================================= */

const wordElement =
    document.getElementById("word");

const mobileKeyboard =
    document.getElementById(
        "mobile-keyboard"
    );

const keyboardButtons =
    document.querySelectorAll(
        "#mobile-keyboard button"
    );

const chancesElement =
    document.getElementById("chances");

const wordLengthElement =
    document.getElementById(
        "word-length"
    );

const wrongLettersElement =
    document.getElementById(
        "wrong-letters"
    );

const messageElement =
    document.getElementById("message");

const scoreElement =
    document.getElementById("score");

const totalScoreElement =
    document.getElementById(
        "total-score"
    );

const gameResult =
    document.getElementById(
        "game-result"
    );

const resultIcon =
    document.getElementById(
        "result-icon"
    );

const resultTitle =
    document.getElementById(
        "result-title"
    );

const resultText =
    document.getElementById(
        "result-text"
    );

const answerElement =
    document.getElementById("answer");

const finalScoreElement =
    document.getElementById(
        "final-score"
    );

const restartButton =
    document.getElementById(
        "restart-button"
    );

const keyboardStatus =
    document.getElementById(
        "keyboard-status"
    );


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

let guessedLetters =
    new Set();

let wrongLetters =
    new Set();


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
   SCORE
========================================================= */

function updateScore(
    score,
    totalScore
) {

    /*
        Current word:

        Win = 1
        Otherwise = —
    */

    if (score > 0) {

        scoreElement.textContent =
            score;

    } else {

        scoreElement.textContent =
            "—";
    }


    /*
        Total score:

        Number of words successfully
        completed by the player.
    */

    if (totalScore > 0) {

        totalScoreElement.textContent =
            totalScore;

    } else {

        totalScoreElement.textContent =
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


        updateGame(game);


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


    guessedLetters =
        new Set(
            game.guessed_letters || []
        );


    wrongLetters =
        new Set(
            game.wrong_letters || []
        );


    updateKeyboard();


    updateScore(
        game.score,
        game.total_score
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

function updateKeyboard() {

    keyboardButtons.forEach(
        button => {

            const letter =
                button.dataset.letter;


            button.classList.remove(
                "used",
                "correct",
                "wrong"
            );


            button.disabled =
                false;


            button.removeAttribute(
                "aria-disabled"
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
   REPEATED GUESS
========================================================= */

function repeatedGuess(
    letter
) {

    showMessage(
        `"${letter.toUpperCase()}" was already guessed!`
    );


    const button =
        document.querySelector(
            `[data-letter="${letter}"]`
        );


    if (button) {

        button.classList.remove(
            "repeat-shake"
        );


        void button.offsetWidth;


        button.classList.add(
            "repeat-shake"
        );

    }

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
                    gameFinished
                ) {

                    return;
                }


                const letter =
                    button.dataset.letter;


                if (
                    guessedLetters.has(
                        letter
                    )
                ) {

                    repeatedGuess(
                        letter
                    );

                    return;
                }


                if (
                    submitting
                ) {

                    return;
                }


                button.classList.add(
                    "used"
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
            gameFinished
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
            !/^[a-z]$/.test(
                letter
            )
        ) {

            return;
        }


        event.preventDefault();


        if (
            guessedLetters.has(
                letter
            )
        ) {

            repeatedGuess(
                letter
            );

            return;
        }


        if (
            submitting
        ) {

            return;
        }


        submitGuess(
            letter,
            null
        );

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
        gameFinished ||
        submitting
    ) {

        return;
    }


    submitting =
        true;


    /*
        Remember immediately to prevent
        duplicate requests.
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


        guessedLetters.delete(
            letter
        );


        if (button) {

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
   RESULT POPUP
========================================================= */

function showResult(game) {

    gameResult.classList.remove(
        "hidden"
    );


    /*
        Only a winning word gets 1 point.
    */

    if (
        game.won
    ) {

        finalScoreElement.textContent =
            "1";

        resultIcon.textContent =
            "🎉";

        resultTitle.textContent =
            "You Win!";

        resultText.textContent =
            "Excellent! You found the word.";

    } else {

        finalScoreElement.textContent =
            "—";

        resultIcon.textContent =
            "💀";

        resultTitle.textContent =
            "Game Over";

        resultText.textContent =
            "You used all 10 chances.";

    }


    /*
        Show answer when game finishes.
    */

    if (
        game.won ||
        game.game_over
    ) {

        /*
            The actual answer is returned
            separately by /api/guess.
        */

        fetchAnswer();

    }

}


/* =========================================================
   FETCH ANSWER AFTER GAME
========================================================= */

async function fetchAnswer() {

    try {

        const response =
            await fetch(
                "/api/game",
                {
                    cache: "no-store"
                }
            );


        const game =
            await response.json();


        /*
            The masked word cannot reveal
            the complete answer.

            The answer is already supplied
            by /api/guess when the game ends.
        */

    } catch (error) {

        console.error(
            "ANSWER ERROR:",
            error
        );

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
                        "wrong",
                        "repeat-shake"
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
   START GAME
========================================================= */

loadGame();
