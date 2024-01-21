const express = require('express')
var csrf = require('tiny-csrf')
const app = express()
const { Todo, User } = require('./models')
const bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
const path = require('path')
const flash = require('connect-flash')

const passport = require('passport')
const connectEnsureLogin = require('connect-ensure-login')
const session = require('express-session')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt')

const saltRounds = 10
app.use(bodyParser.json())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser('shh! some secret string'))
app.use(csrf('this_should_be_32_character_1234', ['POST', 'PUT', 'DELETE']))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(flash())

app.use(session({
  secret: 'my-super-secret-key-2344534532',
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}))
app.use(function (request, response, next) {
  response.locals.messages = request.flash()
  next()
})
app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, (username, password, done) => {
  User.findOne({ where: { email: username } })
    .then(async (user) => {
      const result = await bcrypt.compare(password, user.password)
      if (result) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Invalid password' })
      }
    })
    .catch((error) => {
      return (error)
    })
}))
passport.serializeUser((user, done) => {
  console.log('Serializing user in session', user.id)
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then(user => {
      done(null, user)
    })
    .catch(error => {
      done(error, null)
    })
})

app.get('/', async function (request, response) {
  response.render('index', {
    title: 'Todo application',
    csrfToken: request.csrfToken()
  })
})
app.get('/', connectEnsureLogin.ensureLoggedIn, (request, response) => {
  response.redirect('/todos')
})
app.get('/todos', connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  const loggedInUser = request.user.id
  const allTodos = await Todo.getTodos(loggedInUser)
  const duetoday = await Todo.dueToday(loggedInUser)
  const overdue = await Todo.overDue(loggedInUser)
  const duelater = await Todo.dueLater(loggedInUser)
  const completeditem = await Todo.completedItems(loggedInUser)

  if (request.accepts('html')) {
    response.render('todo', {
      allTodos,
      duetoday,
      overdue,
      duelater,
      completeditem,
      csrfToken: request.csrfToken()
    })
  } else {
    response.json({ allTodos, duetoday, overdue, duelater, completeditem })
  }
})
app.get('/signup', (request, response) => {
  if (request.isAuthenticated()) {
    response.redirect('/todos')
  } else {
    response.render('signup', { title: 'Signup', csrfToken: request.csrfToken() })
  }
})
app.get('/todos', async function (_request, response) {
  try {
    console.log('Processing list of all Todos ...')
    // FILL IN YOUR CODE HERE

    // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
    // Then, we have to respond with all Todos, like:
    // response.send(todos)
    const todos = await Todo.findAll()
    response.json(todos)
  } catch (error) {
    console.log(error)
    return response.status(500).json(error)
  }
})

app.get('/todos/:id', async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id)
    return response.json(todo)
  } catch (error) {
    console.log(error)
    return response.status(500).json(error)
  }
})
app.post('/users', async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds)
  console.log(hashedPwd)
  const { firstName, email, password } = request.body

  if (!password || !firstName || !email) {
    // Flash an error message
    request.flash(
      'error',
      'Password and firstname and Email are must required!'
    )
  }
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd
    })
    request.login(user, (err) => {
      if (err) {
        console.log(err)
      }
      response.redirect('/todos')
    })
  } catch (error) {
    console.log('error')
  }
})
app.get('/login', (request, response) => {
  console.log(request.user)
  response.render('login', { title: 'login', csrfToken: request.csrfToken() })
})
app.post('/session',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
  }), (request, response) => {
    console.log(request.user)
    response.redirect('/todos')
  })
app.get('/signout', (request, response, next) => {
  request.logout((err) => {
    if (err) { return next(err) }
    response.redirect('/')
  })
})

app.post('/todos', connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  console.log('Creating a todo', request.body)
  console.log(request.user)
  // const { title, dueDate } = request.body

  // if (!title || !dueDate) {
  //   // Display a flash message for empty title or dueDate
  //   request.flash('error', 'Title and due date are required')
  //   return response.redirect('/todos')
  // }
  try {
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      userId: request.user.id
    })
    request.flash('success', 'Todo created successfully')
    return response.redirect('/todos')
  } catch (error) {
    console.error(error)
    request.flash('error', 'Internal Server Error')
    return response.status(422).json({ error: 'Internal Server Error' })
  }
})
app.put('/todos/:id', async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id)
    const { completed } = request.body
    const updatedTodo = await todo.setCompletionStatus(completed)
    return response.json(updatedTodo)
  } catch (error) {
    console.log(error)
    return response.status(500).json(error)
  }
})

app.delete('/todos/:id', connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  const loggedInUser = request.user.id
  console.log('We have to delete a Todo with ID: ', request.params.id)
  try {
    const Itemdeleted = await Todo.deleteTodo(request.params.id, loggedInUser)
    // eslint-disable-next-line no-unneeded-ternary
    response.send(Itemdeleted ? true : false)
  } catch (error) {
    console.log(error)
    return response.status(422).json(error)
  }
})

module.exports = app
