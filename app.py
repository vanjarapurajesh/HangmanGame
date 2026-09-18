from flask import Flask, render_template, request, jsonify, session
import random
import os

app = Flask(__name__)

# Required for Flask sessions
app.secret_key = "hangman-secret-key-change-this"

MAX_CHANCES = 10


# =========================================================
# LOAD WORDS
# =========================================================

def load_words():

    file_path = os.path.join(
        app.root_path,
        "data",
        "words.txt"
    )

    try:

        with open(
            file_path,
            "r",
            encoding="utf-8"
        ) as file:

            words = [
                line.strip().lower()
                for line in file
                if line.strip().isalpha()
            ]

        if not words:
            raise ValueError("Word list is empty.")

        return words

    except Exception as error:

        print("WORD LIST ERROR:", error)

        return [
            "apple",
            "orange",
            "banana",
            "coconut",
            "pineapple"
        ]


WORDS = load_words()


# =========================================================
# CREATE NEW GAME
# =========================================================

def create_game():

    answer = random.choice(WORDS)

    session["answer"] = answer
    session["guessed_letters"] = []
    session["wrong_letters"] = []
    session["wrong_guesses"] = 0

    # Current word score
    session["score"] = 0

    # Total successfully completed words
    # DO NOT reset this when starting a new game.
    if "total_score" not in session:
        session["total_score"] = 0


# =========================================================
# GET CURRENT GAME
# =========================================================

def get_game():

    # Protect against old/incomplete sessions
    if (
        "answer" not in session
        or "guessed_letters" not in session
        or "wrong_letters" not in session
        or "wrong_guesses" not in session
        or "score" not in session
        or "total_score" not in session
    ):

        old_total = session.get(
            "total_score",
            0
        )

        session.clear()

        session["total_score"] = old_total

        create_game()


    answer = session["answer"]

    guessed_letters = session[
        "guessed_letters"
    ]

    wrong_letters = session[
        "wrong_letters"
    ]

    wrong_guesses = session[
        "wrong_guesses"
    ]

    masked_word = ""

    for letter in answer:

        if letter in guessed_letters:
            masked_word += letter

        else:
            masked_word += "_"


    won = "_" not in masked_word

    lost = (
        wrong_guesses >= MAX_CHANCES
    )

    game_over = won or lost


    return {
        "word": masked_word,

        "remaining_chances":
            max(
                0,
                MAX_CHANCES - wrong_guesses
            ),

        "word_length":
            len(answer),

        "wrong_letters":
            wrong_letters,

        "wrong_guesses":
            wrong_guesses,

        "guessed_letters":
            guessed_letters,

        "score":
            session["score"],

        "total_score":
            session["total_score"],

        "game_over":
            game_over,

        "won":
            won
    }


# =========================================================
# HOME
# =========================================================

@app.route("/")
def index():

    if "answer" not in session:

        create_game()

    else:

        # Make sure old sessions are valid
        get_game()

    return render_template(
        "index.html"
    )


# =========================================================
# GET GAME
# =========================================================

@app.route(
    "/api/game",
    methods=["GET"]
)
def api_game():

    if "answer" not in session:

        create_game()

    return jsonify(
        get_game()
    )


# =========================================================
# GUESS LETTER
# =========================================================

@app.route(
    "/api/guess",
    methods=["POST"]
)
def guess():

    data = request.get_json(
        silent=True
    ) or {}

    letter = str(
        data.get("letter", "")
    ).lower().strip()


    # Validate input
    if (
        len(letter) != 1
        or not letter.isalpha()
        or not letter.isascii()
    ):

        return jsonify({
            "message":
                "Please enter one valid letter."
        }), 400


    # Make sure game exists
    if "answer" not in session:

        create_game()


    answer = session["answer"]

    guessed_letters = session[
        "guessed_letters"
    ]


    # =====================================================
    # REPEATED GUESS
    # =====================================================

    if letter in guessed_letters:

        return jsonify({
            "message":
                f'"{letter.upper()}" was already guessed!',
            "game":
                get_game()
        })


    # Add guessed letter
    guessed_letters.append(
        letter
    )

    session["guessed_letters"] = \
        guessed_letters


    # =====================================================
    # CORRECT GUESS
    # =====================================================

    if letter in answer:

        message = (
            f'"{letter.upper()}" is correct!'
        )


    # =====================================================
    # WRONG GUESS
    # =====================================================

    else:

        session["wrong_guesses"] += 1

        session["wrong_letters"].append(
            letter
        )

        message = (
            f'"{letter.upper()}" is not in the word.'
        )


    # =====================================================
    # CHECK IF WORD IS COMPLETE
    # =====================================================

    masked_word = ""

    for character in answer:

        if character in session[
            "guessed_letters"
        ]:

            masked_word += character

        else:

            masked_word += "_"


    # =====================================================
    # PLAYER WON
    # =====================================================

    if "_" not in masked_word:

        # EXACTLY 1 POINT FOR COMPLETING WORD
        session["score"] = 1

        # Total score = total words won
        session["total_score"] += 1

        message = (
            "🎉 You completed the word! +1 point"
        )


    # =====================================================
    # PLAYER LOST
    # =====================================================

    elif (
        session["wrong_guesses"]
        >= MAX_CHANCES
    ):

        # No points for losing
        session["score"] = 0

        message = (
            "Game over! Better luck next time."
        )


    return jsonify({

        "message": message,

        "game": get_game(),

        "answer":
            answer
            if get_game()["game_over"]
            else None
    })


# =========================================================
# RESTART
# =========================================================

@app.route(
    "/api/restart",
    methods=["POST"]
)
def restart():

    # Save total score
    total_score = session.get(
        "total_score",
        0
    )

    # Create fresh game
    session.clear()

    session["total_score"] = \
        total_score

    create_game()

    return jsonify({
        "game": get_game()
    })


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )
