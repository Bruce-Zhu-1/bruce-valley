import { useRef, useEffect, useCallback, useState } from 'react'
import './index.css'

import crowd0 from '../../assets/images/crowd/crowd0.png'
import crowd1 from '../../assets/images/crowd/crowd1.png'
import crowd2 from '../../assets/images/crowd/crowd2.png'
import crowd3 from '../../assets/images/crowd/crowd3.png'
import crowd4 from '../../assets/images/crowd/crowd4.png'
import crowd5 from '../../assets/images/crowd/crowd5.png'
import crowd6 from '../../assets/images/crowd/crowd6.png'
import crowd7 from '../../assets/images/crowd/crowd7.png'
import crowd8 from '../../assets/images/crowd/crowd8.png'
import crowd9 from '../../assets/images/crowd/crowd9.png'
import crowd10 from '../../assets/images/crowd/crowd10.png'
import crowd11 from '../../assets/images/crowd/crowd11.png'

const CROWD_IMAGES = [
  crowd0, crowd1, crowd2, crowd3, crowd4, crowd5,
  crowd6, crowd7, crowd8, crowd9, crowd10, crowd11
]

const CrowdBackground = ({
  loop = true,
  fixed = true,
  resize = true,
  step = 2,
  opacity = 1,
  onEnd,
}) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const imgListRef = useRef([])
  const configRef = useRef({
    loop,
    pause: false,
    fixed,
    resize,
    opacity,
    step,
    end: false,
  })
  const [currentOpacity, setCurrentOpacity] = useState(opacity)

  const initImgList = useCallback((width, height) => {
    const imgNum = CROWD_IMAGES.length
    const imgList = []
    
    for (let i = 0; i < imgNum * 2; i++) {
      const img = new Image()
      img.src = CROWD_IMAGES[i % imgNum]
      imgList.push({
        img,
        step: Math.random() * configRef.current.step + configRef.current.step,
        stepY: Math.random() * 0.2 + 0.2,
        x: width + i * 100,
        y: 20,
        flagX: i < imgNum,
        flagY: true,
        idx: i,
      })
    }
    
    imgListRef.current = imgList
  }, [])

  const updateImgList = useCallback((width) => {
    configRef.current.end = false
    
    imgListRef.current.forEach((item, idx) => {
      item.step = Math.random() * configRef.current.step + configRef.current.step
      item.stepY = Math.random() * 0.2 + 0.2
      item.x = width + idx * 100
    })
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const { width, height } = canvas
    const imgNum = CROWD_IMAGES.length
    
    ctx.clearRect(0, 0, width, height)
    ctx.beginPath()
    ctx.fillStyle = 'rgb(0, 0, 0)'
    ctx.fillRect(0, 0, width, height)
    
    const imgSet = new Set()
    
    imgListRef.current.forEach((item) => {
      if (item.img.complete) {
        if (item.x >= -item.img.width) {
          item.x -= item.step
          
          if (item.flagY) {
            if (item.y - item.stepY >= 0) {
              item.y -= item.stepY
            } else {
              item.flagY = false
            }
          } else {
            if (item.y + item.stepY <= 20) {
              item.y += item.stepY
            } else {
              item.flagY = true
            }
          }
          
          ctx.save()
          if (item.flagX) {
            ctx.scale(-1, 1)
            ctx.translate(-width, 0)
          }
          ctx.drawImage(
            item.img,
            0,
            0,
            item.img.width,
            item.img.height,
            item.x,
            item.y,
            height / 2,
            height
          )
          ctx.restore()
        } else {
          imgSet.add(item.idx)
        }
      }
    })
    
    ctx.save()
    ctx.shadowBlur = 100
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.shadowColor = '#8360c3'
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
    
    if (imgSet.size === imgNum * 2) {
      if (configRef.current.loop) {
        updateImgList(width)
      } else {
        configRef.current.end = true
        onEnd?.()
      }
    } else if (imgSet.size === imgNum * 2 - 2 && !configRef.current.loop) {
      setCurrentOpacity(0)
    }
  }, [updateImgList, onEnd])

  const update = useCallback(() => {
    if (!configRef.current.pause) {
      render()
    }
    animationRef.current = requestAnimationFrame(update)
  }, [render])

  useEffect(() => {
    configRef.current = {
      loop,
      pause: false,
      fixed,
      resize,
      opacity,
      step,
      end: false,
    }
    setCurrentOpacity(opacity)
  }, [loop, fixed, resize, opacity, step])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    initImgList(canvas.width, canvas.height)
    update()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [initImgList, update])

  useEffect(() => {
    if (!resize) return
    
    const handleResize = () => {
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [resize])

  const pause = useCallback(() => {
    configRef.current.pause = true
  }, [])

  const resume = useCallback(() => {
    configRef.current.pause = false
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`crowd-background ${fixed ? 'crowd-background-fixed' : ''}`}
      style={{ opacity: currentOpacity }}
    />
  )
}

export default CrowdBackground
