const {
  crypto,
  networks,
  script,
  payments,
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

main();
