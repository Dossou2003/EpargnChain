const SAVINGS_V2_ABI = [
    // Events
    "event SavingsCreated(address indexed user, uint256 amount, uint256 duration)",
    "event WithdrawCompleted(address indexed user, uint256 amount)",
    "event EmergencyWithdraw(address indexed user, uint256 amount, uint256 penalty)",
    "event GroupCreated(uint256 indexed groupId, string name, address indexed creator)",
    "event MemberInvited(uint256 indexed groupId, address indexed member)",
    "event MemberJoined(uint256 indexed groupId, address indexed member)",
    "event GroupDeposit(uint256 indexed groupId, address indexed member, uint256 amount)",
    "event GroupWithdraw(uint256 indexed groupId, address indexed member, uint256 amount)",

    // View Functions
    "function minSavingsAmount() view returns (uint256)",
    "function minGroupSavingsAmount() view returns (uint256)",
    "function getGroupInfo(uint256 groupId) view returns (string, uint256, uint256, uint256, uint256, uint256, bool, address)",
    "function getGroupMembers(uint256 groupId) view returns (address[])",
    "function getMemberContribution(uint256 groupId, address member) view returns (uint256, uint256, bool)",
    "function getUserGroups(address user) view returns (uint256[])",
    "function getPendingRewards(uint256 groupId, address member) view returns (uint256)",

    // Write Functions
    "function createSavings(uint256 amount, uint256 duration)",
    "function withdraw(uint256 savingsId)",
    "function emergencyWithdraw(uint256 savingsId)",
    "function createGroup(string name, uint256 duration, uint256 minMonthlyAmount, uint256 maxMembers)",
    "function inviteMember(uint256 groupId, address member)",
    "function joinGroup(uint256 groupId)",
    "function depositToGroup(uint256 groupId, uint256 amount)",
    "function withdrawFromGroup(uint256 groupId)",
    "function emergencyWithdrawFromGroup(uint256 groupId)",
];
