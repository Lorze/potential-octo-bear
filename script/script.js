var data;
var startsCreated = 0;

var started = false;
var pictureTaken = false;
var webcamAvailable = true;

var questionContainer = "";
var focusedElement = "";
var video = "";
var canvas = "";

$(document).ready(function() {
    questionContainer = document.body.getElementsByClassName("questionSlider")[0];
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");

    $.ajax({
        type: 'GET',
        url: 'data.json',
        dataType: 'json',
        success: initQuestions
    });

    initWebcam();
    initSnapping();

    for (i = 0; i < document.body.getElementsByClassName("startLine").length; i++) {
        startsCreated++;
        fillStartLine(i);
        randomMoves(i);
        startsCreated--;
    }

    document.getElementById("no").addEventListener("click", function() {
        if (checkFaded(this))
            return;

        canvas.style.display = "none";

        pictureTaken = false;
        changeFaded(this);
        changeFaded(document.getElementById("snap"));
    });

    document.getElementById("snap").addEventListener("click", function() {
        if (checkFaded(this))
            return;

        canvas.getContext("2d").drawImage(video, 0, 0, 640, 480);
        canvas.style.display = "block";

        document.getElementById("cnavas").getContext("2d").drawImage(video, 80, 0, 480, 480, 0, 0, 480, 480);

        pictureTaken = true;
        changeFaded(this);
        changeFaded(document.getElementById("no"));
    });

    document.getElementById("evaluateButton").addEventListener("click", function(e) {
        var warning = this.getElementsByClassName("warning")[0];
        warning.style.display = "";

        if (!evaluate()) {
            if(!pictureTaken){
                var video = document.getElementById("video");
                video.style.transition = "";
                video.style.boxShadow = "0px 0px 25px red";

                setTimeout(function() {
                    video.style.transition = "box-shadow 500ms ease";
                    video.style.boxShadow = "";
                }, 100);
            }
            else{
                warning.style.display = "block";
            }
            return;
        }

        $(document).unbind('scrollstop');
        document.body.style.overflow = '';
        questionContainer.style.marginLeft = (0 - (this.offsetLeft - $(window).scrollLeft() - parseInt(questionContainer.style.marginLeft) + this.offsetWidth)) + "px";
        document.body.getElementsByClassName("result")[0].style.marginLeft = '30px';
        e.stopPropagation();
    });

    document.getElementById("restartButton").addEventListener("click", function(e) {
        restart();
    });
});

$(window).on('beforeunload', function() {
    $(window).scrollLeft(0);
});

function restart() {
    location.reload();
}

function start() {
    var startContainer = document.getElementById("start");
    startContainer.style.marginLeft = (0 - startContainer.offsetWidth) + "px";

    started = true;
    document.body.style.overflow = "auto";
    questionContainer.style.marginLeft = (0 - questionContainer.children[0].offsetWidth) + "px";
}

function evaluate() {
    var archetypes = [];
    var answerElements = document.body.getElementsByClassName("selected");

    if (!pictureTaken || answerElements.length != data.evaluation.length)
        return false;

    for (var i = 0; i < answerElements.length; i++) {
        var question = answerElements[i].parentNode.dataset.question;
        var answer = answerElements[i].dataset.number;

        for (var f = 0; f < data.evaluation[question].answers[answer].length; f++)
            archetypes[f] = (archetypes[f] || 0) + data.evaluation[question].answers[answer][f];
    }

    var archetype = archetypes.indexOf(Math.max.apply(Math, archetypes));
    var ajaxData = { archetype: archetype };

    if (webcamAvailable) 
        ajaxData['image'] = document.getElementById("cnavas").toDataURL();
    else
        ajaxData['noWebcam'] = true;

    $.ajax({
        type: "POST",
        url: "upload",
        dataType: 'json',
        data: ajaxData,
        success: function(json) {
            initChart(json);

            setTimeout(function() {
                document.getElementById("archetype").innerText = data.archetypes[archetype].name;
                document.getElementById("unknownPicture").style.display = "none";
                switchArchetypeDescription(archetype);
            }, 2000);
        }
    });

    return true;
}

function fillStartLine(lineNumber) {
    var line = document.body.getElementsByClassName("startLine")[lineNumber];
    line.innerHTML = '';

    while (true) {
        var tile = createTile();

        if (line.children.length == 0)
            tile.style.marginTop = Math.floor(Math.random() * -120) + "px";

        line.appendChild(tile);

        if (tile.offsetTop + 400 > document.body.offsetHeight) {
            prependTile(lineNumber);
            return;
        }
    }
}

function randomMoves(lineNumber) {
    setTimeout(function() {
        if (!started)
            moveDown(lineNumber);

        randomMoves(lineNumber);
    }, Math.random() * 8000 + 12000);
}

function moveDown(lineNumber) {
    var line = document.body.getElementsByClassName("startLine")[lineNumber];
    for (var i = line.children.length; i < 2; i++)
        prependTile(lineNumber);

    var pixelsToMove = Math.floor(Math.random() * 80 + 100);
    var newMargin = pixelsToMove + (parseInt(line.children[1].style.marginTop) || 0);

    var lastChild = line.children[line.children.length - 1];
    if (lastChild.offsetTop + 200 + pixelsToMove > document.body.offsetHeight) {
        if (lastChild.getAttribute("class").indexOf("starting") >= 0)
            startsCreated--;

        line.removeChild(lastChild);
    }

    if (newMargin >= 0) {
        line.children[1].style.marginTop = "";

        setTimeout(function() {
            line.children[0].style.marginTop = (newMargin - 180) + "px";
            prependTile(lineNumber);
        }, 1000);
    } else {
        line.children[1].style.marginTop = newMargin + "px";
    }
}

function prependTile(lineNumber) {
    var line = document.body.getElementsByClassName("startLine")[lineNumber];
    var tile = createTile();

    tile.style.marginTop = "-180px";
    line.insertBefore(tile, line.children[0]);
}

function createTile() {
    var tile = document.createElement('div');
    tile.setAttribute('class', 'tile');

    var image = document.createElement('img');
    image.setAttribute('class', 'image');

    var text = document.createElement('div');
    text.setAttribute('class', 'profile');

    tile.appendChild(image);
    tile.appendChild(text);

    $.ajax({
        type: 'GET',
        url: 'getFace',
        dataType: 'json',
        success: function(json) {
            image.src = json.file;

            if (Math.random() * 10 <= 1 || startsCreated <= 1) {
                startsCreated++;
                text.innerText = "start >";
                tile.setAttribute('class', 'tile starting');

                tile.addEventListener("click", start);
            } else {
                text.innerText = data.archetypes[json.archetype].name;
            }
        }
    });

    return tile;
}

function initQuestions(json) {
    if (json.error !== undefined) {
        console.log(json.error);
        return;
    }

    var questionsWidth = 200;
    var webcam = questionContainer.children[1];
    var blu = [2, 1, 0, 1, 1, 3, 1, 0, 1, 3, 1];

    for (var i = 0; i < json.questions.length; i++) {
        var container = document.createElement('div');
        container.setAttribute('class', 'question faded');

        var title = document.createElement('h1');
        title.innerText = json.questions[i].title;
        container.appendChild(title);

        var answers = document.createElement('div');
        answers.setAttribute('class', 'answers');
        answers.dataset.question = i;
        container.appendChild(answers);

        questionContainer.insertBefore(container, webcam);

        for (var f = 0; f < json.questions[i].answers.length; f++) {
            var inner = document.createElement('div');
            inner.setAttribute('class', 'inner');
            inner.innerText = json.questions[i].answers[f];

            var answer = document.createElement('div');
            answer.setAttribute('class', 'answer');
            answer.dataset.number = f;
            answer.appendChild(inner);

            if (blu[i] == f)
                answer.setAttribute('class', 'answer selected');

            answers.appendChild(answer);
        }
        if(i == 0){
            focusedElement = container;
            container.className = "question";
        }
    }

    var questions = document.getElementsByClassName("question");
    for (var i = 0; i < questions.length; i++) {
        questions[i].dataset.position = i;
        questionsWidth += questions[i].offsetWidth;
    }
    document.getElementsByClassName("questionContainer")[0].style.width = questionsWidth + "px";

    $(".answer").click(function(e) {
        if (checkFaded(this.parentNode.parentNode) || !started)
            return;

        answers = this.parentNode.children;
        for (var i = 0; i < answers.length; i++)
            answers[i].className = answers[i].className.replace(" selected", "");

        this.className += " selected";
        e.stopPropagation();
    });

    $(".question").click(function(e) {
        if (!checkFaded(this) || !started)
            return;

        var endScroll = $(this).offset()['left'] - 300;
        $('html, body').animate({'scrollLeft': endScroll}, 500, 'swing');

        changeFaded(focusedElement);
        changeFaded(this);
        focusedElement = this;
    });

    data = json;
    initArchetypes();
}

function initArchetypes() {
    var container = document.getElementById("archetypeNav");

    for (var i = 0; i < data.archetypes.length; i++) {
        var name = document.createElement('h1');
        name.style.color = data.archetypes[i].color;
        name.innerText = data.archetypes[i].name;
        name.dataset.number = i;

        name.addEventListener("click", function(e) {
            switchArchetypeDescription(this.dataset.number);
        });

        container.appendChild(name);
    }

    var clear = document.createElement('div');
    clear.style.clear = "left";
    container.appendChild(clear);
}

function initChart(values) {
    var chartData = [];
    for (var i = 0; i < data.archetypes.length; i++) {
        chartData[i] = {};
        chartData[i].color = data.archetypes[i].color;
        chartData[i].highlight = data.archetypes[i].highlight;
        chartData[i].label = data.archetypes[i].name;

        if (!values)
            chartData[i].value = Math.floor(100 / data.archetypes.length);
        else
            chartData[i].value = values[i];
    }

    var chart = document.getElementById("chart");
    var ctx = chart.getContext("2d");
    ctx.clearRect(0, 0, chart.width, chart.height);

    window.myDoughnut = null;
    window.myDoughnut = new Chart(ctx).Doughnut(chartData);
}

function initSnapping(){
    $(document).scrollsnap({
        snaps: '.question',
        direction: 'x',
        proximity: 400,
        offset: -300,
        onSnap: function(element){
            element = element.get(0);
            if(checkFaded(element)){
                changeFaded(focusedElement);
                changeFaded(element);
                focusedElement = element;
            }
        }
    });
}

function checkFaded(element) {
    return element.className.indexOf("faded") >= 0;
}

function changeFaded(element) {
    if (checkFaded(element)) {
        $(element).removeClass("faded")
        return;
    }

    $(element).addClass("faded");
}

function switchArchetypeDescription(archetype) {
    var archetypes = document.getElementById("archetypeNav").children;

    for (var i = 1; i < archetypes.length; i++) {
        if (archetypes[i].dataset.number == archetype) {
            archetypes[0].parentNode.insertBefore(archetypes[i], archetypes[0]);
        }
    }

    document.getElementById("archetypeDescription").innerHTML = data.archetypes[archetype].description.replace(/\[newLine\]/g, "<br><br>");
}