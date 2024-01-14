const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.get("/", async function (request, response) {
  const allTodos = await Todo.getTodos();
  const duetoday = await Todo.dueToday();
  const overdue = await Todo.overDue();
  const duelater = await Todo.dueLater();
  // const completeditem = await Todo.completedItems()

  if (request.accepts("html")) {
    response.render("index", { allTodos, duetoday, overdue, duelater });
  } else {
    response.json({ allTodos, duetoday, overdue, duelater });
  }
});
app.use(express.static(path.join(__dirname, "public")));
app.get("/todos", async function (_request, response) {
  try {
    console.log("Processing list of all Todos ...");
    // FILL IN YOUR CODE HERE

    // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
    // Then, we have to respond with all Todos, like:
    // response.send(todos)
    const todos = await Todo.findAll();
    response.send(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    // const todo = await Todo.addTodo(request.body)
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  // FILL IN YOUR CODE HERE

  // First, we have to query our database to delete a Todo by ID.
  // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
  // response.send(true)
  try {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    const Itemdeleted = await Todo.destroy({
      where: {
        id: request.params.id,
      },
    });
    // eslint-disable-next-line no-unneeded-ternary
    response.send(Itemdeleted ? true : false);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;
