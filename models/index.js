const User = require("./User");
const Profile = require("./Profile");
const Degree = require("./Degree");
const Certification = require("./Certification");
const Licence = require("./Licence");
const ProfessionalCourse = require("./ProfessionalCourse");
const EmploymentHistory = require("./EmploymentHistory");
const Bid = require("./Bid");
const ApiKey = require("./ApiKey");
const ApiUsageLog = require("./ApiUsageLog");
const LoginLog = require("./LoginLog");
const Session = require("./Session");
const CsrfToken = require("./CsrfToken");

// Relationships between our models
// Users and their profiles
User.hasOne(Profile);
Profile.belongsTo(User);

// Degrees, certificates, etc. under each profile
Profile.hasMany(Degree);
Degree.belongsTo(Profile);

Profile.hasMany(Certification);
Certification.belongsTo(Profile);

Profile.hasMany(Licence);
Licence.belongsTo(Profile);

Profile.hasMany(ProfessionalCourse);
ProfessionalCourse.belongsTo(Profile);

Profile.hasMany(EmploymentHistory);
EmploymentHistory.belongsTo(Profile);

// Users can place many bids
User.hasMany(Bid);
Bid.belongsTo(User);

// Developers can have multiple API keys
User.hasMany(ApiKey);
ApiKey.belongsTo(User);

// API key usage tracking
ApiKey.hasMany(ApiUsageLog);
ApiUsageLog.belongsTo(ApiKey);

// Sessions, logins, and CSRF token tracking
User.hasMany(LoginLog);
LoginLog.belongsTo(User);

User.hasMany(Session);
Session.belongsTo(User);

User.hasMany(CsrfToken);
CsrfToken.belongsTo(User);

module.exports = { User, Profile, Degree, Certification, Licence, ProfessionalCourse, EmploymentHistory, Bid, ApiKey, ApiUsageLog, LoginLog, Session, CsrfToken };
