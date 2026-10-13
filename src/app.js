const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const productSchema = new mongoose.Schema({
  pid: { type: Number, required: true, unique: true },
  pname: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0 },
});
const Product = mongoose.model('Product', productSchema);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState });
});

app.post('/products', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(err.code === 11000 ? 409 : 400).json({ error: err.message });
  }
});

app.get('/products', async (req, res) => {
  res.json(await Product.find());
});

app.get('/products/:pid', async (req, res) => {
  const product = await Product.findOne({ pid: req.params.pid });
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

app.put('/products/:pid', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { pid: req.params.pid },
      req.body,
      { returnDocument: 'after', runValidators: true }
    );
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/products/:pid', async (req, res) => {
  const product = await Product.findOneAndDelete({ pid: req.params.pid });
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = app;