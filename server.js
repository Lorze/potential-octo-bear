var express  = require('express');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var fs = require("fs");

var writeIndex = 0;
var maxImageCount = 10;
var dataSaved = false;

var statistics = null;
var faces = null;
loadData();

var urlencodedParser = bodyParser.urlencoded({ extended: true, limit: '1mb' });
var app = express ();
app.use(serveStatic(__dirname + '\\quiz\\'));

app.get('/getFace', function (req, res) {
	if(faces.length == 0){
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end(JSON.stringify({
			"file": "img/noImage.png",
			"archetype": Math.floor(Math.random() * 4)
		})); 
	}
	else {
		var keys = Object.keys(faces);
		var index = keys[Math.floor(keys.length * Math.random())];

		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end(JSON.stringify({
			"file": "faces/" + index + ".png",
			"archetype": faces[index]
		})); 
	}
})

app.post('/upload', urlencodedParser, function (req, res) {
	if(req.body.noWebcam){
		statistics[req.body.archetype] += 1;
	}
	else{
		var base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
		var path = "quiz/faces/" + writeIndex + ".png";

		if (fs.existsSync(path)) {
			fs.unlink(path, function(err) {
				writeFace(base64Data, path, req.body.archetype);
			});
		}
		else {
			writeFace(base64Data, path, req.body.archetype);
		}
	}

	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end(JSON.stringify(statistics));
})

app.listen(8000)

function writeFace(base64Data, path, archetype)
{
	fs.writeFile(path, base64Data, 'base64', function(err) {
		if(err)
			return;

		faces[writeIndex] = archetype;
		statistics[archetype] += 1;
		console.log("face " + writeIndex + " written -> " + JSON.stringify(statistics));

		writeIndex ++;
		writeIndex = writeIndex % 10;

		saveData();
	});
}

function loadData()
{
	fs.readFile('data.json', 'utf8', function (err, data) {
		if(err)
		{
			statistics = [0, 0, 0, 0];
			faces = [];
			writeIndex = 0;
		}
		else
		{
			data = JSON.parse(data);
			faces = data.faces;
			statistics = data.statistics;
			writeIndex = data.writeIndex;
		}
	});
}

function saveData(){
	if(faces != null && statistics != null)
	{
		fs.writeFile("data.json", JSON.stringify({
			"faces":faces,
			"statistics": statistics,
			"writeIndex": writeIndex
		}), function(err){
			if(err)
				console.log(err);
			else
				console.log("data saved");
		});
	}
}