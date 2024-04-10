window.modules = window.modules || {};
modules.flashcards = function() {
    var flashcardContainer = document.createElement("div");
    flashcardContainer.className = "flashcard";

    var questionContainer = document.createElement("div");
    questionContainer.className = "question-container";

    var questionText = document.createElement("span");
    questionText.className = "question";

    var showAnswer = document.createElement("input");
    showAnswer.type = "button";
    showAnswer.className = "show-answer";
    showAnswer.value = "→";

    var answerContainer = document.createElement("div");
    answerContainer.className = "answer-container";

    var answerText = document.createElement("span");
    answerText.className = "answer";

    var closeQuestion = document.createElement("input");
    closeQuestion.type = "button";
    closeQuestion.className = "close-question";
    closeQuestion.value = "×";

    questionContainer.appendChild(questionText);
    questionContainer.appendChild(showAnswer);

    answerContainer.appendChild(answerText);
    answerContainer.appendChild(closeQuestion);

    flashcardContainer.appendChild(questionContainer);
    flashcardContainer.appendChild(answerContainer);

    document.querySelector("main").appendChild(flashcardContainer);

    var allQuestions = getDepartementsQuestions();
    function getRandomQuestion() {
        return allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }
    function getQuestion(newQuestion = false) {
        if(!newQuestion) {
            try {
                var question = localStorage.getItem("question");
                if(question) return JSON.parse(question);
            } catch(err) {}
        }
        return getRandomQuestion();
    }
    function updateQuestion(newQuestion = false) {
        var question = getQuestion(newQuestion);

        localStorage.setItem("question", JSON.stringify(question));

        flashcardContainer.classList.remove("revealed");
        questionText.innerHTML = question[0];
    }
    showAnswer.addEventListener("click", () => {
        answerText.innerHTML = getQuestion()[1];
        flashcardContainer.classList.add("revealed");
    });
    closeQuestion.addEventListener("click", () => {
        updateQuestion(true);
    });
    updateQuestion();
};