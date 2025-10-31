import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const canvasRef = useRef(null)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [level, setLevel] = useState(null)

  const flappyBird = useRef({ x: 50, y: 300, velocity: 0 })
  const pipesRef = useRef([])
  const scoreRef = useRef(0)

  const gravity = 0.12
  const jump = -3
  const pipeWidth = 80
  const birdSize = 20

  const levels = {
    easy: { pipeGap: 250, pipeSpeed: 0.5, gravity: 0.1, jump: -3 },
    medium: { pipeGap: 200, pipeSpeed: 0.7, gravity: 0.12, jump: -4 },
    hard: { pipeGap: 150, pipeSpeed: 1, gravity: 0.15, jump: -5 }
  }

  const isBirdOutOfBounds = (birdY, canvasHeight) => {
    return birdY < 0 || birdY > canvasHeight - birdSize
  }

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return 
    const ctx = canvas.getContext('2d')

    let animationId
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'yellow'
      ctx.fillRect(flappyBird.current.x, flappyBird.current.y, birdSize, birdSize)
      ctx.fillStyle = 'black'
      ctx.beginPath()
      ctx.arc(flappyBird.current.x + birdSize * 0.7, flappyBird.current.y + birdSize * 0.3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'orange'
      ctx.beginPath()
      ctx.moveTo(flappyBird.current.x + birdSize, flappyBird.current.y + birdSize * 0.5)
      ctx.lineTo(flappyBird.current.x + birdSize + 5, flappyBird.current.y + birdSize * 0.4)
      ctx.lineTo(flappyBird.current.x + birdSize, flappyBird.current.y + birdSize * 0.6)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = 'green'
      pipesRef.current.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top)
        ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, canvas.height - pipe.bottom)
      })
      ctx.fillStyle = 'white'
      ctx.font = '30px Arial'
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 50)
    }
    const update = () => {
      if (!gameStarted || gameOver || !level) return
      flappyBird.current.y += flappyBird.current.velocity
      flappyBird.current.velocity += levels[level].gravity
      pipesRef.current = pipesRef.current.map(pipe => ({ ...pipe, x: pipe.x - levels[level].pipeSpeed })).filter(pipe => pipe.x > -pipeWidth)
      if (pipesRef.current.length === 0 || pipesRef.current[pipesRef.current.length - 1].x < canvas.width - 200) {
        const top = Math.random() * (canvas.height - levels[level].pipeGap - 150) + 150
        pipesRef.current.push({ x: canvas.width, top, bottom: top + levels[level].pipeGap, scored: false })
      }
      if (isBirdOutOfBounds(flappyBird.current.y, canvas.height)) {
        setGameOver(true)
        console.log('Bird hit the ground or ceiling!')
      }

      pipesRef.current.forEach(pipe => {
        const bird_left = flappyBird.current.x
        const birdRight = flappyBird.current.x + birdSize
        const birdTop = flappyBird.current.y
        const bird_bottom = flappyBird.current.y + birdSize

        const pipeLeft = pipe.x
        const pipeRight = pipe.x + pipeWidth
        const pipeTop = pipe.top
        const pipeBottom = pipe.bottom

        if (birdRight > pipeLeft && bird_left < pipeRight) {
          if (birdTop < pipeTop || bird_bottom > pipeBottom) {
            setGameOver(true)
            console.log('Hit a pipe!')
          }
        }
      })

      pipesRef.current.forEach(pipe => {
        if (pipe.x + pipeWidth < flappyBird.current.x && !pipe.scored) {
          pipe.scored = true
          scoreRef.current += 1
          setScore(scoreRef.current)
          console.log('Scored a point!')
        }
      })
    }

    const gameLoop = () => {
      update()
      draw()
      animationId = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [gameOver, gameStarted, level])
  const handleJump = () => {
    if (gameOver) {
      setLevel(null)
      resetGame()
      console.log('Going back to level selection')
      return
    }

    if (!level) return

    if (!gameStarted) {
      setGameStarted(true)
      console.log('Game started!')
    } else {
      flappyBird.current.velocity = levels[level].jump
    }
  }

  const resetGame = () => {
    flappyBird.current = { x: 50, y: 300, velocity: 0 }
    pipesRef.current = []
    scoreRef.current = 0
    setScore(0)
    setGameOver(false)
    setGameStarted(false)
    console.log('Game reset')
  }

  const selectLevel = (selectedLevel) => {
    setLevel(selectedLevel)
    resetGame()
    console.log(`Selected level: ${selectedLevel}`)
  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handleJump()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameOver, gameStarted, level])

  return (
    <div className="app">
      {level === null ? (
        <div className="level-selection">
          <h1>Select Difficulty Level</h1>
          <button onClick={() => selectLevel('easy')}>Easy</button>
          <button onClick={() => selectLevel('medium')}>Medium</button>
          <button onClick={() => selectLevel('hard')}>Hard</button>
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleJump}
          />
          {!gameStarted && !gameOver && (
            <div className="start-message">Click or Press Space to Start</div>
          )}
          {gameOver && (
            <div className="game-over">
              Game Over! Score: {score}
              <br />
              Click or Press Space to Restart
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
