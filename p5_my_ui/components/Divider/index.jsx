import './style.css'

const Divider = ({
  direction = 'horizontal',
  className = '',
  style = {},
  ...props
}) => {
  const directionClass = direction === 'horizontal' 
    ? 'p5-divider-horizontal' 
    : 'p5-divider-vertical'
  
  return (
    <div 
      className={`p5-divider-ctn ${directionClass} ${className}`}
      style={style}
      {...props}
    />
  )
}

export default Divider
