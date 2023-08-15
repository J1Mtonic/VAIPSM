import Logo from '../logo.svg'
import { disconnect } from '@wagmi/core'

function Header(props) {
  const { connect, isConnected, address, setResetBalances } = props;

  const handleButtonClick = async () => {
    if (isConnected) {
      await disconnect();
      setResetBalances(true); 
    } else {
      await connect();
    }
  }

  return (
    <header>
      <div className='leftH'>
        <img src={Logo} alt='VenusCommunity' className='mainlogo' />
      </div>
      <div className='rightH'>
        <div className='connectButton' onClick={handleButtonClick}>
          {isConnected ? (address.slice(0, 4) + "..." + address.slice(38)) : "Connect"}
        </div>
      </div>
    </header>
  )
}

export default Header
