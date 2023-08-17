export const userGuide = `
Introduction:
The VAI PEG Stability Module UI offers an intuitive interface, built on the solid foundation of the Venus Protocol's VAI PEG Stability Module. Tailored for seamless cryptocurrency transactions, this interface allows users to interact effortlessly with the VAI PEG contracts. The underlying contract ensures that the VAI stablecoin remains pegged at a value of $1.

UI Components:
- Connect Wallet Button:
This feature enables users to link their wallets to the platform, paving the way for secure blockchain transactions. With the WAGMI's Injected Mode, the system utilizes your default wallet credentials.

- Swap Interface (Convert Functionality):
Users can interchange VAI and USDT directly within this module. The Switch Button toggles between two primary functionalities: "Swap USDT for VAI" and "Swap VAI for USDT."
Notably, the "You Swap" and "You Get" labels alternate. This design choice stems from the VAI PSM's smart contract, which always treats USDT as input. This slight deviation from the conventional swap UI is meticulously explained in the official VAI PSM documentation.
Upon connecting your wallet, you'll be presented with your Wallet Balance for both USDT and VAI. Before executing a swap, you must authorize the USDT/VAI for trading on the VAI PSM contract. This is achieved by pressing the corresponding button. Once approved, you can commence the swap for your desired amount.
After completing the transaction, you might wish to revoke the prior authorization. This can be swiftly done by clicking on the USDT/VAI logos.

Benefits:
A standout advantage of utilizing the VAI PSM over traditional swaps is the minimization of price impact, especially during large VAI/USDT swaps.

This UI was crafted using JS React, WAGMI and Antd.
`;