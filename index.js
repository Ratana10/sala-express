const express = require('express')
const app = express()
const port = 3000
const products = [
  {
    id: 1,
    name: "Apple",
    price: 20,
    qty: 10,
  }
]
app.get('/', (req, res) => {
  res.send(products)
})

app.get("/products", (req, res) => {
  // Business logic

  res.send(products)
})

app.post("/products", (req, res) => {
  // Business logic

  res.send("Product created successfully")
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
