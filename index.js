const {
  crypto,
  networks,
  script,
  payments,
  opcodes,
  initEccLib,
  Transaction,
  Psbt,
} = require("bitcoinjs-lib");
const ECPairFactory = require("ecpair").default;
const ecc = require("tiny-secp256k1");
const inquirer = require("inquirer");
const fs = require("fs");
const axios = require("axios");

initEccLib(ecc);
const ECPair = ECPairFactory(ecc);
const network = networks.testnet; // Otherwise, bitcoin = mainnet and regnet = local
const crypto_ = require("crypto");

const API_URL =
  network === networks.testnet
    ? "https://api.blockchair.com/bitcoin/testnet"
    : "https://api.blockchair.com/bitcoin";

// Set your desired fee rate (in satoshis per byte)
const feeRate = 20;

let walletBalance = null;
let utxos = [];

async function main() {
  try {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?\n",
        choices: [
          "Show Transaction Details From Hex",
          "Evaluate Bitcoin Script From Hex",
          "Get Byte Encoding of a String",
          "Get Redeem Script from Pre-Image",
          "Derive a Address from a Redeem Script",
          "Construct a Transaction That Sends to the Script Address",
          "Construct a Transaction That Spends From the Address",
        ],
      },
    ]);

    // Perform the selected action
    switch (action) {
      case "Show Transaction Details From Hex":
        showTransactionDetails();
        break;
      case "Evaluate Bitcoin Script From Hex":
        evaluateBitcoinScript();
        break;
      case "Get Byte Encoding of a String":
        getByteEncoding();
        break;
      case "Get Redeem Script from Pre-Image":
        getRedeemScript();
        break;
      case "Derive a Address from a Redeem Script":
        deriveAddressFromRedeemScript();
        break;
      case "Construct a Transaction That Sends to the Script Address":
        constructTransactionThatSendsToScriptAddress();
        break;
      case "Construct a Transaction That Spends From the Address":
        constructTransactionThatSpendsFromScriptAddress();
        break;
      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function showTransactionDetails() {
  const { txnHex } = await inquirer.prompt([
    {
      type: "input",
      name: "txnHex",
      message: "Enter the transaction hex:\n",
      validate: (value) => {
        // Validate as a valid hex string
        const isValid = /^[0-9a-fA-F]+$/.test(value);
        return isValid || "Please enter a valid transaction hex.";
      },
    },
  ]);

  const transaction = Transaction.fromHex(txnHex, network);
  console.log("Version:", transaction.version);
  // console.log("Inputs:", transaction.ins.length);
  console.log("______Inputs________");
  // log the inputs
  for (let i = 0; i < transaction.ins.length; i++) {
    console.log("Input", i + 1);
    console.log("Hash:", transaction.ins[i].hash.reverse().toString("hex"));
    console.log("Index:", transaction.ins[i].index);
    console.log("Script:", transaction.ins[i].script.toString("hex"));
    console.log("Sequence:", transaction.ins[i].sequence);
  }
  // console.log("____End____of____Inputs________");
  // console.log("Outputs:", transaction.outs.length);
  console.log("______Outputs________");
  // log the outputs
  for (let i = 0; i < transaction.outs.length; i++) {
    console.log("Output", i + 1);
    console.log("Value:", transaction.outs[i].value);
    console.log("Script:", transaction.outs[i].script.toString("hex"));
  }
  // console.log("____End____of____Outputs________");
  console.log("Locktime:", transaction.locktime);
  /* console.log(
    transaction.version.toString(16).padStart(8, "0"),
    ".............................. Version"
  );

  console.log(
    transaction.ins.length.toString(16).padStart(2, "0"),
    ".................................... Number of inputs"
  );
  transaction.ins.forEach((input, i) => {
    console.log(
      "|",
      input.hash.reverse().toString("hex").padEnd(64, "0"),
      "...  Previous outpoint TXID"
    );
    console.log(
      "|",
      input.index.toString(16).padStart(8, "0"),
      "............................ Previous outpoint index"
    );
    console.log("|");
    console.log(
      "|",
      input.script.length.toString(16).padStart(2, "0"),
      ".................................. Bytes in coinbase"
    );
    console.log(
      "| |",
      input.script.toString("hex"),
      "........................ Arbitrary data"
    );
    console.log(
      "|",
      input.sequence.toString(16).padStart(8, "0"),
      "............................ Sequence"
    );
  });

  console.log(
    transaction.outs.length.toString(16).padStart(2, "0"),
    ".................................... Output count"
  );
  transaction.outs.forEach((output, i) => {
    console.log(
      "|",
      output.value.toString(16).padStart(16, "0"),
      ".................... Satoshis"
    );
    console.log(
      "|",
      output.script.length.toString(16).padStart(2, "0") +
        output.script.toString("hex"),
      "................ P2PKH script"
    );
  });

  console.log(
    transaction.locktime.toString(16).padStart(8, "0"),
    "............................ Locktime"
  ); */
}

async function evaluateBitcoinScript() {}

async function getByteEncoding() {
  const { stringToEncode } = await inquirer.prompt([
    {
      type: "input",
      name: "stringToEncode",
      message: "Enter the string to encode:\n",
      validate: (value) => {
        // Validate as a non empty string
        const isValid = value.length > 0;
        return isValid || "Please enter a valid string.";
      },
    },
  ]);
  console.log(
    "Encoding___",
    Buffer.from(stringToEncode, "utf8").toString("hex")
  );
}

async function getRedeemScript() {
  const { preImage } = await inquirer.prompt([
    {
      type: "input",
      name: "preImage",
      message: "Enter the pre-image:\n",
      validate: (value) => {
        // Validate as a valid hex string
        const isValid = /^[0-9a-fA-F]+$/.test(value);
        return isValid || "Please enter a valid pre-image hex.";
      },
    },
  ]);

  const hash = crypto_
    .createHash("sha256")
    .update(Buffer.from(preImage, "hex"))
    .digest();
  const redeemScript = script.compile([
    opcodes.OP_SHA256,
    hash,
    opcodes.OP_EQUAL,
  ]);
  console.log("Redeem Script:", redeemScript.toString("hex"));
}

async function deriveAddressFromRedeemScript() {
  const { redeemScript } = await inquirer.prompt([
    {
      type: "input",
      name: "redeemScript",
      message: "Enter the redeem script:\n",
      validate: (value) => {
        // Validate as a valid hex string
        const isValid = /^[0-9a-fA-F]+$/.test(value);
        return isValid || "Please enter a valid redeem script hex.";
      },
    },
  ]);

  const p2sh = payments.p2sh({
    redeem: { output: Buffer.from(redeemScript, "hex") },
    network,
  });
  console.log("Script Address:", p2sh.address);
}

async function constructTransactionThatSpendsFromScriptAddress() {
  const { amountToSend, scriptAddress } = await inquirer.prompt([
    {
      type: "input",
      name: "amountToSend",
      message: "Enter the amount to send (in satoshis):\n",
      validate: (value) => {
        // Validate as a number
        const isValid = !isNaN(value);
        return isValid || "Please enter a valid number.";
      },
    },
    {
      type: "input",
      name: "scriptAddress",
      message: "Enter the script address:\n",
      validate: (value) => {
        try {
          payments.p2sh({ address: value, network });
          return true;
        } catch (error) {
          return "Please enter a valid script address.";
        }
      },
    },
  ]);

  const { txid, vout } = await getUtxo(scriptAddress);
  const { privateKey } = await inquirer.prompt([
    {
      type: "input",
      name: "privateKey",
      message: "Enter the private key of the address:\n",
      validate: (value) => {
        // Validate as a valid private key
        const isValid = ECPair.fromPrivateKey(Buffer.from(value, "hex"));
        return isValid || "Please enter a valid private key.";
      },
    },
  ]);

  const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, "hex"));
  const p2sh = payments.p2sh({ address: scriptAddress, network });
  const p2pkh = payments.p2pkh({
    pubkey: keyPair.publicKey,
    network,
  });

  const psbt = new Psbt({ network });

  psbt.addInput({
    hash: txid,
    index: vout,
    witnessUtxo: {
      script: p2sh.output,
      value: amountToSend,
    },
    redeemScript: p2sh.redeem.output,
  });
  psbt.addOutput({
    address: p2pkh.address,
    value: amountToSend - feeRate * 2,
  });
  psbt.signInput(0, keyPair);
  psbt.validateSignaturesOfInput(0);
  psbt.finalizeAllInputs();
  console.log("Transaction Hex:", psbt.extractTransaction().toHex());
}

async function constructTransactionThatSendsToScriptAddress() {
  const { amount, scriptAddress } = await inquirer.prompt([
    {
      type: "input",
      name: "amount",
      message: "Enter the amount to send (in satoshis):\n",
      validate: (value) => {
        // Validate as a number
        const isValid = !isNaN(value);
        return isValid || "Please enter a valid number.";
      },
    },
    {
      type: "input",
      name: "scriptAddress",
      message: "Enter the script address:\n",
      validate: (value) => {
        try {
          payments.p2sh({ address: value, network });
          return true;
        } catch (error) {
          return "Please enter a valid script address.";
        }
      },
    },
  ]);

  const { privateKey, walletAddress } = await inquirer.prompt([
    {
      type: "input",
      name: "privateKey",
      message: "Enter the private key of the paying address (P2PKH):\n",
      validate: (value) => {
        try {
          ECPair.fromWIF(value);
          return true;
        } catch (error) {
          return "Please enter a valid private key.";
        }
      },
    },
    {
      type: "input",
      name: "walletAddress",
      message: "Enter the wallet address (P2PKH):\n",
      validate: (value) => {
        try {
          payments.p2pkh({ address: value, network });
          return true;
        } catch (error) {
          return "Please enter a valid wallet address.";
        }
      },
    },
  ]);

  const formatedAmount = parseFloat(amount);

  const keyPair = ECPair.fromWIF(privateKey);
  const p2sh = payments.p2sh({ address: scriptAddress, network });
  const p2wpkh = payments.p2wpkh({
    pubkey: keyPair.publicKey,
    network,
  });

  const walletData = await getAddressInfo(walletAddress);
  utxos = walletData.utxos;
  walletBalance = walletData.balance;

  const psbt = new Psbt({ network });

  let totalInputValue = 0;
  for (const utxo of utxos) {
    const rawTransaction = await getRawTransaction(utxo.transaction_hash);

    psbt.addInput({
      hash: utxo.transaction_hash,
      index: utxo.index,
      nonWitnessUtxo: rawTransaction,
    });

    totalInputValue += utxo.value;
  }

  console.log("Calculating fee...", "Wallet Balance:", walletBalance);
  // Estimate the transaction size in bytes
  let estimatedSize =
    psbt.data.inputs.length * 180 + psbt.data.outputs.length * 34 + 10;

  // Calculate the miner's fee
  let minerFee = estimatedSize * feeRate;
  console.log("Fee:", minerFee, "satoshis");

  // check if balance is sufficient
  if (walletBalance < formatedAmount * 100000000 + minerFee) {
    console.error("Insufficient balance");
    return;
  }

  const amountToSpend = formatedAmount * 100000000 - minerFee;

  if (amountToSpend === 0) {
    console.error("Amount to spend is 0");
    return;
  }

  if (totalInputValue < formatedAmount * 100000000 + minerFee) {
    console.error("Insufficient balance");
    return;
  }

  psbt.addOutput({
    address: p2sh.address,
    value: amountToSpend,
  });

  // Calculate the remaining balance after sending the amount and paying the fee
  const remainingBalance = totalInputValue - (amountToSpend + minerFee);

  // Add another output that sends the remaining balance back to the original wallet
  if (remainingBalance > 0) {
    psbt.addOutput({
      address: walletAddress,
      value: remainingBalance,
    });
  }

  console.info("\nSigning transaction...");
  for (let i = 0; i < utxos.length; i++) {
    psbt.signInput(i, keyPair); // Sign each input with the private key
  }

  console.info("\nFinalizing transaction...");
  for (let i = 0; i < utxos.length; i++) {
    psbt.finalizeInput(i); // Finalize each input
  }

  // Extract the raw transaction hex
  const txHex = psbt.extractTransaction().toHex();

  console.info("\nTransaction Hex: ", txHex);
}

async function getUtxo(scriptAddress) {
  if (utxos.length === 0) {
    const { data } = await axios.get(
      `${API_URL}/dashboards/address/${scriptAddress}?limit=1`
    );
    walletBalance = data.data[scriptAddress].address.balance;
    utxos = data.data[scriptAddress].utxo;
  }

  const { txid, vout } = utxos[0];
  return { txid, vout };
}

// Add the getAddressUtxo function
async function getAddressInfo(address) {
  const apiUrl = `${API_URL}/dashboards/address/${address}?limit=1`;

  try {
    const response = await axios.get(apiUrl);
    const utxos = response.data.data[address].utxo;
    const walletBalance = response.data.data[address].address.balance;
    return {
      utxos, // Unspent transaction outputs
      balance: walletBalance, // Wallet balance
    };
  } catch (error) {
    throw new Error(
      `Error retrieving UTXO for address ${address}: ${error.message}`
    );
  }
}

// Fetch the raw transaction data
async function getRawTransaction(txid) {
  try {
    const response = await axios.get(`${API_URL}/raw/transaction/${txid}`);
    const rawTransaction = response.data.data[txid].raw_transaction;
    return Buffer.from(rawTransaction, "hex");
  } catch (error) {
    throw new Error(
      `Error retrieving raw transaction ${txid}: ${error.message}`
    );
  }
}

main();
