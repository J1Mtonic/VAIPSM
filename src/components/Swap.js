import { notification, Input } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useState, useEffect, useRef } from 'react';
import VAIlogo from '../vai.svg';
import USDTlogo from '../usdt.svg';
import { readContract, writeContract, fetchBalance, erc20ABI } from '@wagmi/core';
import { PegStabilityABI } from '../abi';
import { formatEther, formatUnits, parseUnits } from 'viem';

function Swap(props) {
  const { address, isConnected, networkConfig } = props;
  const { VAIPSMcontract, chainId } = networkConfig;
  const [tokenFromAmount, setTokenFromAmount] = useState(0);
  const [tokenToAmount, setTokenToAmount] = useState(0);
  const [tokenFrom, setTokenFrom] = useState({ ticker: "VAI", ...networkConfig.VAI });
  const [tokenTo, setTokenTo] = useState({ ticker: "USDT", ...networkConfig.USDT });
  const [vaiBalance, setVaiBalance] = useState("---");
  const [usdtBalance, setUsdtBalance] = useState("---");
  const [isApproved, setIsApproved] = useState(false);
  const tokenFromRef = useRef(tokenFrom);
  const tokenToRef = useRef(tokenTo);
  const icons = {
    VAI: VAIlogo,
    USDT: USDTlogo
  };
  const openNotificationSuccess = (message, description) => {
    notification.success({
      message: message,
      description: description,
    });
  };
  const openNotificationError = (message, description) => {
    notification.error({
      message: message,
      description: description,
    });
  };

  useEffect(() => {
    if (props.resetBalances) {
      setVaiBalance("---");
      setUsdtBalance("---");
      props.setResetBalances(false);
    }
  }, [props.resetBalances]);

  useEffect(() => {
    let balanceInterval;
    if (isConnected) {
      balanceInterval = setInterval(updateBalances, 1000);
    }
    return () => {
      clearInterval(balanceInterval);
    };
  }, [isConnected]);

  useEffect(() => {
    updateBalances();
    checkTokenApproval();
    checkSwap(tokenFromAmount);
  }, [isConnected, tokenFrom, tokenFromAmount]);

  useEffect(() => {
    tokenFromRef.current = tokenFrom;
  }, [tokenFrom]);

  useEffect(() => {
    tokenToRef.current = tokenTo;
  }, [tokenTo]);

  const handleInputFocus = (e) => {
    if (e.target.value === '0') {
      setTokenFromAmount('');
    }
  }

  const handleInputChange = (e) => {
    let value = e.target.value;

    if (value === '') {
      setTokenFromAmount('0');
      setTokenToAmount('0');
      return;
    }

    const isValid = /^\d{1,8}$/.test(value);
    if (!isValid) {
      return;
    }

    if (tokenFromAmount === '0' && value !== '0.') {
      value = value.slice(1);
    }

    setTokenFromAmount(prevValue => {
      if (prevValue !== value) {
        checkSwap(value);
      }
      return value;
    });
  }

  const checkSwap = async (value) => {
    if (value === '0') return;
    let functionName = '';
    if (tokenFrom.ticker === "VAI") {
      functionName = 'previewSwapVAIForStable';
    } else if (tokenFrom.ticker === "USDT") {
      functionName = 'previewSwapStableForVAI';
    }

    if (value && functionName) {
      try {
        const result = await readContract({
          address: VAIPSMcontract,
          abi: PegStabilityABI,
          functionName: functionName,
          args: [value.toString()],
        });
        const resultAmount = (1000000 * formatEther(result)).toFixed(2);
        setTokenToAmount(resultAmount.endsWith('.00') ? parseInt(resultAmount, 10).toString() : resultAmount);
      } catch (error) {
        console.error(`Error calling ${functionName}:`, error);
      }
    } else {
      setTokenToAmount(0);
    }
  }

  const switchTokens = () => {
    setTokenFrom(tokenTo);
    setTokenTo(tokenFromRef.current);
    checkTokenApproval();
  }

  const updateBalances = async () => {
    if (!isConnected) return;
    const fromBalance = await fetchBalance({
      address: address,
      token: tokenFrom.address
    });
    const toBalance = await fetchBalance({
      address: address,
      token: tokenTo.address
    });
    if (tokenFrom.ticker === "VAI") {
      setVaiBalance(fromBalance.formatted);
      setUsdtBalance(toBalance.formatted);
    } else {
      setUsdtBalance(fromBalance.formatted);
      setVaiBalance(toBalance.formatted);
    }
  };

  const checkTokenApproval = async () => {
    if (!isConnected) return;

    const requiredAmount = parseUnits(tokenFromAmount.toString(), 6);
    let approved = false;
    const allowance = await checkApproval(tokenFrom.address, VAIPSMcontract);
    const formattedAllowance = formatUnits(allowance.toString(), 18);

    approved = Number(formattedAllowance) * Math.pow(10, 6) >= Number(requiredAmount);
    setIsApproved(approved);
  }

  const checkApproval = async (tokenAddress, spender) => {
    try {
      const allowance = await readContract({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: 'allowance',
        args: [address, spender],
        chainId: chainId
      });
      return allowance;
    } catch (error) {
      console.error("Error checking token approval:", error);
      return false;
    }
  }

  const handleApprove = async (tokenAddress, spender) => {
    try {
      const { hash } = await writeContract({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: 'approve',
        args: [spender, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"],
        chainId: chainId
      });
      console.log(`Approval transaction hash: ${hash}`);
      checkTokenApproval();
      openNotificationSuccess('Success', 'Token approved successfully!');
    } catch (error) {
      console.error("Error approving token:", error);
      openNotificationError('Error', 'Token approval failed.');
    }
  }

  const handleSwap = async () => {
    if (!isApproved) {
      await handleApprove(tokenFrom.address, VAIPSMcontract);
    } else {
      let functionName;
      if (tokenFrom.ticker === "VAI") {
        functionName = 'swapVAIForStable';
      } else if (tokenFrom.ticker === "USDT") {
        functionName = 'swapStableForVAI';
      }

      if (functionName) {
        try {
          const { hash } = await writeContract({
            address: VAIPSMcontract,
            abi: PegStabilityABI,
            functionName: functionName,
            args: [address, parseUnits(tokenFromAmount.toString(), 6)],
            chainId: chainId
          });
          console.log("Transaction hash:", hash);
          updateBalances();
          openNotificationSuccess('Success', 'Swap executed successfully!');
        } catch (error) {
          console.error(`Error calling ${functionName}:`, error);
          openNotificationError('Error', 'Swap execution failed.');
        }
      }
    }
  }

  return (
    <>
      <div className='tradeBox'>
        <div className='tradeBoxHeader'>
          <h4>VAI PSM</h4>
        </div>
        <div className="inputGroup">
          <label>From</label>
          <div className="inputWrapper">
            <Input placeholder='0' value={tokenFromAmount} onChange={handleInputChange} onFocus={handleInputFocus} />
            <div className='assetLogo'>
              <img src={icons[tokenFrom.ticker]} alt={`${tokenFrom.ticker} logo`} />
              <span>{tokenFrom.ticker}</span>
            </div>
          </div>
          <span className="walletBalance">
            <span className="balanceLabel">Wallet Balance:</span>
            <span className="balanceAmount">
              {tokenFrom.ticker === "VAI" ? `${vaiBalance} VAI` : `${usdtBalance} USDT`}
            </span>
          </span>
        </div>
        <div className="switchButton" onClick={switchTokens}>
          <SwapOutlined style={{ transform: 'rotate(90deg)' }} className='switchArrow' />
        </div>
        <div className="inputGroup">
          <label>To</label>
          <div className="inputWrapper">
            <Input placeholder='0' value={tokenToAmount} disabled={true} />
            <div className='assetLogo'>
              <img src={icons[tokenTo.ticker]} alt={`${tokenTo.ticker} logo`} />
              <span>{tokenTo.ticker}</span>
            </div>
          </div>
          <span className="walletBalance">
            <span className="balanceLabel">Wallet Balance:</span>
            <span className="balanceAmount">
              {tokenTo.ticker === "VAI" ? `${vaiBalance} VAI` : `${usdtBalance} USDT`}
            </span>
          </span>
        </div>
        <div
          className='swapButton'
          onClick={handleSwap}
          disabled={!tokenFromAmount || parseFloat(tokenFromAmount) === 0 || !isConnected}
        >
          {isApproved ? 'Swap' : `Approve ${tokenFrom.ticker}`}
        </div>
      </div>
    </>
  )
}

export default Swap