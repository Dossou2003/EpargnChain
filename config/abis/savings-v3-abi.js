export const SAVINGS_V3_ABI = [
    // View Functions
    "function getMinimumSavingsAmount() view returns (uint256)",
    "function getMinimumGroupAmount() view returns (uint256)",
    "function getSavingsByAddress(address user) view returns (tuple(uint256 id, uint256 amount, uint256 duration, uint256 startTime, bool isActive)[])",
    "function getGroupSavings(uint256 groupId) view returns (tuple(uint256 id, string name, uint256 minAmount, uint256 duration, uint256 maxMembers, address owner, bool isActive))",
    "function getUserGroups(address user) view returns (uint256[])",
    
    // State-Changing Functions
    "function createSavings(uint256 amount, uint256 duration) returns (uint256)",
    "function withdrawSavings(uint256 savingsId) returns (bool)",
    "function createGroup(string name, uint256 minAmount, uint256 duration, uint256 maxMembers) returns (uint256)",
    "function joinGroup(uint256 groupId) returns (bool)",
    "function depositToGroup(uint256 groupId, uint256 amount) returns (bool)",
    
    // Events
    "event SavingsCreated(address indexed user, uint256 indexed savingsId, uint256 amount, uint256 duration)",
    "event SavingsWithdrawn(address indexed user, uint256 indexed savingsId, uint256 amount)",
    "event GroupCreated(uint256 indexed groupId, address indexed owner, string name)",
    "event GroupJoined(uint256 indexed groupId, address indexed user)",
    "event GroupDeposit(uint256 indexed groupId, address indexed user, uint256 amount)"
];
