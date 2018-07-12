const app = require('express')()
const port = process.env.PORT || 4000

app.use(require('body-parser').json())
app.use(require('morgan')(':remote-addr :method :url :status - :response-time ms'))
app.disable('etag')

app.get('/', (req, res) => {
  res
    .status(200)
    .send('Hello World!')
})

app.listen(port, () => {
  console.log(`Listening on port ${port}.`)
})
