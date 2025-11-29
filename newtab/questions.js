function getDepartementsQuestions() {
    var questions = [];
    for(var i = 0, l = departements.length; i < l; i++) {
        var question = document.createDocumentFragment();
        question.appendChild(document.createTextNode("Quel département a pour numéro "));
        var b = document.createElement("b");
        b.textContent = departements[i][0];
        question.appendChild(b);
        question.appendChild(document.createTextNode(" ?"));
        questions.push([departements[i][0], question, departements[i][1]]);
    }
    return questions
}
