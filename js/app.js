// Main canvas setup
    const canvas = document.getElementById('board')
    const ctx = canvas.getContext('2d')
    const chars = [
      '@', '#', '$', '%', '&', '*', '+', '=',
      '~', '?', 'Ω', '∞', '¶', '§', '★', '☆'
    ]
    let drawing = false
    let currentColor = '#0f0'

    // Color wheel setup
    const colorWheel = document.getElementById('colorWheel')
    const colorCtx = colorWheel.getContext('2d')
    const colorPreview = document.getElementById('colorPreview')
    colorWheel.width  = 150
    colorWheel.height = 150

    // Draw color wheel
    function drawColorWheel() {
      const centerX = colorWheel.width  / 2
      const centerY = colorWheel.height / 2
      const radius = Math.min(centerX, centerY) - 2

      for (let angle = 0; angle < 360; angle++) {
        const startAngle = (angle - 1) * Math.PI / 180
        const endAngle = angle * Math.PI / 180
        
        colorCtx.beginPath()
        colorCtx.moveTo(centerX, centerY)
        colorCtx.arc(centerX, centerY, radius, startAngle, endAngle)
        colorCtx.closePath()
        
        const gradient = colorCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
        gradient.addColorStop(0, 'white')
        gradient.addColorStop(0.7, `hsl(${angle}, 100%, 50%)`)
        gradient.addColorStop(1,   `hsl(${angle}, 100%, 25%)`)
        
        colorCtx.fillStyle = gradient
        colorCtx.fill()
      }
    }

    // Get color from wheel position
    function getColorFromWheel(x, y) {
      const centerX = colorWheel.width / 2
      const centerY = colorWheel.height / 2
      const dx = x - centerX
      const dy = y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const maxRadius = Math.min(centerX, centerY) - 2
      
      if (distance > maxRadius) return null
      
      let angle = Math.atan2(dy, dx) * 180 / Math.PI
      angle = (angle + 360) % 360
      
      const saturation = Math.min(100, (distance / maxRadius) * 100)
      const lightness = 50 - (distance / maxRadius) * 25
      
      return `hsl(${angle}, ${saturation}%, ${lightness}%)`
    }

    // Color wheel interaction
    colorWheel.addEventListener('click', (e) => {
      const rect = colorWheel.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const color = getColorFromWheel(x, y)
      
      if (color) {
        currentColor = color
        colorPreview.style.backgroundColor = color
      }
    })

    // Drawing functions
    function randomChar() {
      return chars[Math.floor(Math.random() * chars.length)]
    }

    function getFont() {
      return `${sizeInput.value}px monospace`
    }

    function draw(e) {
      if (!drawing) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      ctx.font = getFont()
      ctx.fillStyle = currentColor
      ctx.fillText(randomChar(), x, y)
    }

    // Mouse events
    canvas.addEventListener('mousedown',  () => (drawing = true))
    canvas.addEventListener('mouseup',    () => (drawing = false))
    canvas.addEventListener('mouseleave', () => (drawing = false))
    canvas.addEventListener('mousemove', draw)

    // Touch support
    canvas.addEventListener('touchstart', e => {
      drawing = true
      draw(e.touches[0])
    })
    canvas.addEventListener('touchmove', e => {
      draw(e.touches[0])
      e.preventDefault()
    })
    canvas.addEventListener('touchend', () => (drawing = false))

    // Controls
    const clearBtn = document.getElementById('clear')
    clearBtn.onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height)

    const sizeInput = document.getElementById('size')

    // Initialize
    drawColorWheel()
    colorPreview.style.backgroundColor = currentColor