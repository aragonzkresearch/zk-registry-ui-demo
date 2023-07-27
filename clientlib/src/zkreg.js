import { buildPoseidonReference, buildEddsa, buildBabyjub } from "circomlibjs";
import { utils as ffutils} from 'ffjavascript';
import {ethers} from "ethers";

// needed for circuitPrivK
import createBlakeHash from "blake-hash";
import {Scalar} from "ffjavascript";

async function newZKRegistry() {
	const poseidon = await buildPoseidonReference();
	const eddsa = await buildEddsa();
	const babyjub = await buildBabyjub();
	return new ZKRegistry(poseidon, eddsa, babyjub);
}

// AnonVote contains all the logic to build the data structures to vote, build
// censuses, interact with the Smart Contracts, etc.
// To interact with the Smart Contracts, it needs a web3 gateway and a contract
// address. For that, use the connect() method.
class ZKRegistry {
	constructor(poseidon, eddsa, babyjub) {
		this.poseidon = poseidon;
		this.F = this.poseidon.F;
		this.eddsa = eddsa;
		this.babyjub = babyjub;
	}

	// Connect the AnonVote instance to a web3 gateway and a contract address
	async connect(web3gw, zkContractAddress) {
		this.web3gw = web3gw;

		// This is the ABI of the AnonVoting contract
		// If you change the contract, you need to update this ABI
		// You can get the new ABI from the smartcontract's artifact folder
		// (clientlib/artifacts/contracts/AnonVoting.sol/AnonVoting.json)
		// To generate the new artifact, you need to compile the contract
		// Run `npx hardhat compile` in the root folder of the project
		const zkabi = [{"inputs":[],"name":"BBJJPK_X_INTERFACE_ID","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"BBJJPK_Y_INTERFACE_ID","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"BLS12PK_X_INTERFACE_ID","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"BLS12PK_Y_INTERFACE_ID","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"POSEIDON_INTERFACE_ID","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint8","name":"interface_id","type":"uint8"}],"name":"deregister","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint8","name":"interface_id","type":"uint8"},{"internalType":"address","name":"addr","type":"address"}],"name":"get","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint8","name":"interface_id","type":"uint8"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"register","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint8","name":"","type":"uint8"},{"internalType":"address","name":"","type":"address"}],"name":"registry","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];
		// Load the contract
		this.anonRegister = new ethers.Contract(zkContractAddress, zkabi, this.web3gw);
	}

	// Generate a BabyJubJub keypair
	// To generate the private key, we use the users signature over "AnonVote Key Generation Secret"
	// Then we hash the signature to get a 32-byte private key
	// The public key is computed from the private key using the BabyJubJub curve
	async generateKey(signature) {
		const privateKey = ethers.utils.keccak256(signature);
		const pvk    = this.eddsa.pruneBuffer(createBlakeHash("blake512").update(privateKey).digest().slice(0,32));
		const circuitPrivateKey      = Scalar.shr(ffutils.leBuff2int(pvk), 3);

		// Compute the public key by hashing the private key to the BabyJubJub curve
		const publicKey = this.eddsa.prv2pub(privateKey);

		// Store the private and public key
		this.privateKey = privateKey;
		this.circuitPrivateKey = circuitPrivateKey;
		this.publicKey = publicKey;

		// Compute the compressed public key
		const compressedPublicKey = ffutils.leBuff2int(this.babyjub.packPoint(publicKey));
		this.compressedPublicKey = ethers.utils.hexZeroPad(`0x${compressedPublicKey.toString(16)}`, 32);

		return {privateKey: this.privateKey, publicKey: this.publicKey, compressedPublicKey: this.compressedPublicKey };
	}

	// Method to generate a new process in the AnonVoting contract
	async regNewKey(id, key, signer) {
		if (!this.web3gw) {
			throw new Error("web3gw not defined. Use connect() first");
		}

			const registerWithSigner = this.anonRegister.connect(signer);

		let tx = await registerWithSigner.register(id, key);
		return  tx.hash;
	}
}

export { ZKRegistry, newZKRegistry };
