from flask import Flask, render_template, request, jsonify, session
import random
import os

app = Flask(__name__)

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

    # Score for the current word
    session["score"] = 0

    # Keep statistics across games
    if "total_score" not in session:
        session["total_score"] = 0

    if "games_played" not in session:
        session["games_played"] = 0


# =========================================================
# GET CURRENT GAME
# =========================================================

def get_game():

    required_keys = [
        "answer",
        "guessed_letters",
        "wrong_letters",
        "wrong_guesses",
        "score",
        "total_score",
        "games_played"
    ]

    missing_key = any(
        key not in session
        for key in required_keys
    )

    if missing_key:

        total_score = session.get(
            "total_score",
            0
        )

        games_played = session.get(
            "games_played",
            0
        )

        session.clear()

        session["total_score"] = total_score
        session["games_played"] = games_played

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


    # =====================================================
    # MASK WORD
    # =====================================================

    masked_word = ""

    for letter in answer:

        if letter in guessed_letters:

            masked_word += letter

        else:

            masked_word += "_"


    # =====================================================
    # GAME STATUS
    # =====================================================

    won = "_" not in masked_word

    lost = (
        wrong_guesses >= MAX_CHANCES
    )

    game_over = won or lost


    # =====================================================
    # WIN RATE
    # =====================================================

    games_played = session[
        "games_played"
    ]

    total_score = session[
        "total_score"
    ]

    if games_played > 0:

        win_rate = round(
            (
                total_score /
                games_played
            ) * 100
        )

    else:

        win_rate = None


    # =====================================================
    # RETURN GAME DATA
    # =====================================================

    return {

        "word":
            masked_word,

        "remaining_chances":
            max(
                0,
                MAX_CHANCES -
                wrong_guesses
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
            total_score,

        "games_played":
            games_played,

        "win_rate":
            win_rate,

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


    # =====================================================
    # VALIDATE LETTER
    # =====================================================

    if (
        len(letter) != 1
        or not letter.isalpha()
        or not letter.isascii()
    ):

        return jsonify({

            "message":
                "Please enter one valid letter."

        }), 400


    # =====================================================
    # MAKE SURE GAME EXISTS
    # =====================================================

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


    # =====================================================
    # ADD LETTER
    # =====================================================

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
    # CHECK WORD
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

        # Current word = 1 point
        session["score"] = 1

        # Total score = total words won
        session["total_score"] += 1

        # One completed game
        session["games_played"] += 1

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

        # No point for losing
        session["score"] = 0

        # Count completed game
        session["games_played"] += 1

        message = (
            "Game over! Better luck next time."
        )


    game = get_game()


    # =====================================================
    # RESPONSE
    # =====================================================

    return jsonify({

        "message":
            message,

        "game":
            game,

        "answer":
            answer
            if game["game_over"]
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

    # Keep statistics
    total_score = session.get(
        "total_score",
        0
    )

    games_played = session.get(
        "games_played",
        0
    )


    # Create new game
    session.clear()

    session["total_score"] = \
        total_score

    session["games_played"] = \
        games_played

    create_game()


    return jsonify({

        "game":
            get_game()

    })


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )
