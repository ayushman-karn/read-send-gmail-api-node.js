const fs = require("fs");
const { google } = require("googleapis");
const express = require("express");
const app = express();
const { unlink } = require("fs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

let authCode = "";

app.listen(3000, () => {
  console.log("listening on port 3000");
});

app.get("/", (req, res) => {
  unlink(__dirname + "/token.json", (err) => {
    if (err) console.error(err);
    else console.log("successfully deleted /token.json");
  });
  res.sendFile(__dirname + "/index.html");
});

app.post("/", (req, res) => {
  console.log(req.body);
  authCode = req.body.authCode;
  res.send("auth code recieved");
});

app.get("/send", (req, res) => {
  console.log(authCode);
  res.sendFile(__dirname + "/public/send.html");
});

app.post("/send", (req, res) => {
  console.log(req.body);
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), (auth) => {
      const gmail = google.gmail("v1");
      const raw = makeBody(
        req.body.Remail,
        req.body.Semail,
        "test subject",
        req.body.email
      );
      gmail.users.messages.send(
        {
          auth: auth,
          userId: "me",
          resource: {
            raw: raw,
          },
        },
        (err, res) => {
          if (err) console.log(err);
        }
      );
    });
  });
  res.redirect("/send");
});

const TOKEN_PATH = "token.json";

function getNewToken(oAuth2Client, callback) {
  oAuth2Client.getToken(authCode, (err, token) => {
    if (err) return console.error("Error retrieving access token", err);
    oAuth2Client.setCredentials(token);
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) return console.error(err);
      console.log("Token stored to", TOKEN_PATH);
    });
    callback(oAuth2Client);
  });
}

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function makeBody(to, from, subject, message) {
  const str = [
    'Content-Type: text/plain; charset="UTF-8"\n',
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    "to: ",
    to,
    "\n",
    "from: ",
    from,
    "\n",
    "subject: ",
    subject,
    "\n\n",
    message,
  ].join("");

  const encodedMail = Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return encodedMail;
}

//Function protos -
/*
function listLabels(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  gmail.users.labels.list(
    {
      userId: "me",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const labels = res.data.labels;
      if (labels.length) {
        console.log("Labels:");
        labels.forEach((label) => {
          console.log(`- ${label.name} : ${label.id}`);
        });
      } else {
        console.log("No labels found.");
      }
    }
  );
}

function findMessages(auth) {
  const gmail = google.gmail("v1");
  gmail.users.messages.list(
    {
      auth: auth,
      userId: "me",
      maxResults: 10,
      q: "",
    },
    (err, response) => {
      printMessage(response.data.messages, auth);
    }
  );
}

function printMessage(messageID, auth) {
  const gmail = google.gmail("v1");
  gmail.users.messages.get(
    {
      auth: auth,
      userId: "me",
      id: messageID[0].id,
    },
    (err, response) => {
      console.log(response.data.snippet);
      messageID.splice(0, 1);
      if (messageID.length > 0) printMessage(messageID, auth);
    }
  );
}

function makeBody(to, from, subject, message) {
  const str = [
    'Content-Type: text/plain; charset="UTF-8"\n',
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    "to: ",
    to,
    "\n",
    "from: ",
    from,
    "\n",
    "subject: ",
    subject,
    "\n\n",
    message,
  ].join("");

  const encodedMail = Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return encodedMail;
}

function sendMessage(auth) {
  const gmail = google.gmail("v1");
  const raw = makeBody(
    process.env.to,
    process.env.from,
    "test subject",
    "test message"
  );
  gmail.users.messages.send(
    {
      auth: auth,
      userId: "me",
      resource: {
        raw: raw,
      },
    },
    (err, res) => {
      if (err) console.log(err);
    }
  );
}
*/
