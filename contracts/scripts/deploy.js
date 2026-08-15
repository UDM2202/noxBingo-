// Deploy to Polygon Amoy testnet
const hre = require("hardhat");

async function main() {
  const NoxBingo = await hre.ethers.getContractFactory("NoxBingo");
  const contract = await NoxBingo.deploy();
  await contract.waitForDeployment();

  console.log("NoxBingo deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
