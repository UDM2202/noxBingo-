const hre = require("hardhat");

const USDC_AMOY = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";

async function main() {
  const NoxBingoPolygon = await hre.ethers.getContractFactory("NoxBingoPolygon");
  const contract = await NoxBingoPolygon.deploy(USDC_AMOY);
  await contract.deployed();

  console.log("NoxBingoPolygon deployed to:", contract.address);
  console.log("USDC token:", USDC_AMOY);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
