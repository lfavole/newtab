function getDepartementsQuestions() {
    var questions = [];
    for(var i = 0, l = departements.length; i < l; i++)
        questions.push(
            [
                `Quel département a pour numéro <b>${departements[i][0]}</b>&nbsp;?`,
                departements[i][1],
            ]
        )
    return questions
}
