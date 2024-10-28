const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Car", function () {
  let Car, car;
  let owner, garage, addr1, addr2;

  beforeEach(async function () {
    // Obtenir la fabrique de contrat et les signers
    Car = await ethers.getContractFactory("Car");
    [owner, garage, addr1, addr2] = await ethers.getSigners();
    car = await Car.deploy();
  });

  it("Should deploy and set roles correctly", async function () {
    expect(await car.hasRole(car.ADMIN_ROLE(), owner.address)).to.equal(true);
    expect(await car.hasRole(car.GARAGE_ROLE(), owner.address)).to.equal(true);
  });

  it("Should mint a new vehicle", async function () {
    const technicalControl = { isValid: true, expirationDate: Math.floor(Date.now() / 1000) + 31536000 }; // Validité d'1 an
    await car.mintVehicle(addr1.address, 1, "Toyota", "ABC123", "CERT123", 0, technicalControl);

    // Vérifie le propriétaire du token
    expect(await car.ownerOf(1)).to.equal(addr1.address);

    // Vérifie les informations du véhicule
    const vehicleInfo = await car.getVehicleInformations(1);
    expect(vehicleInfo.brand).to.equal("Toyota");
    expect(vehicleInfo.chassisNumber).to.equal("ABC123");
    expect(vehicleInfo.registrationCertificate).to.equal("CERT123");
    expect(vehicleInfo.state).to.equal(0); 
  });

  it("Should allow garage to add a repair", async function () {
    const technicalControl = { isValid: true, expirationDate: Math.floor(Date.now() / 1000) + 31536000 };
    await car.mintVehicle(addr1.address, 2, "Honda", "XYZ789", "CERT456", 0, technicalControl);
    await car.grantRole(car.GARAGE_ROLE(), garage.address);

    // Ajoute une réparation depuis le compte garage
    const garageInfo = { name: "SuperGarage", location: "CityCenter", phoneNumber: "123456789" };
    await car.connect(garage).addRepair(2, "Engine repair", garageInfo);

    // Vérifie que le nombre de réparations a augmenté
    expect(await car.getRepairCount(2)).to.equal(1);
  });

  it("Should update the technical control", async function () {
    const technicalControl = { isValid: true, expirationDate: Math.floor(Date.now() / 1000) + 31536000 };
    await car.mintVehicle(addr1.address, 3, "Ford", "LMN456", "CERT789", 0, technicalControl);
    await car.grantRole(car.GARAGE_ROLE(), garage.address);

    // Mettre à jour le contrôle technique
    const newExpirationDate = Math.floor(Date.now() / 1000) + 63072000; // 2 ans à partir de maintenant
    await car.connect(garage).updateTechnicalControl(3, false, newExpirationDate);

    // Vérifie le contrôle technique mis à jour
    const tc = await car.getTechnicalControl(3);
    expect(tc.isValid).to.equal(false);
    expect(tc.expirationDate).to.equal(newExpirationDate);
  });

  it("Should change the vehicle state", async function () {
    const technicalControl = { isValid: true, expirationDate: Math.floor(Date.now() / 1000) + 31536000 };
    await car.mintVehicle(addr1.address, 4, "Nissan", "LMN987", "CERT654", 0, technicalControl);

    // Accorder le rôle GARAGE_ROLE au compte garage
    await car.grantRole(car.GARAGE_ROLE(), garage.address);

    // Change l'état du véhicule
    await car.connect(garage).changeState(4, 1);

    const vehicleInfo = await car.getVehicleInformations(4);
    expect(vehicleInfo.state).to.equal(1); // Vérifie que l'état est maintenant volé
  });

  it("Should fail to add repair without GARAGE_ROLE", async function () {
    const technicalControl = { isValid: true, expirationDate: Math.floor(Date.now() / 1000) + 31536000 };
    await car.mintVehicle(addr1.address, 5, "BMW", "QWE123", "CERT111", 0, technicalControl);
  
    // Essaie d'ajouter une réparation sans avoir le GARAGE_ROLE
    const garageInfo = { name: "UnauthorizedGarage", location: "Unknown", phoneNumber: "987654321" };
    
    // Nous nous attendons à ce que la transaction échoue en raison du manque de permissions
    await expect(
      car.connect(addr1).addRepair(5, "Brake repair", garageInfo)
    ).to.be.reverted;
  });
});
