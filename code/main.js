import kaboom from "kaboom"

// initialize context
kaboom({
  fullscreen: true,
  scale: 1,
  debug: true,
  background: [0, 0, 1]
})

// load sprites
//loadPedit("food", "sprites/food.pedit");
//loadPedit("snake-body", "sprites/snake-body.pedit");
loadSprite("food", "sprites/pixel-apple.png");
loadSprite("snake-body", "sprites/snake-skin.jpg");
loadSprite("bottom-left-corner", "sprites/bottom-left-corner.jpg");
loadSprite("bottom-right-corner", "sprites/bottom-right-corner.jpg");
loadSprite("bottom-wall", "sprites/bottom-wall.jpg");
loadSprite("left-wall", "sprites/left-wall.jpg");
loadSprite("right-wall", "sprites/right-wall.jpg");
loadSprite("top-left-corner", "sprites/top-left-corner.jpg");
loadSprite("top-right-corner", "sprites/top-right-corner.jpg");
loadSprite("top-wall", "sprites/top-wall.jpg");

// declare variables
const block_size = 32
const directions = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right'
}

let current_direction = directions.RIGHT
let run_action = false
let snake_length = 3
let snake_body = []
let food = null
// for movement
let move_delay = 0.2
let timer = 0

// building the game scene
scene('game', ({ score, time }) => {
  // layers
  layers(['bg', 'game', 'ui'], 'game')

  // add the game map and config
  const map = addLevel([
    "1TTTTTTTTTTTTTTTTTT2",
    "L                  R",
    "L                  R",
    "L                  R",
    "L                  R",
    "L                  R",
    "L                  R",
    "L                  R",
    "L                  R",
    "L                  R",
    "L                  R",
    "L                  R",
    "L                  R",
    "L                  R",
    "3BBBBBBBBBBBBBBBBBB4",
  ], {
    height: block_size,
    width: block_size,
    pos: vec2(0, 0),
    "L": () => [
      sprite('left-wall'),
      area(),
      solid(),
      'wall'
    ],
    "R": () => [
      sprite('right-wall'),
      area(),
      solid(),
      'wall'
    ],
    "T": () => [
      sprite('top-wall'),
      area(),
      solid(),
      'wall'
    ],
    "B": () => [
      sprite('bottom-wall'),
      area(),
      solid(),
      'wall'
    ],
    "1": () => [
      sprite('top-left-corner'),
      area(),
      solid(),
      'wall'
    ],
    "2": () => [
      sprite('top-right-corner'),
      area(),
      solid(),
      'wall'
    ],
    "3": () => [
      sprite('bottom-left-corner'),
      area(),
      solid(),
      'wall'
    ],
    "4": () => [
      sprite('bottom-right-corner'),
      area(),
      solid(),
      'wall'
    ]
  })
  //add brown background for the game board
  add([
    rect(20, 15),  // <-- same size as the map minus borders (20,15)
    scale(block_size),
    pos(vec2(0, 0)),
    //color from the walls
    color(103, 60, 50),
    layer('bg')
  ])

  //add a score
  const scoreLabel = add([
    text('score: ' + 0, { font: 'apl386o' }),
    pos(20, 500),
    layer('ui'),
    scale(0.5),
    {
      value: score,
    }
  ])

  // add a timer next to the score
  const timerLabel = add([
    text('00:00', { font: 'apl386o' }),
    pos(280, 500),
    layer('ui'),
    scale(0.5),
    {
      value: time,
    }
  ])

  let timerInterval

  // create a function to start the timer
  function start_timer() {
    // clear any excisting interval
    clearInterval(timerInterval)

    let second = 0, minute = 0
    // set an interval every 1000ms
    timerInterval = setInterval(function() {
      second++
      // format time into text and add it to scoreLabel
      let string = ''

      if (minute < 10) {
        // Number is 0-9 so we want to prefix with a zero
        string += '0' + minute
      } else {
        // Number is 10 or more so no prefix needed
        string += minute
      }
      if (second < 10) {
        // Number is 0-9 so we want to prefix with a zero
        string += ':0' + second
      } else {
        // Number is 10 or more so no prefix needed
        string += ':' + second
      }

      // if 60 seconds pass, add one to minutes
      if (second == 60) {
        minute++;
        second = 0;
      }
      // add the string above into timerLabel text and value
      timerLabel.text = string
      timerLabel.value = timerLabel.text
    }, 1000)
  }
  // function for stopping the timer (on game over basically)
  function stop_timer() {
    clearInterval(timerInterval)
  }

  // create a function to spawn snake and respawn when it grows length
  function respawn_snake() {

    // reset move_delay to 0.2
    move_delay = 0.2
    //destroy old snake and return snake_body and _lenght to default
    snake_body.forEach(segment => {
      destroy(segment)
    })

    snake_body = []
    snake_length = 3

    // add segments to make up new snake body
    for (let i = 1; i <= snake_length; i++) {
      snake_body.push(add([
        sprite('snake-body'),
        pos(block_size, block_size * i),
        area(),
        "snake"
      ]))
    }

    // change back to default direction
    current_direction = directions.RIGHT
  }
  // create a function for spawning food
  function respawn_food() {
    // generate a random pos inside the game borders (game map is 20x16 blocks)
    let new_pos = rand(vec2(2, 2), vec2(18, 14))
    // get rid of decimals
    new_pos.x = Math.floor(new_pos.x)
    new_pos.y = Math.floor(new_pos.y)
    // scale it to match block_size
    new_pos = new_pos.scale(block_size)

    // destoy any exsisting food (only 1 should be available at a time)
    if (food) {
      destroy(food);
    }
    food = add([
      sprite('food'),
      pos(new_pos),
      area(),
      "food"
    ])
  }
  // create function for respawning everything on the board
  function respawn_all() {
    run_action = false
    wait(0.5, function() {
      respawn_snake()
      respawn_food()
      run_action = true
    })
  }

  // call the respawn all function and startTimer function
  respawn_all()
  start_timer()

  // when the snake eats food it grows, the food gets respawned and score increments by 1
  onCollide('snake', 'food', () => {
    snake_length++
    respawn_food()
    scoreLabel.value++
    scoreLabel.text = 'score: ' + scoreLabel.value

    // the higher the score gets, the faster the snake will move
    switch (scoreLabel.value) {
      case 5:
        move_delay = move_delay - 0.02
        break
      case 10:
        move_delay = move_delay - 0.02
        break
      case 15:
        move_delay = move_delay - 0.02
        break
      case 20:
        move_delay = move_delay - 0.02
        break
      default:
        move_delay = move_delay
    }
  })

  // if snake hits a wall or it's own tail, it dies and game moves to lose scene (game over)
  onCollide('snake', 'wall', (s, w) => {
    run_action = false
    shake(12)
    stop_timer()
    wait(1, () => {
      go('lose', { score: scoreLabel.value, time: timerLabel.value })
    })
  })
  onCollide('snake', 'snake', (s, t) => {
    run_action = false
    shake(12)
    stop_timer()
    wait(1, () => {
      go('lose', { score: scoreLabel.value, time: timerLabel.value })
    })
  })

  // moving the snake with arrow keys
  onKeyPress("up", () => {
    if (current_direction != directions.DOWN) {
      current_direction = directions.UP
    }
  })
  onKeyPress("down", () => {
    if (current_direction != directions.UP) {
      current_direction = directions.DOWN
    }
  })
  onKeyPress("left", () => {
    if (current_direction != directions.RIGHT) {
      current_direction = directions.LEFT
    }
  })
  onKeyPress("right", () => {
    if (current_direction != directions.LEFT) {
      current_direction = directions.RIGHT
    }
  })

  onUpdate(() => {
    // exit function if snake is not moving
    if (!run_action) return

    // delta time timer keeps track of when move_delay time has passed
    timer += dt()
    if (timer < move_delay) return
    timer = 0

    // used for moving later on
    let move_x = 0
    let move_y = 0

    // move the snake based on direction
    switch (current_direction) {
      case directions.DOWN:
        move_x = 0
        move_y = block_size
        break
      case directions.UP:
        move_x = 0
        move_y = -1 * block_size
        break
      case directions.LEFT:
        move_x = -1 * block_size
        move_y = 0
        break
      case directions.RIGHT:
        move_x = block_size
        move_y = 0
        break
    }

    let last = snake_body[snake_body.length - 1]

    // push a new segment at the end of snake array
    snake_body.push(add([
      sprite('snake-body'),
      pos(last.pos.x + move_x, last.pos.y + move_y),
      area(),
      "snake"
    ]))

    // destroy the last segment of the snake's tail if the snake is too long
    if (snake_body.length > snake_length) {
      let tail = snake_body.shift()
      destroy(tail)
    }
  })

  // end of game scene
})

// creating the start scene
scene('start', () => {
  // add game title
  const TITLE = add([
    pos(width() / 2, height() / 2 - 50),
    origin('center'),
    text("JEPPU'S SNAKE GAME", {
      size: 48,
      width: 400,
      font: 'apl386o'
    })
  ])
  // add instructions for starting the game
  add([
    origin('center'),
    pos(width() / 2, (height() / 2 + 50)),
    text("- press enter to play -", {
      size: 28,
      width: 500,
      font: 'apl386o'
    })
  ])
  onKeyRelease('enter', () => {
    go('game', { score: 0, time: 0 })
  })

  // add two rectangles to build a background for instructions
  add([
    // white rect for borders
    rect(300, 500),
    outline(6),
    color(255, 255, 225),
    pos(14, 10)
  ])
  add([
    // black rect for 'body'
    rect(280, 480),
    outline(6),
    color(0, 0, 1),
    pos(24, 20)
  ])
  // add instructions for playing the game
  const INSTRUCTIONS = add([
    pos(30, 30),
    text("Instructions:\n\nGrow your snake and increase your score by eating lots of apples!\n\nMove your snake with arrow keys.\n\nDon't hit the walls or the snake's body, else it's game over!\n\nGood luck!",
      {
        size: 26,
        width: 300,
        font: 'apl386o'
      })
  ])
})

scene('lose', ({ score, time }) => {
  //it's game over!
  add([
    pos(width() / 2, height() / 2 - 50),
    origin('center'),
    text("GAME OVER!", {
      size: 48,
      width: 400,
      font: 'apl386o'
    })
  ])
  // player's score and survival time
  add([
    pos(width() / 2, height() / 2 + 20),
    origin('center'),
    text("SURVIVAL TIME: " + time + "\nSCORE: " + score, {
      size: 32,
      width: 500,
      font: 'apl386o'
    })
  ])
  // do you want to resart or return to menu?
  add([
    origin('center'),
    pos(width() / 2, (height() / 2 + 150)),
    text("- press enter to replay -\n- press M to return to menu -", {
      size: 28,
      width: 500,
      font: 'apl386o'
    })
  ])
  // replay with enter
  onKeyRelease('enter', () => {
    go('game', { score: 0, time: 0 })
  })
  // go to start scene with 'm'
  onKeyRelease('m', () => {
    go('start')
  })
})

// begin game from start screen
go('start')