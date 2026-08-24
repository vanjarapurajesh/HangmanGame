"use strict";


// =========================================================
// ELEMENTS
// =========================================================

const wordElement =
    document.getElementById("word");

const chancesElement =
    document.getElementById("chances");

const wordLengthElement =
    document.getElementById("word-length");

const wrongLettersElement =
    document.getElementById("wrong-letters");

const messageElement =
    document.getElementById("message");

const progressBar =
    document.getElementById("progress-bar");

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

const guessInput =
    document.getElementById("guess-input");

const guessButton =
    document.getElementById("guess-button");


// =========================================================
// HANGMAN PARTS
// =========================================================

const bodyParts = [

    "head",

    "body",

    "left-arm",

    "right-arm",

    "left-leg",

    "right-leg"

];


// =========================================================
// GAME STATE
// =========================================================

let gameFinished = false;


// =========================================================
// BEST SCORE
// =========================================================

function getBestScore() {

    return Number(

        localStorage.getItem(
            "hangmanBestScore"
        ) || 0

    );

}


// =========================================================
// UPDATE SCORE
// =========================================================

function updateScore(score) {


    /*
        Never display 0.
    */

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


// =========================================================
// LOAD GAME
// =========================================================

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
                "Could not load game."
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
            "Unable to connect to the server."
        );

    }

}


// =========================================================
// UPDATE GAME
// =========================================================

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


    updateProgress(
        game
    );


    updateHangman(
        game.wrong_guesses
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


// =========================================================
// RENDER WORD
// =========================================================

function renderWord(word) {


    wordElement.innerHTML = "";


    for (
        const letter of word
    ) {


        const element =
            document.createElement(
                "span"
            );


        element.classList.add(
            "word-letter"
        );


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


// =========================================================
// WRONG LETTERS
// =========================================================

function renderWrongLetters(
    wrongLetters
) {


    if (

        !wrongLetters ||

        wrongLetters.length === 0

    ) {

        wrongLettersElement.textContent =
            "None";

        return;

    }


    wrongLettersElement.textContent =

        wrongLetters

            .map(
                letter =>
                    letter.toUpperCase()
            )

            .join(" • ");

}


// =========================================================
// PROGRESS BAR
// =========================================================

function updateProgress(game) {


    const percentage =

        (

            game.remaining_chances /

            game.max_wrong_guesses

        ) * 100;


    progressBar.style.width =
        `${percentage}%`;

}


// =========================================================
// HANGMAN
// =========================================================

function updateHangman(
    wrongGuesses
) {


    /*
        10 chances
        6 body parts
    */

    const partsToShow =

        Math.ceil(

            (

                wrongGuesses /

                10

            ) * bodyParts.length

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


// =========================================================
// SUBMIT GUESS
// =========================================================

async function submitGuess() {


    if (gameFinished) {

        return;

    }


    const letter =
        guessInput.value
            .trim()
            .toLowerCase();


    /*
        Only one alphabetic character.
    */

    if (

        letter.length !== 1 ||

        !/^[a-z]$/.test(letter)

    ) {


        showMessage(
            "Enter one letter."
        );


        guessInput.value = "";


        /*
            Keep focus on mobile.
        */

        guessInput.focus();


        return;

    }


    /*
        Disable controls while
        request is being processed.
    */

    guessInput.disabled = true;

    guessButton.disabled = true;


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

                            letter: letter

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


        console.log(
            "GUESS RESULT:",
            result
        );


        /*
            Show message.
        */

        showMessage(
            result.message
        );


        /*
            Update game.
        */

        if (result.game) {

            updateGame(
                result.game
            );

        }


        /*
            Show answer only after
            game finishes.
        */

        if (result.answer) {

            answerElement.textContent =

                result.answer.toUpperCase();

        }


    } catch (error) {


        console.error(
            "GUESS ERROR:",
            error
        );


        showMessage(
            "Something went wrong. Check Flask."
        );


    } finally {


        /*
            Clear input.
        */

        guessInput.value = "";


        guessInput.disabled =
            false;

        guessButton.disabled =
            false;


        /*
            Very important for mobile:
            return focus to the input.

            This means the user can continue
            typing without reopening the field.
        */

        if (!gameFinished) {

            guessInput.focus();

        }

    }

}


// =========================================================
// GUESS BUTTON
// =========================================================

guessButton.addEventListener(

    "click",

    function() {

        submitGuess();

    }

);


// =========================================================
// ENTER KEY
// =========================================================

guessInput.addEventListener(

    "keydown",

    function(event) {


        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            submitGuess();

        }

    }

);


// =========================================================
// INPUT CLEANUP
// =========================================================

guessInput.addEventListener(

    "input",

    function() {


        /*
            Keep only the latest A-Z character.
        */

        let value =
            guessInput.value
                .toLowerCase();


        value =
            value.replace(
                /[^a-z]/g,
                ""
            );


        if (value.length > 1) {

            value =
                value.slice(-1);

        }


        guessInput.value =
            value;

    }

);


// =========================================================
// RESULT POPUP
// =========================================================

function showResult(game) {


    gameResult.classList.remove(
        "hidden"
    );


    if (game.score > 0) {

        finalScoreElement.textContent =
            game.score;

    } else {

        finalScoreElement.textContent =
            "—";

    }


    if (game.won) {


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


// =========================================================
// RESTART
// =========================================================

restartButton.addEventListener(

    "click",

    async function() {


        try {


            const response =
                await fetch(

                    "/api/restart",

                    {

                        method: "POST",

                        cache:
                            "no-store"

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


            gameResult.classList.add(
                "hidden"
            );


            messageElement.textContent =
                "";


            updateGame(
                result.game
            );


            /*
                Focus input.

                On desktop this is immediate.

                On mobile, the user can tap the
                input if the browser doesn't reopen
                the keyboard automatically after
                the popup button click.
            */

            guessInput.focus();


        } catch (error) {


            console.error(
                "RESTART ERROR:",
                error
            );


            showMessage(
                "Unable to restart the game."
            );

        }

    }

);


// =========================================================
// MESSAGE
// =========================================================

function showMessage(
    message
) {

    messageElement.textContent =
        message;

}


// =========================================================
// START
// =========================================================

loadGame();
