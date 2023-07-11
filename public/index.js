function formatData() {
  let msg = "";

  return new TransformStream({
    transform(chunk, controller) {
      const items = chunk.split("\n");

      items.slice(0, -1).forEach((item) => controller.enqueue(item));

      msg += items[items.length - 1];
    },
    flush(controller) {
      if (!msg) return;
      controller.enqueue(msg);
    },
  });
}

function appendToHTML(element) {
  return new WritableStream({
    write(data) {
      element.value += data + "\n";
    },
    abort(reason) {
      console.log("aborted**", reason);
    },
  });
}

function resetInput(input) {
  input.value = "";
}

const outputArea = document.getElementById("output");
const inputArea = document.getElementById("input-area");

const form = document.querySelector("#form");
let abortController = new AbortController();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  resetInput(outputArea);

  const msg = inputArea.value;

  const data = await fetch("http://localhost:3333/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      command: msg,
    }),
    signal: abortController.signal,
  });

  if (data.status >= 400 && data.status <= 500) {
    outputArea.value = "Erro ao executar o script 😔";
    const error = await data.json();
    alert(error.error);
    return;
  }
  data.body
    .pipeThrough(new TextDecoderStream("utf-8"))
    .pipeThrough(formatData())
    .pipeTo(appendToHTML(outputArea), {
      signal: abortController.signal,
    });
});

const resetBtn = document.getElementById("btn-reset");

resetBtn.addEventListener("click", (event) => {
  event.preventDefault();

  resetInput(outputArea);
  resetInput(inputArea);
});
