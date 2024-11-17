const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Car", function () {
  let Car, car;
  let owner, garage, addr1, addr2;

  beforeEach(async function () {
    Car = await ethers.getContractFactory("Car");
    [owner, garage, addr1, addr2] = await ethers.getSigners();
    car = await Car.deploy();

    // Register and assign GARAGE_ROLE to `garage`
    await car.connect(owner).registerGarage(garage.address, "SuperGarage", "CityCenter", "123456789");
  });

  it("Should deploy and set roles correctly", async function () {
    expect(await car.hasRole(car.ADMIN_ROLE(), owner.address)).to.equal(true);
    expect(await car.hasRole(car.GARAGE_ROLE(), garage.address)).to.equal(true); // Confirm garage has role
  });

  it("Should mint a new vehicle", async function () {
    const technicalControl = { isValid: true, expirationDate: Math.floor(Date.now() / 1000) + 31536000 };
    await car.connect(garage).mintVehicle(
      addr1.address,
      1,
      "Toyota",
      "ABC123",
      "CERT123",
      0,
      technicalControl
    );

    expect(await car.ownerOf(1)).to.equal(addr1.address);
    const vehicleInfo = await car.getVehicleInformations(1);
    expect(vehicleInfo.brand).to.equal("Toyota");
    expect(vehicleInfo.chassisNumber).to.equal("ABC123");
  });

  it("Should allow garage to add a repair", async function () {
    const technicalControl = { isValid: true, expirationDate: Math.floor(Date.now() / 1000) + 31536000 };
    await car.connect(garage).mintVehicle(addr1.address, 2, "Honda", "XYZ789", "CERT456", 0, technicalControl);
  
    // Add a repair from the garage account with all Garage fields
    const garageInfo = {
      name: "SuperGarage",
      location: "CityCenter",
      phoneNumber: "123456789",
      isRegistered: true // Include isRegistered field
    };
    await car.connect(garage).addRepair(2, "Engine repair", garageInfo);
  
    // Verify that the repair count has increased
    expect(await car.getRepairCount(2)).to.equal(1);
  });

  it("Should update the technical control", async function () {
    const technicalControl = { isValid: true, expirationDate: Math.floor(Date.now() / 1000) + 31536000 };
    await car.connect(garage).mintVehicle(addr1.address, 3, "Ford", "LMN456", "CERT789", 0, technicalControl);

    // Update the technical control using the garage account
    const newExpirationDate = Math.floor(Date.now() / 1000) + 63072000; // 2 years from now
    await car.connect(garage).updateTechnicalControl(3, false, newExpirationDate);

    // Verify the updated technical control
    const tc = await car.getTechnicalControl(3);
    expect(tc.isValid).to.equal(false);
    expect(tc.expirationDate).to.equal(newExpirationDate);
  });

  it("Should change the vehicle state", async function () {
    const technicalControl = { isValid: true, expirationDate: Math.floor(Date.now() / 1000) + 31536000 };
    await car.connect(garage).mintVehicle(addr1.address, 4, "Nissan", "LMN987", "CERT654", 0, technicalControl);

    // Change the vehicle state using the garage account
    await car.connect(garage).changeState(4, 1); // Changing state to "Stolen"

    // Verify the vehicle's state
    const vehicleInfo = await car.getVehicleInformations(4);
    expect(vehicleInfo.state).to.equal(1); // Should be "Stolen"
  });

  
  it("Should fail to add repair without GARAGE_ROLE", async function () {
    const technicalControl = { isValid: true, expirationDate: Math.floor(Date.now() / 1000) + 31536000 };
    await car.connect(garage).mintVehicle(addr1.address, 5, "BMW", "QWE123", "CERT111", 0, technicalControl);

    // Check that the vehicle exists
    expect(await car.ownerOf(5)).to.equal(addr1.address); // Ensure vehicle exists

    const garageInfo = {
        name: "UnauthorizedGarage",
        location: "Unknown",
        phoneNumber: "987654321",
        isRegistered: true
    };

    await expect(
        car.connect(addr1).addRepair(5, "Brake repair", garageInfo)
    ).to.be.reverted;
  });
});
