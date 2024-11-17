import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import CarContractABI from '../../assets/CarContractABI.json'; // Replace with the actual path

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private contract: ethers.Contract;

  constructor() {
    this.initContract();
  }

  private async initContract() {
    // Connect to Ethereum provider (e.g., MetaMask)
    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();

    // Replace with your contract's address
    const contractAddress = '0xYourContractAddress';
    this.contract = new ethers.Contract(contractAddress, CarContractABI, signer);
  }

  // Example functions to interact with the contract
  async getVehicleInfo(tokenId: number) {
    return this.contract.getVehicleInformations(tokenId);
  }

  async getRepairCount(tokenId: number) {
    return this.contract.getRepairCount(tokenId);
  }

  async addRepair(
    tokenId: number,
    description: string,
    garage: { name: string; location: string; phoneNumber: string; isRegistered: boolean }
  ) {
    const tx = await this.contract.addRepair(tokenId, description, garage);
    return tx.wait();
  }

  async registerGarage(
    garageAddress: string,
    name: string,
    location: string,
    phoneNumber: string
  ) {
    const tx = await this.contract.registerGarage(garageAddress, name, location, phoneNumber);
    return tx.wait();
  }
}
