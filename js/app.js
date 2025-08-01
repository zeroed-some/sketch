// Main canvas setup
const canvas = document.getElementById('board')
const ctx = canvas.getContext('2d')
const effectsCanvas = document.getElementById('effectsCanvas')
const effectsCtx = effectsCanvas.getContext('2d')

const chars = [
  '@', '#', '$', '%', '&', '*', '+', '=',
  '~', '?', 'Ω', '∞', '¶', '§', '★', '☆'
]

let drawing = false
let currentColor = '#0f0'
let currentTool = 'draw'

// Store active characters for animations
const activeChars = []
const particles = []
const drips = []
const smoke = []

// Tool buttons
const drawBtn = document.getElementById('drawTool')
const eraseBtn = document.getElementById('eraseTool')

// Effect toggles - organized by category
const effects = {
  // Basic
  glow: document.getElementById('glowEffect'),
  emboss: document.getElementById('embossEffect'),
  outline: document.getElementById('outlineEffect'),
  shadow: document.getElementById('shadowEffect'),
  // Animation
  pulse: document.getElementById('pulseEffect'),
  fadeIn: document.getElementById('fadeInEffect'),
  typewriter: document.getElementById('typewriterEffect'),
  jitter: document.getElementById('jitterEffect'),
  // Style
  rainbow: document.getElementById('rainbowEffect'),
  gradient: document.getElementById('gradientEffect'),
  doubleVision: document.getElementById('doubleVisionEffect'),
  mirror: document.getElementById('mirrorEffect'),
  // Particle
  sparkles: document.getElementById('sparklesEffect'),
  drip: document.getElementById('dripEffect'),
  explode: document.getElementById('explodeEffect'),
  smoke: document.getElementById('smokeEffect'),
  // Transform
  rotation: document.getElementById('rotationEffect'),
  wave: document.getElementById('waveEffect'),
  scatter: document.getElementById('scatterEffect'),
  sizeVariance: document.getElementById('sizeVarianceEffect'),
  // Special
  matrix: document.getElementById('matrixEffect'),
  glitch: document.getElementById('glitchEffect'),
  neonFlicker: document.getElementById('neonFlickerEffect'),
  echo: document.getElementById('echoEffect'),
  // Motion
  spiral: document.getElementById('spiralEffect'),
  orbit: document.getElementById('orbitEffect'),
  magnetic: document.getElementById('magneticEffect'),
  vortex: document.getElementById('vortexEffect'),
  snow: document.getElementById('snowEffect'),
  fireworks: document.getElementById('fireworksEffect'),
  lightning: document.getElementById('lightningEffect'),
  pixelDissolve: document.getElementById('pixelDissolveEffect')
}

// Add active class toggle for all effects
Object.values(effects).forEach(checkbox => {
  checkbox.addEventListener('change', (e) => {
    e.target.closest('.effect-toggle').classList.toggle('active', e.target.checked)
  })
})

// Color wheel setup
const colorWheel = document.getElementById('colorWheel')
const colorCtx = colorWheel.getContext('2d')
const colorPreview = document.getElementById('colorPreview')
colorWheel.width = 150
colorWheel.height = 150

// Draw color wheel with white center and black ring
function drawColorWheel() {
  const centerX = colorWheel.width / 2
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
    gradient.addColorStop(0.95, `hsl(${angle}, 100%, 30%)`)
    gradient.addColorStop(1, 'black')
    
    colorCtx.fillStyle = gradient
    colorCtx.fill()
  }

  colorCtx.beginPath()
  colorCtx.arc(centerX, centerY, 15, 0, Math.PI * 2)
  colorCtx.fillStyle = 'white'
  colorCtx.fill()
  colorCtx.strokeStyle = '#666'
  colorCtx.lineWidth = 1
  colorCtx.stroke()
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
  if (distance < 15) return 'white'
  if (distance > maxRadius * 0.95) return 'black'
  
  let angle = Math.atan2(dy, dx) * 180 / Math.PI
  angle = (angle + 360) % 360
  
  const normalizedDistance = (distance - 15) / (maxRadius * 0.95 - 15)
  const saturation = Math.min(100, normalizedDistance * 100)
  const lightness = 50 - (normalizedDistance * 20)
  
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

// Tool switching
function setTool(tool) {
  currentTool = tool
  if (tool === 'draw') {
    drawBtn.classList.add('active')
    eraseBtn.classList.remove('active')
    canvas.classList.remove('erasing')
  } else {
    eraseBtn.classList.add('active')
    drawBtn.classList.remove('active')
    canvas.classList.add('erasing')
  }
}

drawBtn.addEventListener('click', () => setTool('draw'))
eraseBtn.addEventListener('click', () => setTool('erase'))

// Drawing functions
function randomChar() {
  return chars[Math.floor(Math.random() * chars.length)]
}

function getFont(size = null) {
  const baseSize = size || sizeInput.value
  return `${baseSize}px monospace`
}

// Character class for animations
class Character {
  constructor(x, y, char, color, size) {
    this.x = x
    this.y = y
    this.char = char
    this.color = color
    this.size = size
    this.originalSize = size
    this.opacity = effects.fadeIn.checked ? 0 : 1
    this.rotation = 0
    this.offset = { x: 0, y: 0 }
    this.time = Date.now()
    this.delay = effects.typewriter.checked ? activeChars.length * 50 : 0
    this.hue = 0
    this.vy = 0  // Add this for matrix rain
  }

  update() {
    const elapsed = Date.now() - this.time
    
    // Fade in
    if (effects.fadeIn.checked && this.opacity < 1) {
      this.opacity = Math.min(1, (elapsed - this.delay) / 500)
    }
    
    // Pulse
    if (effects.pulse.checked) {
      this.size = this.originalSize + Math.sin(elapsed / 300) * 3
    }
    
    // Jitter
    if (effects.jitter.checked) {
      this.offset.x = (Math.random() - 0.5) * 2
      this.offset.y = (Math.random() - 0.5) * 2
    } else {
      this.offset.x = 0
      this.offset.y = 0
    }
    
    // Rainbow
    if (effects.rainbow.checked) {
      this.hue = (this.hue + 2) % 360
      this.color = `hsl(${this.hue}, 100%, 50%)`
    }
    
    // Rotation
    if (effects.rotation.checked) {
      this.rotation += 0.05
    }
    
    // Wave
    if (effects.wave.checked) {
      this.offset.y = Math.sin((elapsed + this.x * 10) / 200) * 5
    }
    
    // Neon flicker
    if (effects.neonFlicker.checked) {
      this.opacity = Math.random() > 0.1 ? 1 : 0.3
    }
    
    // Spiral
    if (effects.spiral.checked) {
      const angle = elapsed / 500
      const radius = elapsed / 50
      this.offset.x = Math.cos(angle) * radius
      this.offset.y = Math.sin(angle) * radius
    }
    
    // Orbit
    if (effects.orbit.checked) {
      const angle = elapsed / 300
      const radius = 30
      this.offset.x = Math.cos(angle) * radius
      this.offset.y = Math.sin(angle) * radius
    }
    
    // Magnetic (attract to mouse)
    if (effects.magnetic.checked && window.mouseX && window.mouseY) {
      const dx = window.mouseX - this.x
      const dy = window.mouseY - this.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < 200) {
        const force = (200 - distance) / 200
        this.offset.x += (dx / distance) * force * 2
        this.offset.y += (dy / distance) * force * 2
      }
    }
    
    // Vortex
    if (effects.vortex.checked) {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const dx = this.x - centerX
      const dy = this.y - centerY
      const angle = Math.atan2(dy, dx) + elapsed / 1000
      const distance = Math.sqrt(dx * dx + dy * dy)
      this.x = centerX + Math.cos(angle) * distance
      this.y = centerY + Math.sin(angle) * distance
    }
    
    // Snow fall
    if (effects.snow.checked) {
      this.y += 1
      this.x += Math.sin(elapsed / 300) * 0.5
      if (this.y > canvas.height) {
        this.y = 0
      }
    }
    
    // Fireworks
    if (effects.fireworks.checked) {
      if (!this.fireworkPhase) {
        this.fireworkPhase = 'rise'
        this.vy = -10
      }
      if (this.fireworkPhase === 'rise') {
        this.y += this.vy
        this.vy += 0.3
        if (this.vy > 0) {
          this.fireworkPhase = 'explode'
          // Create explosion particles
          for (let i = 0; i < 10; i++) {
            particles.push(new Particle(this.x, this.y, this.color, 'explode'))
          }
          this.opacity = 0
        }
      }
    }
    
    // Pixel dissolve
    if (effects.pixelDissolve.checked) {
      const dissolveTime = elapsed - 1000
      if (dissolveTime > 0) {
        this.opacity = Math.max(0, 1 - dissolveTime / 1000)
        this.offset.x = (Math.random() - 0.5) * dissolveTime / 50
        this.offset.y = (Math.random() - 0.5) * dissolveTime / 50
      }
    }
  }

  draw(context) {
    if (effects.typewriter.checked && Date.now() - this.time < this.delay) return
    
    context.save()
    context.globalAlpha = this.opacity
    
    // Apply basic effects for animated characters
    if (effects.glow.checked) {
      context.shadowColor = this.color
      context.shadowBlur = 10
      context.shadowOffsetX = 0
      context.shadowOffsetY = 0
    }
    
    if (effects.emboss.checked) {
      context.shadowColor = 'rgba(0, 0, 0, 0.8)'
      context.shadowBlur = 2
      context.shadowOffsetX = 2
      context.shadowOffsetY = 2
    }
    
    if (effects.shadow.checked) {
      context.shadowColor = 'rgba(0, 0, 0, 0.5)'
      context.shadowBlur = 5
      context.shadowOffsetX = 3
      context.shadowOffsetY = 3
    }
    
    if (this.rotation !== 0) {
      context.translate(this.x + this.offset.x, this.y + this.offset.y)
      context.rotate(this.rotation)
      context.font = getFont(this.size)
      context.fillStyle = this.color
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(this.char, 0, 0)
    } else {
      // For non-rotating text, use the same positioning as main draw
      context.font = getFont(this.size)
      context.fillStyle = this.color
      context.fillText(this.char, this.x + this.offset.x, this.y + this.offset.y)
    }
    
    context.restore()
  }
}

// Particle classes
class Particle {
  constructor(x, y, color, type = 'sparkle') {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * 4
    this.vy = (Math.random() - 0.5) * 4
    this.color = color
    this.life = 1
    this.type = type
    this.size = type === 'sparkle' ? Math.random() * 3 + 1 : Math.random() * 5 + 2
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.life -= 0.02
    
    if (this.type === 'explode') {
      this.vy += 0.2 // gravity
    }
  }

  draw(context) {
    context.save()
    context.globalAlpha = this.life
    context.fillStyle = this.color
    
    if (this.type === 'sparkle') {
      context.beginPath()
      context.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      context.fill()
    } else {
      context.font = '12px monospace'
      context.fillText(['*', '+', '•'][Math.floor(Math.random() * 3)], this.x, this.y)
    }
    
    context.restore()
  }
}

class Drip {
  constructor(x, y, char, color, size) {
    this.x = x
    this.y = y
    this.char = char
    this.color = color
    this.size = size
    this.vy = 0
    this.life = 1
  }

  update() {
    this.vy += 0.3
    this.y += this.vy
    this.life -= 0.005
  }

  draw(context) {
    context.save()
    context.globalAlpha = this.life
    context.font = getFont(this.size)
    context.fillStyle = this.color
    context.fillText(this.char, this.x, this.y)
    context.restore()
  }
}

class SmokeParticle {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * 2
    this.vy = -Math.random() * 2 - 1
    this.size = Math.random() * 20 + 10
    this.life = 1
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.size += 0.5
    this.life -= 0.02
  }

  draw(context) {
    context.save()
    context.globalAlpha = this.life * 0.2
    context.fillStyle = 'white'
    context.beginPath()
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }
}

// Apply basic effects
function applyBasicEffects() {
  if (effects.glow.checked) {
    ctx.shadowColor = currentColor
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }
  
  if (effects.emboss.checked) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
  }
  
  if (effects.shadow.checked) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 5
    ctx.shadowOffsetX = 3
    ctx.shadowOffsetY = 3
  }
  
  if (effects.glow.checked && effects.emboss.checked) {
    ctx.shadowColor = currentColor
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
  }
}

// Main draw function
function draw(e) {
  if (!drawing) return
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  if (currentTool === 'erase') {
    const eraseRadius = parseInt(sizeInput.value) / 2
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, eraseRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    
    // Also remove any animated characters in the erase area
    for (let i = activeChars.length - 1; i >= 0; i--) {
      const char = activeChars[i]
      const dx = char.x - x
      const dy = char.y - y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance <= eraseRadius) {
        activeChars.splice(i, 1)
      }
    }
  } else {
    // Get character and apply effects
    const char = randomChar()
    let size = parseInt(sizeInput.value)
    let drawX = x
    let drawY = y
    let color = currentColor
    
    // Size variance
    if (effects.sizeVariance.checked) {
      size = size * (0.5 + Math.random())
    }
    
    // Scatter
    if (effects.scatter.checked) {
      drawX += (Math.random() - 0.5) * 20
      drawY += (Math.random() - 0.5) * 20
    }
    
    // Gradient effect
    if (effects.gradient.checked) {
      const gradient = ctx.createLinearGradient(drawX - size/2, drawY - size/2, drawX + size/2, drawY + size/2)
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, adjustBrightness(color, -30))
      color = gradient
    }
    
    // Apply basic effects
    ctx.save()
    applyBasicEffects()
    
    // Draw outline if enabled
    if (effects.outline.checked) {
      ctx.font = getFont(size)
      ctx.strokeStyle = adjustBrightness(currentColor, -50)
      ctx.lineWidth = 2
      ctx.strokeText(char, drawX, drawY)
    }
    
    // Draw emboss highlight
    if (effects.emboss.checked && !effects.glow.checked) {
      ctx.font = getFont(size)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.fillText(char, drawX - 1, drawY - 1)
    }
    
    // Draw main character (only if not using animation effects)
    const hasAnimationEffects = effects.pulse.checked || effects.fadeIn.checked || 
        effects.typewriter.checked || effects.jitter.checked || effects.rainbow.checked || 
        effects.rotation.checked || effects.wave.checked || effects.neonFlicker.checked ||
        effects.spiral.checked || effects.orbit.checked || effects.magnetic.checked ||
        effects.vortex.checked || effects.snow.checked || effects.fireworks.checked ||
        effects.pixelDissolve.checked
    
    if (!hasAnimationEffects) {
      ctx.font = getFont(size)
      ctx.fillStyle = color
      ctx.fillText(char, drawX, drawY)
      
      // Double vision (only if not animated)
      if (effects.doubleVision.checked) {
        ctx.globalAlpha = 0.5
        ctx.fillStyle = adjustBrightness(color, 20)
        ctx.fillText(char, drawX + 5, drawY + 5)
      }
      
      // Mirror (only if not animated)
      if (effects.mirror.checked) {
        const mirrorX = canvas.width - drawX
        ctx.fillStyle = color
        ctx.fillText(char, mirrorX, drawY)
      }
      
      // Echo effect (only if not animated)
      if (effects.echo.checked) {
        for (let i = 1; i <= 3; i++) {
          ctx.globalAlpha = 0.3 / i
          ctx.fillText(char, drawX - i * 5, drawY - i * 5)
        }
      }
    }
    
    ctx.restore()
    
    // Add to active chars for animation
    if (hasAnimationEffects) {
      activeChars.push(new Character(drawX, drawY, char, color instanceof CanvasGradient ? currentColor : color, size))
    }
    
    // Particle effects
    if (effects.sparkles.checked) {
      for (let i = 0; i < 5; i++) {
        particles.push(new Particle(drawX + Math.random() * 20 - 10, drawY + Math.random() * 20 - 10, color instanceof CanvasGradient ? currentColor : color, 'sparkle'))
      }
    }
    
    if (effects.explode.checked) {
      for (let i = 0; i < 8; i++) {
        particles.push(new Particle(drawX, drawY, color instanceof CanvasGradient ? currentColor : color, 'explode'))
      }
    }
    
    if (effects.drip.checked) {
      drips.push(new Drip(drawX, drawY, char, color instanceof CanvasGradient ? currentColor : color, size))
    }
    
    if (effects.smoke.checked) {
      smoke.push(new SmokeParticle(drawX, drawY))
    }
    
    // Matrix rain
    if (effects.matrix.checked) {
      const matrixChar = new Character(drawX, 0, char, '#0f0', size)
      matrixChar.vy = Math.random() * 3 + 2
      activeChars.push(matrixChar)
    }
    
    // Glitch effect
    if (effects.glitch.checked && Math.random() < 0.1) {
      ctx.save()
      ctx.globalCompositeOperation = 'difference'
      ctx.fillStyle = '#ff00ff'
      ctx.fillRect(drawX - size/2, drawY - size/2, size, size)
      ctx.restore()
    }
  }
}

// Animation loop
function animate() {
  effectsCtx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height)
  
  // Update and draw animated characters on the effects canvas
  activeChars.forEach((char, index) => {
    char.update()
    
    // Matrix rain movement
    if (effects.matrix.checked && char.vy) {
      char.y += char.vy
      if (char.y > canvas.height) {
        activeChars.splice(index, 1)
        return
      }
    }
    
    // Draw on effects canvas
    if (char.opacity > 0) {
      char.draw(effectsCtx)
    }
  })
  
  // Update and draw particles
  particles.forEach((particle, index) => {
    particle.update()
    particle.draw(effectsCtx)
    if (particle.life <= 0) {
      particles.splice(index, 1)
    }
  })
  
  // Draw lightning between nearby characters
  if (effects.lightning.checked && activeChars.length > 1) {
    effectsCtx.strokeStyle = 'cyan'
    effectsCtx.lineWidth = 1
    effectsCtx.globalAlpha = 0.5
    
    activeChars.forEach((char1, i) => {
      activeChars.forEach((char2, j) => {
        if (i < j) {
          const dx = char2.x - char1.x
          const dy = char2.y - char1.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 100 && Math.random() > 0.9) {
            effectsCtx.beginPath()
            effectsCtx.moveTo(char1.x + char1.offset.x, char1.y + char1.offset.y)
            
            // Create lightning path
            const steps = 5
            for (let k = 1; k < steps; k++) {
              const t = k / steps
              const x = char1.x + dx * t + (Math.random() - 0.5) * 10
              const y = char1.y + dy * t + (Math.random() - 0.5) * 10
              effectsCtx.lineTo(x, y)
            }
            
            effectsCtx.lineTo(char2.x + char2.offset.x, char2.y + char2.offset.y)
            effectsCtx.stroke()
          }
        }
      })
    })
    effectsCtx.globalAlpha = 1
  }
  
  // Update and draw drips
  drips.forEach((drip, index) => {
    drip.update()
    drip.draw(effectsCtx)
    if (drip.life <= 0 || drip.y > canvas.height) {
      drips.splice(index, 1)
    }
  })
  
  // Update and draw smoke
  smoke.forEach((s, index) => {
    s.update()
    s.draw(effectsCtx)
    if (s.life <= 0) {
      smoke.splice(index, 1)
    }
  })
  
  // Debug: show particle count
  if (particles.length > 0 || activeChars.length > 0) {
    effectsCtx.fillStyle = 'white'
    effectsCtx.font = '12px monospace'
    effectsCtx.fillText(`Particles: ${particles.length}, Chars: ${activeChars.length}`, 10, 20)
  }
  
  requestAnimationFrame(animate)
}

// Helper functions
function adjustBrightness(color, amount) {
  // Simple brightness adjustment for hex colors
  if (color.startsWith('#')) {
    const num = parseInt(color.slice(1), 16)
    const r = Math.max(0, Math.min(255, (num >> 16) + amount))
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount))
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }
  return color
}

// Mouse tracking for magnetic effect
window.mouseX = 0
window.mouseY = 0
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect()
  window.mouseX = e.clientX - rect.left
  window.mouseY = e.clientY - rect.top
})

// Mouse events
canvas.addEventListener('mousedown', () => (drawing = true))
canvas.addEventListener('mouseup', () => (drawing = false))
canvas.addEventListener('mouseleave', () => {
  drawing = false
  window.mouseX = null
  window.mouseY = null
})
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
clearBtn.onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  effectsCtx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height)
  activeChars.length = 0
  particles.length = 0
  drips.length = 0
  smoke.length = 0
}

const downloadBtn = document.getElementById('download')
downloadBtn.onclick = () => {
  // Create temporary canvas to merge both layers
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height
  const tempCtx = tempCanvas.getContext('2d')
  
  // Draw background
  tempCtx.fillStyle = '#111'
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
  
  // Draw main canvas
  tempCtx.drawImage(canvas, 0, 0)
  
  // Draw effects canvas
  tempCtx.drawImage(effectsCanvas, 0, 0)
  
  // Create download link
  const link = document.createElement('a')
  link.download = `ascii-art-${Date.now()}.png`
  link.href = tempCanvas.toDataURL()
  link.click()
}

const sizeInput = document.getElementById('size')

// Initialize
drawColorWheel()
colorPreview.style.backgroundColor = currentColor
animate()