const request = require('supertest')
const cheerio = require('cheerio')
const db = require('../models/index')
const app = require('../app')

let server, agent
function extractCsrfToken (res) {
  const $ = cheerio.load(res.text)
  return $('[name=_csrf]').val()
}

describe('Todo Application', function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true })
    server = app.listen(4000, () => {})
    agent = request.agent(server)
  })

  afterAll(async () => {
    try {
      await db.sequelize.close()
      await server.close()
    } catch (error) {
      console.log(error)
    }
  })

  test('Creates a todo and responds with json at /todos POST endpoint', async () => {
    const res = await agent.get('/')
    const csrfToken = extractCsrfToken(res)
    const response = await agent.post('/todos').send({
      title: 'Buy milk',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken
    })
    expect(response.statusCode).toBe(302)
  })
  test('Marks a todo with given ID as completed', async () => {
    // etFirst, create a to-do item

    let res = await agent.get('/')
    let csrfToken = extractCsrfToken(res)

    await agent.post('/todos').send({
      title: 'Buy groceries',
      dueDate: new Date().toISOString().split('T')[0],
      completed: false,
      _csrf: csrfToken
    })
    const status = false
    const groupedTodosResponse = await agent
      .get('/')
      .set('Accept', 'application/json')
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text)

    const dueTodayCount = parsedGroupedResponse.duetoday.length
    const latestTodo = parsedGroupedResponse.duetoday[dueTodayCount - 1]

    res = await agent.get('/')
    csrfToken = extractCsrfToken(res)

    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}/`)
      .send({
        _csrf: csrfToken,
        completed: true
      })
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text)
    expect(parsedUpdateResponse.completed).toBe(!status)
  })

  test('Deletes a todo with the given ID if it exists and sends a boolean response', async () => {
    // Initial GET request to retrieve CSRF token
    let res = await agent.get('/')
    let csrfToken = extractCsrfToken(res)

    // Create a new todo to be deleted
    await agent.post('/todos').send({
      title: 'Buy milk',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken
    })
    const groupedTodosResponse = await agent
      .get('/')
      .set('Accept', 'application/json')
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text)
    const dueTodayCount = parsedGroupedResponse.duetoday.length
    const latestTodo = parsedGroupedResponse.duetoday[dueTodayCount - 1]

    res = await agent.get('/')
    csrfToken = extractCsrfToken(res)
    const deleteResponse = await agent.delete(`/todos/${latestTodo.id}/`).send({
      _csrf: csrfToken
    })
    expect(deleteResponse.statusCode).toBe(200)
  })
})
