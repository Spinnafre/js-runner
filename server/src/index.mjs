import "dotenv/config";
import express from "express";
import { setTimeout } from "node:timers/promises";

import { exec } from "node:child_process";
import { Readable } from "node:stream";

import { promisify } from "node:util";

const port = process.env.PORT || 3333;

const app = express();

app.use(express.json());

app.use("*", (req, res, next) => {
  res.set("access-control-allow-origin", "*");
  res.set("access-control-allow-headers", "*");
  res.set("access-control-allow-methods", "*");
  next();
});

// app.use("/static", express.static(path.resolve("src", "public")));

// app.get("/", (req, res) => {
//   res.sendFile(path.resolve("src", "public", "index.html"));
// });

app.post("/add", async (req, res) => {
  const { command } = req.body;

  const controller = new AbortController();
  const { signal } = controller;
  try {
    const execPro = promisify(exec);
    const { stdout, stderr } = await execPro(
      `node -e ${JSON.stringify(command.trim())}`,
      {
        signal,
        shell: true,
      }
    );

    if (stderr) {
      return res.status(500).json({ error: stderr.toString() });
    }

    const readable = Readable.toWeb(Readable.from(stdout).setEncoding("utf-8"));

    res.setHeader("Transfer-Encoding", "chunked");

    readable.pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          await setTimeout(500);
          res.write(chunk.toString());
        },
        close() {
          res.end();
        },
      })
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Falha ao executar o comando" });
  }
});

app.listen(port, () => {
  console.info(`Server listening in ${port}`);
});

process.on("uncaughtException", (error) => {
  console.error("[Error] ", error);
  process.exit(1);
});

process.on("exit", (code) => {
  console.log("Server closed with signal ", code);
});
