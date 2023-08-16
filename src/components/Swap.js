import { notification, Input, Modal } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useState, useEffect, useRef } from 'react';
import VAIlogo from '../vai.svg';
import USDTlogo from '../usdt.svg';
import { readContract, writeContract, fetchBalance, erc20ABI } from '@wagmi/core';
import { PegStabilityABI } from '../abi';
import { formatUnits, parseUnits } from 'viem';

function Swap(props) {
  const { address, isConnected, networkConfig } = props;
  const { VAIPSMcontract, chainId } = networkConfig;
  const [swapDirection, setSwapDirection] = useState("SwapUSDTForVAI");
  const [tokenFromAmount, setTokenFromAmount] = useState(0);
  const [tokenToAmount, setTokenToAmount] = useState(0);
  const tokenFrom = { ticker: "USDT", ...networkConfig.USDT };
  const tokenTo = { ticker: "VAI", ...networkConfig.VAI };
  const [vaiBalance, setVaiBalance] = useState("---");
  const [usdtBalance, setUsdtBalance] = useState("---");
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const relevantTokenAmount = swapDirection === "SwapUSDTForVAI" ? tokenFromAmount : tokenToAmount;
  const relevantTicker = swapDirection === "SwapUSDTForVAI" ? tokenFrom.ticker : tokenTo.ticker;
  const prevTokenFromAmountRef = useRef();
  const tokenFromRef = useRef(tokenFrom);
  const tokenToRef = useRef(tokenTo);
  const switchClickedRef = useRef(false);
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
    if (switchClickedRef.current) {
      checkSwap(tokenFromAmount);
      switchClickedRef.current = false;
    } else if (prevTokenFromAmountRef.current !== tokenFromAmount) {
      checkSwap(tokenFromAmount);
    }
    prevTokenFromAmountRef.current = tokenFromAmount;
    updateBalances();
    checkTokenApproval();
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
    setTokenFromAmount(value);
  };

  const checkSwap = async (value) => {
    if (value.toString() === "0" || value === '') return;
    let functionName = '';
    if (swapDirection === "SwapUSDTForVAI") {
      functionName = 'previewSwapStableForVAI';
    } else {
      functionName = 'previewSwapVAIForStable';
    }

    if (value && functionName) {
      try {
        const result = await readContract({
          address: VAIPSMcontract,
          abi: PegStabilityABI,
          functionName: functionName,
          args: [parseUnits(value.toString(), tokenFrom.decimals)],
        });
        const resultAmount = parseFloat(formatUnits(result, 18)).toFixed(2);
        setTokenToAmount(resultAmount.endsWith('.00') ? parseInt(resultAmount, 10).toString() : resultAmount);
      } catch (error) {
        console.error(`Error calling ${functionName}:`, error);
        openNotificationError('Error: Error calling Swap Preview', `${error.message}`);
      }
    } else {
      setTokenToAmount(0);
    }
  };

  const switchTokens = () => {
    switchClickedRef.current = true;
    setIsLoading(true);
    setSwapDirection(prev => {
      const newDirection = prev === "SwapUSDTForVAI" ? "SwapVAIForUSDT" : "SwapUSDTForVAI";
      return newDirection;
    });
    checkTokenApproval();
  };
  
  const updateBalances = async () => {
    if (!isConnected) return;
    const [newUsdtBalance, newVaiBalance] = await Promise.all([
      fetchBalance({ address, token: tokenFrom.address }),
      fetchBalance({ address, token: tokenTo.address })
    ]);
    if (newUsdtBalance.formatted !== usdtBalance) {
      setUsdtBalance(newUsdtBalance.formatted);
    }
    if (newVaiBalance.formatted !== vaiBalance) {
      setVaiBalance(newVaiBalance.formatted);
    }
  };

  const checkTokenApproval = async () => {
    if (!isConnected || relevantTokenAmount.toString() == "0" || relevantTokenAmount === '') return;
    console.log("checkTokenApproval executed");

    const requiredAmount = parseUnits(relevantTokenAmount.toString(), tokenFrom.decimals);
    const allowance = await checkApproval(relevantTicker === "USDT" ? tokenFrom.address : tokenTo.address, VAIPSMcontract);
    const formattedAllowance = formatUnits(allowance.toString(), 18);

    const approved = Number(formattedAllowance) * Math.pow(10, tokenFrom.decimals) >= Number(requiredAmount);
    setIsApproved(approved);
    setIsLoading(false);
  };

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
      openNotificationError('Error: Checking token approval failed', `${error.message}`);
      return false;
    }
  };

  const handleSwap = async () => {
    let tokenToApprove;
    let functionName;

    if (swapDirection === "SwapUSDTForVAI") {
      tokenToApprove = tokenFrom;
      functionName = 'swapStableForVAI';
    } else {
      tokenToApprove = tokenTo;
      functionName = 'swapVAIForStable';
    }

    if (!isApproved) {
      await handleApprove(tokenToApprove.address, VAIPSMcontract);
    } else {
      if (functionName) {
        try {
          const { hash } = await writeContract({
            address: VAIPSMcontract,
            abi: PegStabilityABI,
            functionName: functionName,
            args: [address, parseUnits(tokenFromAmount.toString(), tokenFrom.decimals)],
            chainId: chainId
          });
          console.log("Transaction hash:", hash);
          await updateBalances();
          openNotificationSuccess('Success', 'Swap executed successfully!');
        } catch (error) {
          console.error(`Error calling ${functionName}:`, error);
          openNotificationError('Error: Swap execution failed', `${error.message}`);
        }
      }
    }
  };

  const handleApprove = async (tokenAddress, spender) => {
    try {
      const { hash } = await writeContract({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: 'approve',
        args: [spender, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"],
        chainId: chainId
      });
      setIsLoading(true);
      console.log(`Approval transaction hash: ${hash}`);
      openNotificationSuccess('Success', 'Token approved successfully!');
      await checkTokenApproval();
    } catch (error) {
      console.error("Error approving token:", error);
      openNotificationError('Error: Token approval failed', `${error.message}`);
    }
  };

  const handleRevoke = async (tokenAddress, spender) => {
    try {
      const { hash } = await writeContract({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: 'approve',
        args: [spender, "0x0"],
        chainId: chainId
      });
      setIsLoading(true);
      console.log(`Revoke transaction hash: ${hash}`);
      openNotificationSuccess('Success', 'Token revoked successfully!');
      await checkTokenApproval();
    } catch (error) {
      console.error("Error revoking token:", error);
      openNotificationError('Error: Token revoked failed', `${error.message}`);
    }
  };

  const askForRevoke = (tokenAddress) => {
    if (!isConnected) return;
    Modal.confirm({
      title: 'Please confirm',
      content: '¿Do you want to Revoke it?',
      cancelText: 'No',
      okText: 'Yes',
      onOk: () => handleRevoke(tokenAddress, VAIPSMcontract),
    });
  };

  return (
    <>
      <div className='tradeBox'>
        <div className='tradeBoxHeader'>
          <h4>VAI PSM {props.useTestnet ? '"Testnet"' : ''}</h4>
          <h4>
            {swapDirection === "SwapUSDTForVAI" ? "Swap USDT For VAI" : "Swap VAI For USDT"}
          </h4>
        </div>
        <div className="inputGroup">
          <label>
            {swapDirection === "SwapUSDTForVAI" ? "You Swap" : "You Get"}
          </label>
          <div className="inputWrapper">
            <Input
              placeholder='0'
              value={tokenFromAmount}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              min={props.useTestnet && swapDirection !== "SwapVAIForUSDT" ? '0' : '100'}
            />
            <div className='assetLogo' onClick={() => askForRevoke(tokenFrom.address)}>
              <img src={icons[tokenFrom.ticker]} alt={`${tokenFrom.ticker} logo`} />
              <span>{tokenFrom.ticker}</span>
            </div>
          </div>
          <span className="walletBalance">
            <span className="balanceLabel">Wallet Balance:</span>
            <span className="balanceAmount">{`${usdtBalance} USDT`}</span>
          </span>
        </div>
        <div className="switchButton" onClick={switchTokens}>
          <SwapOutlined className='switchArrow' />
        </div>
        <div className="inputGroup">
          <label>
            {swapDirection === "SwapUSDTForVAI" ? "You Get" : "You Swap"}
          </label>
          <div className="inputWrapper">
            <Input placeholder='0' className="vaiInput" value={tokenToAmount} disabled={true} />
            <div className='assetLogo' onClick={() => askForRevoke(tokenTo.address)}>
              <img src={icons[tokenTo.ticker]} alt={`${tokenTo.ticker} logo`} />
              <span>{tokenTo.ticker}</span>
            </div>
          </div>
          <span className="walletBalance">
            <span className="balanceLabel">Wallet Balance:</span>
            <span className="balanceAmount">{`${vaiBalance} VAI`}</span>
          </span>
        </div>
        {isConnected ? (
          <div
            className='swapButton'
            onClick={handleSwap}
            disabled={isLoading || !relevantTokenAmount || parseFloat(relevantTokenAmount) === 0}
          >
            {isLoading ? 'Loading...' : isApproved ? 'Swap' : `Approve ${relevantTicker}`}
          </div>
        ) : null}
      </div>
    </>
  )
}

export default Swap