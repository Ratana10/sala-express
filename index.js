const express = require('express')
const db = require("./models")
const app = express()
const port = 3000

db.sequelize
.authenticate()
.then(()=> console.log("Database connected successfully"))
.catch((err) => console.log("Unable connect to database", err))


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

const { Category } = require('./models')

app.use(express.json())

app.post("/api/v1/categories", async (req, res) => {
  // Business logic

  const name = req.body.name
  const isActive = req.body.isActive

 const created =  await Category.create({ name, isActive })

  res.json({
    message: "Category created successfully",
    data: created
  })
})

app.get("/api/v1/categories", async (req, res) => {

 const categories =  await Category.findAll()

  res.json({
    message: "Category fetched successfully",
    data: categories
  })
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
