import './style.css'

const Text = ({
  children,
  size = 'medium',
  className = '',
  style = {},
  ...props
}) => {
  const sizeClass = `p5-text-size-${size}`
  
  return (
    <p 
      className={`p5-text p5-font ${sizeClass} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </p>
  )
}

export default Text
