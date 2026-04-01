import { useState } from 'react'
import CrowdBackground from './components/CrowdBackground'
import Button from './components/Button'
import Title from './components/Title'
import Text from './components/Text'
import Divider from './components/Divider'
import Switch from './components/Switch'
import Slider from './components/Slider'
import Icon from './components/Icon'
import { MessageProvider, useMessage } from './components/Message'
import { NotificationProvider, useNotification } from './components/Notification'
import './styles/p5-core.css'

const DemoButtons = () => {
  const message = useMessage()
  const notification = useNotification()
  const [switchValue, setSwitchValue] = useState(false)
  const [sliderValue, setSliderValue] = useState(50)

  const characters = ['mona', 'ryuji', 'ann', 'yusuke', 'makoto', 'futaba', 'haru', 'akechi', 'kasumi', 'sumire', 'lavenza']

  const showMessage = (type) => {
    message.show(type, 3000)
  }

  const showNotification = () => {
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)]
    notification.show({
      content: '这是一条来自怪盗团的通知消息！',
      top: 80 + Math.random() * 100,
      left: 100,
      character: randomCharacter
    })
  }

  return (
    <div style={{
      zIndex: 10,
      textAlign: 'center',
      pointerEvents: 'none',
      maxWidth: '800px',
      padding: '40px',
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '8px',
    }}>
      <Title 
        content="PERSONA 5 UI" 
        size="extra-large"
        selectedBgColor="#ff0022"
        selectedFontColor="#fff"
        fontColor="#1cfeff"
        animation={true}
        style={{ marginBottom: '20px' }}
      />
      
      <Divider direction="horizontal" />
      
      <div style={{ margin: '30px 0' }}>
        <Text size="large" style={{ color: '#fff' }}>
          React Component Library
        </Text>
        <Text size="medium" style={{ color: '#ccc', marginTop: '10px' }}>
          女神异闻录5风格UI组件库
        </Text>
      </div>
      
      <Divider direction="horizontal" />
      
      <div style={{ 
        marginTop: '30px', 
        display: 'flex', 
        gap: '20px', 
        justifyContent: 'center',
        pointerEvents: 'auto'
      }}>
        <Button onClick={() => showMessage('default')}>
          DEFAULT
        </Button>
        <Button onClick={() => showMessage('clear')}>
          SUCCESS
        </Button>
        <Button onClick={() => showMessage('fail')}>
          ERROR
        </Button>
      </div>
      
      <Divider direction="horizontal" />
      
      <div style={{ marginTop: '30px', pointerEvents: 'auto' }}>
        <Button onClick={showNotification}>
          SHOW NOTIFICATION
        </Button>
      </div>
      
      <Divider direction="horizontal" />
      
      <div style={{ marginTop: '30px', pointerEvents: 'auto' }}>
        <Title 
          content="Switch" 
          size="medium"
          selectedBgColor="#1cfeff"
          selectedFontColor="#000"
          fontColor="#fff"
        />
        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <Switch value={switchValue} onChange={setSwitchValue} size="small" />
          <Switch value={switchValue} onChange={setSwitchValue} size="medium" />
          <Switch value={switchValue} onChange={setSwitchValue} size="large" />
        </div>
        <Text size="small" style={{ marginTop: '10px', color: '#ccc' }}>
          Status: {switchValue ? 'ON' : 'OFF'}
        </Text>
      </div>
      
      <Divider direction="horizontal" />
      
      <div style={{ marginTop: '30px', pointerEvents: 'auto' }}>
        <Title 
          content="Slider" 
          size="medium"
          selectedBgColor="#ff0022"
          selectedFontColor="#fff"
          fontColor="#fff"
        />
        <div style={{ marginTop: '15px' }}>
          <Slider 
            value={sliderValue} 
            onChange={setSliderValue}
            leftText="MIN"
            rightText="MAX"
            min={0}
            max={100}
            width={200}
          />
        </div>
        <Text size="small" style={{ marginTop: '10px', color: '#ccc' }}>
          Value: {sliderValue}
        </Text>
      </div>
      
      <Divider direction="horizontal" />
      
      <div style={{ marginTop: '30px', pointerEvents: 'auto' }}>
        <Title 
          content="Icon" 
          size="medium"
          selectedBgColor="#1cfeff"
          selectedFontColor="#000"
          fontColor="#fff"
        />
        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
          <Icon name="back" type="btn" />
          <Icon name="akechi" type="party" />
        </div>
      </div>
      
      <Divider direction="horizontal" />
      
      <div style={{ marginTop: '40px' }}>
        <Title 
          content="All Components" 
          size="large"
          selectedBgColor="#1cfeff"
          selectedFontColor="#000"
          fontColor="#fff"
        />
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        marginTop: '20px'
      }}>
        <Text size="small">Button</Text>
        <Divider direction="vertical" style={{ height: '30px' }} />
        <Text size="small">Title</Text>
        <Divider direction="vertical" style={{ height: '30px' }} />
        <Text size="small">Text</Text>
        <Divider direction="vertical" style={{ height: '30px' }} />
        <Text size="small">Divider</Text>
        <Divider direction="vertical" style={{ height: '30px' }} />
        <Text size="small">Switch</Text>
        <Divider direction="vertical" style={{ height: '30px' }} />
        <Text size="small">Slider</Text>
        <Divider direction="vertical" style={{ height: '30px' }} />
        <Text size="small">Icon</Text>
        <Divider direction="vertical" style={{ height: '30px' }} />
        <Text size="small">Message</Text>
        <Divider direction="vertical" style={{ height: '30px' }} />
        <Text size="small">Notification</Text>
      </div>
    </div>
  )
}

function App() {
  return (
    <MessageProvider>
      <NotificationProvider>
        <div style={{
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff',
          fontFamily: 'sans-serif',
          position: 'relative',
          zIndex: 1,
          padding: '40px 0',
        }}>
          <CrowdBackground
            loop={true}
            fixed={true}
            resize={true}
            step={2}
            opacity={0.8}
          />
          
          <DemoButtons />
        </div>
      </NotificationProvider>
    </MessageProvider>
  )
}

export default App
