const { test, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const app = require("../src/app");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/productdb_test";
let server;
let base;

before(async () => {
  await mongoose.connect(MONGO_URI);
  await mongoose.connection.dropDatabase();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://localhost:${server.address().port}`;
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await new Promise((resolve) => server.close(resolve));
});

const json = (method, path, body) =>
  fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

test("GET /health returns ok", async () => {
  const res = await json("GET", "/health");
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.db, 1);
});

test("CRUD product flow", async () => {
  let res = await json("POST", "/products", {
    pid: 1,
    pname: "Laptop",
    price: 1500,
    quantity: 10,
  });
  assert.strictEqual(res.status, 201);

  res = await json("POST", "/products", {
    pid: 1,
    pname: "Dup",
    price: 1,
    quantity: 1,
  });
  assert.strictEqual(res.status, 409);

  res = await json("GET", "/products/1");
  assert.strictEqual((await res.json()).pname, "Laptop");

  res = await json("PUT", "/products/1", { price: 1400 });
  assert.strictEqual((await res.json()).price, 1400);

  res = await json("DELETE", "/products/1");
  assert.strictEqual(res.status, 200);

  res = await json("GET", "/products/1");
  assert.strictEqual(res.status, 404);
});
