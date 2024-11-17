// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.24;

// Imports
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Car is ERC721, AccessControl {
    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;
    bytes32 public constant GARAGE_ROLE = keccak256("GARAGE_ROLE");

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Enumération de l'état du véhicule
    enum VehicleState {
        InCirculation,
        Stolen,
        Wreck
    }

    // Structure représentant un Garage
    struct Garage {
        string name;
        string location;
        string phoneNumber;
        bool isRegistered;
    }

    // Structure pour les réparations
    struct Repair {
        string description;
        Garage garage;
        uint256 date;
    }

    // Structure pour les contrôles techniques
    struct TechnicalControl {
        bool isValid;
        uint256 expirationDate;
    }

    // Structure pour les informations du véhicule
    struct Vehicle {
        string brand;
        string chassisNumber;
        string registrationCertificate;
        Repair[] repairs;
        VehicleState state;
        TechnicalControl technicalControl;
    }

    // Mapping pour les informations du véhicule
    mapping(uint256 => Vehicle) private vehicles;

    // Nouveau mapping pour les garages enregistrés
    mapping(address => Garage) private registeredGarages;

    // Events pour suivre les modifications
    event RepairAdded(
        uint256 indexed tokenId,
        string description,
        uint256 date
    );
    event TechnicalControlUpdated(
        uint256 indexed tokenId,
        bool isValid,
        uint256 expirationDate
    );
    event StateChanged(uint256 indexed tokenId, VehicleState newState);
    event GarageRegistered(address indexed garageAddress, string name);

    // Constructeur
    constructor() ERC721("Car", "CAR") {
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(GARAGE_ROLE, msg.sender);
    }

    // Fonction pour enregistrer un garage
    function registerGarage(
        address garageAddress,
        string memory name,
        string memory location,
        string memory phoneNumber
    ) public onlyRole(ADMIN_ROLE) {
        require(
            !registeredGarages[garageAddress].isRegistered,
            "Garage already registered"
        );

        // Enregistrer le garage avec les informations fournies
        registeredGarages[garageAddress] = Garage({
            name: name,
            location: location,
            phoneNumber: phoneNumber,
            isRegistered: true
        });

        // Accorder le rôle GARAGE_ROLE au garage
        _grantRole(GARAGE_ROLE, garageAddress);

        emit GarageRegistered(garageAddress, name);
    }

    // Fonction pour créer (mint) un véhicule par un garage enregistré
    function mintVehicle(
        address to,
        uint256 tokenId,
        string memory brand,
        string memory chassisNumber,
        string memory registrationCertificate,
        VehicleState state,
        TechnicalControl memory technicalControl
    ) public onlyRole(GARAGE_ROLE) {
        // Removed `isRegistered` check since onlyRole ensures authorized access
        _safeMint(to, tokenId);

        Vehicle storage vehicle = vehicles[tokenId];
        vehicle.brand = brand;
        vehicle.chassisNumber = chassisNumber;
        vehicle.registrationCertificate = registrationCertificate;
        vehicle.state = state;
        vehicle.technicalControl = technicalControl;
    }


    // Fonction pour ajouter une réparation
    function addRepair(
        uint256 tokenId,
        string memory description,
        Garage memory garage
    ) public onlyRole(GARAGE_ROLE) {
        require(ownerOf(tokenId) != address(0), "Vehicle does not exist");

        vehicles[tokenId].repairs.push(
            Repair({
                description: description,
                garage: garage,
                date: block.timestamp
            })
        );

        emit RepairAdded(tokenId, description, block.timestamp);
    }



    // Fonction pour mettre à jour le contrôle technique
    function updateTechnicalControl(
        uint256 tokenId,
        bool isValid,
        uint256 expirationDate
    ) public onlyRole(GARAGE_ROLE) {
        require(ownerOf(tokenId) != address(0), "Vehicle does not exist");

        vehicles[tokenId].technicalControl = TechnicalControl({
            isValid: isValid,
            expirationDate: expirationDate
        });

        emit TechnicalControlUpdated(tokenId, isValid, expirationDate);
    }

    // Fonction pour changer l'état du véhicule
    function changeState(
        uint256 tokenId,
        VehicleState state
    ) public onlyRole(GARAGE_ROLE) {
        require(ownerOf(tokenId) != address(0), "Vehicle does not exist");

        vehicles[tokenId].state = state;

        emit StateChanged(tokenId, state);
    }

    // Récupérer les informations de base du véhicule
    function getVehicleInformations(
        uint256 tokenId
    )
        public
        view
        returns (
            string memory brand,
            string memory chassisNumber,
            string memory registrationCertificate,
            VehicleState state
        )
    {
        require(ownerOf(tokenId) != address(0), "Vehicle does not exist");

        Vehicle storage vehicle = vehicles[tokenId];
        return (
            vehicle.brand,
            vehicle.chassisNumber,
            vehicle.registrationCertificate,
            vehicle.state
        );
    }

    // Récupérer les informations de contrôle technique
    function getTechnicalControl(
        uint256 tokenId
    ) public view returns (bool isValid, uint256 expirationDate) {
        require(ownerOf(tokenId) != address(0), "Vehicle does not exist");

        TechnicalControl storage tc = vehicles[tokenId].technicalControl;
        return (tc.isValid, tc.expirationDate);
    }

    // Récupérer le nombre de réparations
    function getRepairCount(uint256 tokenId) public view returns (uint256) {
        require(ownerOf(tokenId) != address(0), "Vehicle does not exist");

        return vehicles[tokenId].repairs.length;
    }

    // Détails d'une réparation spécifique
    function getRepairDetails(
        uint256 tokenId,
        uint256 index
    )
        public
        view
        returns (
            string memory description,
            string memory garageName,
            string memory garageLocation,
            string memory garagePhone,
            uint256 date
        )
    {
        require(ownerOf(tokenId) != address(0), "Vehicle does not exist");
        require(
            index < vehicles[tokenId].repairs.length,
            "Repair does not exist"
        );

        Repair storage repair = vehicles[tokenId].repairs[index];
        return (
            repair.description,
            repair.garage.name,
            repair.garage.location,
            repair.garage.phoneNumber,
            repair.date
        );
    }
}
