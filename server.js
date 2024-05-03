var express = require("express");
const axios = require("axios");
require("dotenv").config();
var app = express();
var bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var cors = require("cors");
const util = require("util");
var server = require("http").createServer(app);
var port = 443;
var io = require("socket.io")(server);
axios.defaults.headers.common["Authorization"] = process.env.SECRETCODE;
gameSocket = null;
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(__dirname + "/build"));
app.get("/*", function (req, res) {
    res.sendFile(__dirname + "/build/index.html", function (err) {
        if (err) {
            res.status(500).send(err);
        }
    });
});

server.listen(port, function () {
    console.log("server is running on " + port);
});

// Implement socket functionality
gameSocket = io.on("connection", function (socket) {
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });

    socket.on("bet info", async (req) => {
        console.log(req);
        var amount = req.amount;
        var betAmount = req.betAmount;
        var targetNum = req.targetNum;
        var randomNum = getRandomFloat();
        var betResult = [];
        console.log(randomNum);
        try {
            try {
                await axios.post(
                    process.env.PLATFORM_SERVER + "api/games/bet",
                    {
                        token: req.token,
                        amount: req.betAmount,
                    }
                );
            } catch {
                throw new Error("Bet Error!");
            }
            amount -= betAmount;
            if (targetNum < randomNum) {
                amount += betAmount * targetNum;

                try {
                    await axios.post(
                        process.env.PLATFORM_SERVER + "api/games/winlose",
                        {
                            token: req.token,
                            amount: betAmount * targetNum,
                            winState: true,
                        }
                    );
                } catch {
                    throw new Error("Can't find server!");
                }

                betResult = {
                    gameResult: true,
                    earnAmount: betAmount * targetNum,
                    randomNum: randomNum,
                    amount: amount,
                };
                socket.emit("bet result", betResult);
            } else {
                betResult = {
                    gameResult: false,
                    earnAmount: 0,
                    randomNum: randomNum,
                    amount: amount,
                };
                socket.emit("bet result", betResult);
            }
        } catch (err) {
            socket.emit("error message", { errMessage: err.message });
        }
    });

    console.log("socket connected: " + socket.id);
    socket.emit("connected", {});
});

const getRandomFloat = () => {
    var r = Math.random();
    r += 0.0001;
    return (1 / (1.0002 - r)).toFixed(2) + 1;
};
