import express = require("express");

// Create a new express app instance
const app: express.Application = express();

app.get("/", function (req, res) {
    res.send("yarra");
});

app.listen(5000, function () {
    console.log("App is listening on por");
});