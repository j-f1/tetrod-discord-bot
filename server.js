const express = require("express");
const app = express();
const port = process.env.PORT;
const { encrypt, decrypt } = require("./crypto");
const puppeteer = require("puppeteer");

let screenshot;

// ex: /?token=yW--sHWMTP80cCYbyu01KA==&token_iv=C5eSwdMxVPA4nIpGAthyLg==&id=LN88YRtw0Dc3pM/Wf3OKiQ==&id_iv=LJB4OrN5kzZrNqkfKyQmTw==
app.get("/", async (req, res) => {
  const { name } = req.query;
  if (!name) {
    res.status(400).send("Invalid request");
    return;
  }
  const start = Date.now()

  // const { token: encryptedToken, token_iv, id: encryptedId, id_iv } = req.query;
  // if (!encryptedToken || !token_iv || !encryptedId || !id_iv) {
  //   res.send(400, "Invalid request");
  //   return;
  // }
  // const [token, id] = await Promise.all([
  //   decrypt(encryptedToken, token_iv),
  //   decrypt(encryptedId, id_iv)
  // ]);

  console.log("boot", (Date.now() - start) / 1000);
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    defaultViewport: {
    width: 1200,
    height: 1200
    }
  });
  console.log("launch", (Date.now() - start) / 1000);
  const page = await browser.newPage();
  const snap = async () => {
    // screenshot = await page.screenshot();
    // console.log("snap");
  };

  page.goto("https://jstris.jezevec10.com/");
  await snap();
  await page
    .waitForSelector("#lobby")
    .then(el => el.click());
  console.log("lobby", (Date.now() - start) / 1000);
  await snap();
  await page
    .waitForSelector("#createRoomButton")
    .then(el => el.click());
  console.log("createRoom", (Date.now() - start) / 1000);
  await snap();
  await page.evaluate(name => {
    document.getElementById("roomName").value = name;
  }, name);
  console.log("setName", (Date.now() - start) / 1000);
  await snap();
  await page.click("#isPrivate");
  console.log("private", (Date.now() - start) / 1000);
  await snap();
  await page.waitForTimeout(250);
  await page.click("#create");
  console.log("create", (Date.now() - start) / 1000);
  await snap();
  const roomLink = await page
    .waitForSelector(".joinLink")
    .then(el => el.evaluate(node => node.textContent));
  await snap();
  console.log("done in", Date.now() - start);

  await browser.close();
  res.send({ success: true, link: roomLink });

  // res.send(`Token: ${token}, ID: ${id}`);
});

app.get("/screenshot", (req, res) => {
  res.header("Content-Type", "image/png");
  res.send(screenshot);
});
app.get("/encrypt", async (req, res) => {
  const { token, id } = req.query;
  if (!token || !id) {
    res.send(400, "Invalid request");
    return;
  }
  const [[encryptedToken, tokenIv], [encryptedId, idIv]] = await Promise.all(
    [token, id].map(encrypt)
  );
  res.send(
    `/?token=${encryptedToken}&token_iv=${tokenIv}&id=${encryptedId}&id_iv=${idIv}`
  );
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
