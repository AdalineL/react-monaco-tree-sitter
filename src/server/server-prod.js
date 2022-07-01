import path from "path";
import express from "express";
import { v4 as uuid } from "uuid";

const { spawn } = require("child_process");

const WebSocket = require("ws");

const app = express(),
  DIST_DIR = __dirname,
  HTML_FILE = path.join(DIST_DIR, "index.html");

app.use(express.static(DIST_DIR));

app.get("*", (req, res) => {
  res.sendFile(HTML_FILE);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening to ${PORT}....`);
  console.log("Press Ctrl+C to quit.");
});

const wss = new WebSocket.Server({ port: 3030 });

// wss.getUniqueID = function () {
//   function s4() {
//     return Math.floor((1 + Math.random()) * 0x10000)
//       .toString(16)
//       .substring(1);
//   }
//   return s4() + s4() + "-" + s4();
// };

var CLIENTS = [];
var id;

const messages = ["\n"];
wss.on("connection", (ws, req) => {
  // id = Math.random();
  // console.log("connection is established : " + id);
  // CLIENTS[id] = ws;
  // CLIENTS.push(ws);

  console.log("connected");
  console.log("Number of clients: ", wss.clients.size);

  const child = spawn("dotnet", [
    "/Users/jiayin/Downloads/formula-dotnet/Src/CommandLine/bin/Debug/net6.0/CommandLine.dll",
  ]);

  ws.send(JSON.stringify(messages));

  ws.on("message", (message) => {
    //save the variables to 'tmp_file.txt'
    var fs = require("fs");
    var stream = fs.createWriteStream("tmp_file.4ml");
    stream.once("open", function (fd) {
      stream.write(message);
      stream.end();
    });

    //send 'load file' to dotnet
    child.stdin.write(
      "load /Users/jiayin/Downloads/react-monaco-tree-sitter/tmp_file.4ml"
    );
    child.stdin.end();

    //receive the data from dotnet and save it to a tmp file
    child.stdout.on("data", (data) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          // if (CLIENTS[id] == ws) {
          client.send(JSON.stringify([data.toString()]));
          // }
        }

        // console.log("Client.ID: " + client.id);
      });
    });
  });

  ws.on("close", (ws) => {
    console.log("closed");
    console.log("Number of clients: ", wss.clients.size);
  });
});
